-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : Pilotage et CRM
-- Lecture seule des tables de l'outil Commerce (atc_mois, commerciaux),
-- exposée uniquement sous forme d'agrégats et selon le rôle Espace Pro.
-- Les tables Commerce ne sont pas modifiées.
-- ════════════════════════════════════════════════════════════════════

-- Rôles autorisés à voir le pilotage
create function public.ep_peut_piloter() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('admin', 'codir', 'chef_service', 'chef_marche')
    from public.ep_profils where id = auth.uid() and actif), false)
$$;

-- Dernier mois de l'année pour lequel un réalisé est saisi
create function public.ep_pilotage_dernier_mois(p_annee integer) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(max(mois), 0) from public.atc_mois where annee = p_annee and realise is not null
$$;

-- ── Synthèse : société, mois, gammes, commerciaux ───────────────────
create function public.ep_pilotage_synthese(p_annee integer default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_annee integer := coalesce(p_annee, extract(year from now())::integer);
  v_dernier integer;
begin
  if not public.ep_peut_piloter() then
    raise exception 'Accès réservé à la direction et aux chefs de marché' using errcode = '42501';
  end if;
  v_dernier := public.ep_pilotage_dernier_mois(v_annee);

  return jsonb_build_object(
    'annee', v_annee,
    'dernier_mois', v_dernier,
    'societe', (
      select jsonb_build_object(
        'budget_annuel', coalesce(sum(budget), 0),
        'budget_cumul', coalesce(sum(budget) filter (where mois <= v_dernier), 0),
        'realise_cumul', coalesce(sum(realise) filter (where mois <= v_dernier), 0),
        'n1_cumul', coalesce(sum(realise_n1) filter (where mois <= v_dernier), 0),
        'n1_annuel', coalesce(sum(realise_n1), 0)
      ) from public.atc_mois where annee = v_annee
    ),
    'mois', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'mois', m.mois, 'budget', m.budget, 'realise', case when m.mois <= v_dernier then m.realise end, 'n1', m.n1
      ) order by m.mois), '[]')
      from (
        select mois, sum(budget) budget, coalesce(sum(realise), 0) realise, sum(realise_n1) n1
        from public.atc_mois where annee = v_annee group by mois
      ) m
    ),
    'gammes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'gamme', g.gamme, 'budget_annuel', g.budget_annuel, 'budget_cumul', g.budget_cumul, 'realise_cumul', g.realise_cumul, 'n1_cumul', g.n1_cumul
      ) order by g.realise_cumul desc), '[]')
      from (
        select gamme,
          sum(budget) budget_annuel,
          coalesce(sum(budget) filter (where mois <= v_dernier), 0) budget_cumul,
          coalesce(sum(realise) filter (where mois <= v_dernier), 0) realise_cumul,
          coalesce(sum(realise_n1) filter (where mois <= v_dernier), 0) n1_cumul
        from public.atc_mois where annee = v_annee group by gamme
      ) g
    ),
    'commerciaux', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'prenom', c.prenom, 'nom', c.nom, 'equipe', c.equipe, 'fonction', c.fonction,
        'budget_annuel', x.budget_annuel, 'budget_cumul', x.budget_cumul, 'realise_cumul', x.realise_cumul, 'n1_cumul', x.n1_cumul,
        'comptes', (select count(*) from public.ep_comptes e where e.commercial_id = c.id and e.actif),
        'iap_objectif', c.iap_objectif, 'iap_nouveaux', c.iap_nouveaux
      ) order by x.realise_cumul desc), '[]')
      from (
        select commercial_id,
          sum(budget) budget_annuel,
          coalesce(sum(budget) filter (where mois <= v_dernier), 0) budget_cumul,
          coalesce(sum(realise) filter (where mois <= v_dernier), 0) realise_cumul,
          coalesce(sum(realise_n1) filter (where mois <= v_dernier), 0) n1_cumul
        from public.atc_mois where annee = v_annee group by commercial_id
      ) x
      join public.commerciaux c on c.id = x.commercial_id
    )
  );
end $$;

-- ── Signaux à surveiller ────────────────────────────────────────────
create function public.ep_pilotage_signaux(p_annee integer default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_annee integer := coalesce(p_annee, extract(year from now())::integer);
  v_dernier integer;
  resultat jsonb := '[]';
begin
  if not public.ep_peut_piloter() then
    raise exception 'Accès réservé à la direction et aux chefs de marché' using errcode = '42501';
  end if;
  v_dernier := public.ep_pilotage_dernier_mois(v_annee);

  -- Commerciaux sous 85 % de leur budget cumulé
  resultat := resultat || coalesce((
    select jsonb_agg(jsonb_build_object(
      'niveau', case when pct < 75 then 'danger' else 'warning' end,
      'type', 'commercial',
      'titre', prenom || ' ' || initcap(nom),
      'detail', round(pct) || ' % du budget cumulé à fin ' || (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[greatest(v_dernier, 1)],
      'valeur', round(pct)
    ) order by pct)
    from (
      select c.prenom, c.nom, 100.0 * sum(a.realise) filter (where a.mois <= v_dernier)
             / nullif(sum(a.budget) filter (where a.mois <= v_dernier), 0) pct
      from public.atc_mois a join public.commerciaux c on c.id = a.commercial_id
      where a.annee = v_annee group by c.prenom, c.nom
    ) s where pct < 85
  ), '[]');

  -- Gammes en recul de plus de 10 % sur N-1
  resultat := resultat || coalesce((
    select jsonb_agg(jsonb_build_object(
      'niveau', 'warning', 'type', 'gamme',
      'titre', 'Gamme ' || initcap(gamme),
      'detail', 'En recul de ' || abs(round(evol)) || ' % sur un an à date',
      'valeur', round(evol)
    ) order by evol)
    from (
      select gamme, 100.0 * (sum(realise) filter (where mois <= v_dernier) - sum(realise_n1) filter (where mois <= v_dernier))
             / nullif(sum(realise_n1) filter (where mois <= v_dernier), 0) evol
      from public.atc_mois where annee = v_annee group by gamme
    ) g where evol < -10
  ), '[]');

  -- Leads dont le délai d'acceptation est dépassé
  resultat := resultat || coalesce((
    select jsonb_agg(jsonb_build_object(
      'niveau', 'danger', 'type', 'lead',
      'titre', 'Leads non acceptés dans les délais',
      'detail', n || ' lead' || case when n > 1 then 's' else '' end || ' en attente au-delà du délai d’acceptation',
      'valeur', n
    ))
    from (select count(*) n from public.ep_leads where statut = 'attribue' and attribue_le + delai_acceptation < now()) l
    where n > 0
  ), '[]');

  return resultat;
end $$;

-- ── CRM : noms des commerciaux (la table Commerce n'est lisible que par ses administrateurs) ──
create function public.ep_crm_commerciaux() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case
    when not exists (select 1 from public.ep_profils p where p.id = auth.uid() and p.actif
                     and p.role in ('admin', 'codir', 'chef_service', 'chef_marche', 'repartiteur', 'atc'))
      then '[]'::jsonb
    else coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'prenom', c.prenom, 'nom', c.nom, 'equipe', c.equipe) order by c.nom)
      from public.commerciaux c where c.actif
    ), '[]')
  end
$$;

-- ── CRM : activité par compte, calculée sur ce que l'utilisateur a le droit de voir ──
create function public.ep_crm_activite_comptes(p_jours integer default 365) returns table (
  compte_id uuid, leads integer, signes integer, en_cours integer, points integer, dernier_lead timestamptz
)
language sql stable security invoker set search_path = '' as $$
  with l as (
    select compte_id, count(*)::integer leads,
           count(*) filter (where statut = 'signe')::integer signes,
           count(*) filter (where statut in ('attribue', 'accepte', 'contacte', 'devis'))::integer en_cours,
           max(recu_le) dernier_lead
    from public.ep_leads
    where compte_id is not null and recu_le > now() - make_interval(days => p_jours)
    group by compte_id
  ),
  p as (select compte_id, sum(points)::integer points from public.ep_points group by compte_id)
  select coalesce(l.compte_id, p.compte_id), coalesce(l.leads, 0), coalesce(l.signes, 0), coalesce(l.en_cours, 0),
         coalesce(p.points, 0), l.dernier_lead
  from l full join p on p.compte_id = l.compte_id
$$;

revoke execute on function
  public.ep_peut_piloter(), public.ep_pilotage_dernier_mois(integer), public.ep_pilotage_synthese(integer),
  public.ep_pilotage_signaux(integer), public.ep_crm_commerciaux(), public.ep_crm_activite_comptes(integer)
from public, anon;

revoke execute on function public.ep_pilotage_dernier_mois(integer) from authenticated;

grant execute on function
  public.ep_peut_piloter(), public.ep_pilotage_synthese(integer), public.ep_pilotage_signaux(integer),
  public.ep_crm_commerciaux(), public.ep_crm_activite_comptes(integer)
to authenticated;
