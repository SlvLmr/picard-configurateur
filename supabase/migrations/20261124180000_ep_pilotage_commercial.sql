-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : Pilotage commercial (société, zone, ATC, gamme)
-- Lecture seule des tables de l'outil Picard ATC : atc_mois, commerciaux,
-- societe_mois, jours, reglages. Aucune table Commerce n'est modifiée.
-- Idées reprises de Picard ATC : seuils de couleur (reglages), avancement
-- au prorata des jours ouvrés du mois en cours, objectifs de recrutement IAP.
-- ════════════════════════════════════════════════════════════════════

-- Agrégats génériques, groupés par société, zone (équipe), ATC ou gamme,
-- éventuellement filtrés sur une zone, un ATC ou une gamme. Interne.
create or replace function public.ep_pilotage_agregats(
  p_annee integer, p_dernier integer, p_ratio numeric, p_mois integer,
  p_groupe text, p_dimension text default 'societe', p_cle text default null
) returns table (
  cle text, budget_annuel numeric, budget_cumul numeric, budget_prorata numeric,
  realise_cumul numeric, n1_cumul numeric, n1_prorata numeric,
  mois_budget numeric, mois_budget_prorata numeric, mois_realise numeric, mois_n1 numeric
)
language sql stable security definer set search_path = '' as $$
  select
    case p_groupe when 'zone' then c.equipe when 'atc' then c.id::text when 'gamme' then a.gamme when 'mois' then a.mois::text else 'societe' end,
    coalesce(sum(a.budget), 0),
    coalesce(sum(a.budget) filter (where a.mois <= p_dernier), 0),
    coalesce(sum(a.budget) filter (where a.mois < p_dernier), 0) + coalesce(sum(a.budget) filter (where a.mois = p_dernier), 0) * p_ratio,
    coalesce(sum(a.realise) filter (where a.mois <= p_dernier), 0),
    coalesce(sum(a.realise_n1) filter (where a.mois <= p_dernier), 0),
    coalesce(sum(a.realise_n1) filter (where a.mois < p_dernier), 0) + coalesce(sum(a.realise_n1) filter (where a.mois = p_dernier), 0) * p_ratio,
    coalesce(sum(a.budget) filter (where a.mois = p_mois), 0),
    coalesce(sum(a.budget) filter (where a.mois = p_mois), 0) * case when p_mois = p_dernier then p_ratio else 1 end,
    coalesce(sum(a.realise) filter (where a.mois = p_mois), 0),
    coalesce(sum(a.realise_n1) filter (where a.mois = p_mois), 0) * case when p_mois = p_dernier then p_ratio else 1 end
  from public.atc_mois a
  join public.commerciaux c on c.id = a.commercial_id
  where a.annee = p_annee
    and (p_dimension = 'societe'
      or (p_dimension = 'zone' and c.equipe = p_cle)
      or (p_dimension = 'atc' and c.id::text = p_cle)
      or (p_dimension = 'gamme' and a.gamme = p_cle))
  group by 1
$$;

-- Contexte de période : dernier mois saisi, jours ouvrés écoulés et ratio du mois en cours. Interne.
create or replace function public.ep_pilotage_contexte(p_annee integer)
returns table (dernier integer, ecoules integer, ouvres integer, ratio numeric)
language sql stable security definer set search_path = '' as $$
  with d as (select coalesce(max(mois), 0) m from public.atc_mois where annee = p_annee and realise is not null),
  j as (
    select (select count(*) from public.jours where extract(year from date) = p_annee and extract(month from date) = d.m)::integer ecoules,
           (select jours_ouvres from public.societe_mois where annee = p_annee and mois = d.m) ouvres
    from d
  )
  select d.m, j.ecoules, coalesce(j.ouvres, j.ecoules),
         case when coalesce(j.ouvres, 0) > 0 and j.ecoules > 0 then least(1, j.ecoules::numeric / j.ouvres) else 1 end
  from d, j
$$;

-- Tableau de bord : société, zones, ATC, gammes.
create or replace function public.ep_pilotage_tableau(p_annee integer default null, p_mois integer default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_annee integer := coalesce(p_annee, extract(year from now())::integer);
  ctx record;
  v_mois integer;
  ligne text := $l$jsonb_build_object('budget_annuel', budget_annuel, 'budget_cumul', budget_cumul, 'budget_prorata', round(budget_prorata),
    'realise_cumul', realise_cumul, 'n1_cumul', n1_cumul, 'n1_prorata', round(n1_prorata),
    'mois_budget', mois_budget, 'mois_budget_prorata', round(mois_budget_prorata), 'mois_realise', mois_realise, 'mois_n1', round(mois_n1))$l$;
  r jsonb;
begin
  if not public.ep_peut_piloter() then
    raise exception 'Accès réservé à la direction et aux chefs de marché' using errcode = '42501';
  end if;
  select * into ctx from public.ep_pilotage_contexte(v_annee);
  v_mois := least(greatest(coalesce(p_mois, ctx.dernier), 1), 12);

  execute format($q$
    select jsonb_build_object(
      'annee', %1$s, 'dernier_mois', %2$s, 'mois', %3$s,
      'jours', jsonb_build_object('ecoules', %4$s, 'ouvres', %5$s, 'ratio', %6$s),
      'seuils', (select jsonb_build_object('vert', seuil_vert, 'jaune', seuil_jaune, 'orange', seuil_orange) from public.reglages order by id limit 1),
      'societe', (select %7$s from public.ep_pilotage_agregats(%1$s, %2$s, %6$s, %3$s, 'societe')),
      'zones', (select coalesce(jsonb_agg(%7$s || jsonb_build_object('zone', cle,
                  'atc', (select count(*) from public.commerciaux c where c.actif and c.equipe = cle),
                  'iap_objectif', (select coalesce(sum(iap_objectif), 0) from public.commerciaux c where c.actif and c.equipe = cle),
                  'iap_nouveaux', (select coalesce(sum(iap_nouveaux), 0) from public.commerciaux c where c.actif and c.equipe = cle)
                ) order by realise_cumul desc), '[]') from public.ep_pilotage_agregats(%1$s, %2$s, %6$s, %3$s, 'zone')),
      'atc', (select coalesce(jsonb_agg(%7$s || jsonb_build_object('id', c.id, 'prenom', c.prenom, 'nom', c.nom, 'zone', c.equipe,
                  'fonction', c.fonction, 'couleur', c.couleur, 'iap_objectif', c.iap_objectif, 'iap_nouveaux', c.iap_nouveaux,
                  'comptes', (select count(*) from public.ep_comptes e where e.commercial_id = c.id and e.actif)
                ) order by realise_cumul desc), '[]')
              from public.ep_pilotage_agregats(%1$s, %2$s, %6$s, %3$s, 'atc') g join public.commerciaux c on c.id::text = g.cle),
      'gammes', (select coalesce(jsonb_agg(%7$s || jsonb_build_object('gamme', cle) order by realise_cumul desc), '[]')
                 from public.ep_pilotage_agregats(%1$s, %2$s, %6$s, %3$s, 'gamme'))
    )$q$, v_annee, ctx.dernier, v_mois, ctx.ecoules, ctx.ouvres, ctx.ratio, ligne)
  into r;
  return r;
end $$;

-- Détail d'une zone, d'un ATC, d'une gamme ou de la société : série mensuelle et ventilations.
create or replace function public.ep_pilotage_detail(p_dimension text, p_cle text default null, p_annee integer default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_annee integer := coalesce(p_annee, extract(year from now())::integer);
  ctx record;
  r jsonb;
begin
  if not public.ep_peut_piloter() then
    raise exception 'Accès réservé à la direction et aux chefs de marché' using errcode = '42501';
  end if;
  if p_dimension not in ('societe', 'zone', 'atc', 'gamme') then raise exception 'Vue inconnue'; end if;
  select * into ctx from public.ep_pilotage_contexte(v_annee);

  select jsonb_build_object(
    'dimension', p_dimension, 'cle', p_cle, 'annee', v_annee, 'dernier_mois', ctx.dernier,
    'mois', (select coalesce(jsonb_agg(jsonb_build_object('mois', cle::integer, 'budget', mois_budget,
              'realise', case when cle::integer <= ctx.dernier then mois_realise end, 'n1', mois_n1) order by cle::integer), '[]')
             from (select g.cle, a.budget_annuel, a.mois_budget, a.mois_realise, a.mois_n1 from (select distinct mois::text cle from public.atc_mois where annee = v_annee) g,
                   lateral public.ep_pilotage_agregats(v_annee, 13, 1, g.cle::integer, 'societe', p_dimension, p_cle) a) m),
    'gammes', case when p_dimension <> 'gamme' then (
              select coalesce(jsonb_agg(jsonb_build_object('gamme', cle, 'budget_prorata', round(budget_prorata), 'realise_cumul', realise_cumul,
                'n1_prorata', round(n1_prorata), 'budget_annuel', budget_annuel) order by realise_cumul desc), '[]')
              from public.ep_pilotage_agregats(v_annee, ctx.dernier, ctx.ratio, ctx.dernier, 'gamme', p_dimension, p_cle)) end,
    'atc', case when p_dimension in ('zone', 'gamme', 'societe') then (
              select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'prenom', c.prenom, 'nom', c.nom, 'couleur', c.couleur, 'zone', c.equipe,
                'budget_prorata', round(g.budget_prorata), 'realise_cumul', g.realise_cumul, 'n1_prorata', round(g.n1_prorata)) order by g.realise_cumul desc), '[]')
              from public.ep_pilotage_agregats(v_annee, ctx.dernier, ctx.ratio, ctx.dernier, 'atc', p_dimension, p_cle) g
              join public.commerciaux c on c.id::text = g.cle) end,
    'iap', (select jsonb_build_object('objectif', coalesce(sum(iap_objectif), 0), 'nouveaux', coalesce(sum(iap_nouveaux), 0))
            from public.commerciaux c where c.actif and (p_dimension in ('societe', 'gamme')
              or (p_dimension = 'zone' and c.equipe = p_cle) or (p_dimension = 'atc' and c.id::text = p_cle)))
  ) into r;
  return r;
end $$;

revoke execute on function
  public.ep_pilotage_agregats(integer, integer, numeric, integer, text, text, text),
  public.ep_pilotage_contexte(integer),
  public.ep_pilotage_tableau(integer, integer),
  public.ep_pilotage_detail(text, text, integer)
from public, anon;
revoke execute on function
  public.ep_pilotage_agregats(integer, integer, numeric, integer, text, text, text),
  public.ep_pilotage_contexte(integer)
from authenticated;
grant execute on function public.ep_pilotage_tableau(integer, integer), public.ep_pilotage_detail(text, text, integer) to authenticated;
