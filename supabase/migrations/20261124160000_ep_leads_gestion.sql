-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : gestion des leads (lead manager)
-- Notes internes, relances, réattribution, modification, attribution
-- groupée, candidats par zone et entonnoir de conversion.
-- ════════════════════════════════════════════════════════════════════

-- Nouveaux types d'événements
alter table public.ep_lead_evenements drop constraint ep_lead_evenements_type_check;
alter table public.ep_lead_evenements add constraint ep_lead_evenements_type_check check (type in (
  'recu', 'attribution', 'acceptation', 'refus', 'statut', 'reattribution_auto',
  'reattribution', 'relance', 'note', 'modification'
));

-- ── Notes internes ──────────────────────────────────────────────────
create table public.ep_lead_notes (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.ep_leads (id) on delete cascade,
  auteur uuid references auth.users (id) on delete set null,
  auteur_nom text,
  contenu text not null check (length(trim(contenu)) > 0),
  cree_le timestamptz not null default now()
);
create index ep_lead_notes_lead_idx on public.ep_lead_notes (lead_id, cree_le desc);
alter table public.ep_lead_notes enable row level security;
revoke all on public.ep_lead_notes from anon;
revoke insert, update, delete on public.ep_lead_notes from authenticated;
comment on table public.ep_lead_notes is 'Espace Pro : notes internes sur un lead (jamais visibles par le client)';

create policy ep_lead_notes_lecture on public.ep_lead_notes for select to authenticated using (
  public.ep_est_interne()
  or exists (select 1 from public.ep_leads l where l.id = lead_id and l.commercial_id = public.ep_mon_commercial())
);

-- ── Contrôle commun ─────────────────────────────────────────────────
create function public.ep_peut_gerer_leads() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('admin', 'repartiteur') from public.ep_profils where id = auth.uid() and actif), false)
$$;

create function public.ep_nom_utilisateur() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), ''), 'Utilisateur')
  from public.ep_profils p where p.id = auth.uid()
$$;

-- ── Réattribution ───────────────────────────────────────────────────
create function public.ep_reattribuer_lead(p_lead uuid, p_compte uuid default null, p_commercial uuid default null)
returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_commercial uuid;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seuls les répartiteurs peuvent réattribuer un lead' using errcode = '42501'; end if;
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if l.statut <> 'attribue' then raise exception 'Seul un lead en attente d’acceptation peut être réattribué'; end if;
  if p_compte is null and p_commercial is null then raise exception 'Choisissez un professionnel ou un commercial'; end if;
  if p_compte is not null and p_compte = l.compte_id then raise exception 'Ce lead est déjà attribué à ce professionnel'; end if;

  v_commercial := coalesce(p_commercial, (select commercial_id from public.ep_comptes where id = p_compte));
  update public.ep_leads
     set compte_id = p_compte, commercial_id = v_commercial,
         statut = (case when p_compte is null then 'accepte' else 'attribue' end)::public.ep_lead_statut,
         attribue_le = now(), attribue_par = auth.uid(),
         accepte_le = case when p_compte is null then now() end
   where id = p_lead returning * into l;

  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'reattribution', l.statut, p_compte, auth.uid(), jsonb_build_object('commercial_id', v_commercial));
  return l;
end $$;

-- ── Relance du professionnel ────────────────────────────────────────
create function public.ep_relancer_pro(p_lead uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seuls les répartiteurs peuvent relancer un professionnel' using errcode = '42501'; end if;
  select * into l from public.ep_leads where id = p_lead;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if l.statut not in ('attribue', 'accepte', 'contacte', 'devis') then raise exception 'Ce lead ne peut pas faire l’objet d’une relance'; end if;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'relance', l.statut, l.compte_id, auth.uid(), jsonb_build_object('par', public.ep_nom_utilisateur()));
end $$;

-- ── Modification des coordonnées et du projet ───────────────────────
create function public.ep_modifier_lead(
  p_lead uuid, p_contact text, p_telephone text, p_email text, p_cp text, p_ville text, p_projet text, p_gros_projet boolean
) returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; avant public.ep_leads;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seuls les répartiteurs peuvent modifier un lead' using errcode = '42501'; end if;
  select * into avant from public.ep_leads where id = p_lead for update;
  if avant.id is null then raise exception 'Lead introuvable'; end if;
  if coalesce(trim(p_contact), '') = '' then raise exception 'Le nom du contact est obligatoire'; end if;
  if coalesce(trim(p_cp), '') !~ '^[0-9]{5}$' then raise exception 'Le code postal doit comporter 5 chiffres'; end if;
  if coalesce(trim(p_projet), '') = '' then raise exception 'Le projet est obligatoire'; end if;

  update public.ep_leads set
    contact_nom = trim(p_contact), telephone = nullif(trim(p_telephone), ''), email = nullif(lower(trim(p_email)), ''),
    cp = trim(p_cp), ville = nullif(trim(p_ville), ''), projet = trim(p_projet), gros_projet = coalesce(p_gros_projet, false)
  where id = p_lead returning * into l;

  insert into public.ep_lead_evenements (lead_id, type, statut, auteur, details)
  values (p_lead, 'modification', l.statut, auth.uid(), jsonb_strip_nulls(jsonb_build_object(
    'contact', case when avant.contact_nom is distinct from l.contact_nom then true end,
    'telephone', case when avant.telephone is distinct from l.telephone then true end,
    'email', case when avant.email is distinct from l.email then true end,
    'adresse', case when avant.cp is distinct from l.cp or avant.ville is distinct from l.ville then true end,
    'projet', case when avant.projet is distinct from l.projet or avant.gros_projet is distinct from l.gros_projet then true end
  )));
  return l;
end $$;

-- ── Notes ───────────────────────────────────────────────────────────
create function public.ep_ajouter_note_lead(p_lead uuid, p_contenu text) returns public.ep_lead_notes
language plpgsql security definer set search_path = '' as $$
declare n public.ep_lead_notes; l public.ep_leads;
begin
  if not (public.ep_est_interne() or exists (select 1 from public.ep_leads where id = p_lead and commercial_id = public.ep_mon_commercial())) then
    raise exception 'Vous ne pouvez pas annoter ce lead' using errcode = '42501';
  end if;
  select * into l from public.ep_leads where id = p_lead;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if coalesce(trim(p_contenu), '') = '' then raise exception 'La note est vide'; end if;
  insert into public.ep_lead_notes (lead_id, auteur, auteur_nom, contenu)
  values (p_lead, auth.uid(), public.ep_nom_utilisateur(), trim(p_contenu)) returning * into n;
  insert into public.ep_lead_evenements (lead_id, type, statut, auteur, details)
  values (p_lead, 'note', l.statut, auth.uid(), jsonb_build_object('par', n.auteur_nom));
  return n;
end $$;

-- ── Attribution groupée à la suggestion ─────────────────────────────
create function public.ep_attribuer_leads(p_leads uuid[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v uuid; ok int := 0; ko int := 0;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seuls les répartiteurs peuvent attribuer des leads' using errcode = '42501'; end if;
  foreach v in array coalesce(p_leads, '{}') loop
    begin
      perform public.ep_attribuer_lead(v);
      ok := ok + 1;
    exception when others then
      ko := ko + 1;
    end;
  end loop;
  return jsonb_build_object('attribues', ok, 'ignores', ko);
end $$;

-- ── Candidats par zone ──────────────────────────────────────────────
-- Département du lead d'abord ; puis « départements voisins » approximés
-- par la proximité numérique des numéros de département (ex. 44 → 49, 35, 56…).
-- Approximation volontaire en attendant une vraie géolocalisation.
create function public.ep_num_departement(d text) returns integer
language sql immutable set search_path = '' as $$
  select case when d ~ '^[0-9]+$' then d::integer when d in ('2A', '2B') then 20 else null end
$$;

create function public.ep_candidats_lead(p_lead uuid)
returns table (
  type text, id uuid, nom text, niveau public.ep_niveau_iap, ville text, departement text,
  leads_30j integer, ecart integer, groupe text, suggere boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare l public.ep_leads; v_num integer;
begin
  if not public.ep_est_interne() then raise exception 'Réservé aux équipes internes' using errcode = '42501'; end if;
  select * into l from public.ep_leads where ep_leads.id = p_lead;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  v_num := public.ep_num_departement(l.departement);

  return query
  with comptes as (
    select c.id as cid, c.raison_sociale, c.niveau_iap, c.ville as cville, c.departement as cdep,
           (select count(*)::integer from public.ep_leads x where x.compte_id = c.id and x.attribue_le > now() - interval '30 days') as n30,
           case when c.departement = l.departement then 0
                else abs(coalesce(public.ep_num_departement(c.departement), 999) - coalesce(v_num, -999)) end as ec
    from public.ep_comptes c
    where c.actif
  ),
  proches as (
    select * from comptes where comptes.ec = 0
    union all
    (select * from comptes where comptes.ec between 1 and 3 order by comptes.ec, comptes.n30 limit 12)
  )
  select 'compte'::text, p.cid, p.raison_sociale, p.niveau_iap, p.cville, p.cdep, p.n30, p.ec,
         case when p.ec = 0 then 'Même département (' || coalesce(l.departement, '?') || ')' else 'Départements voisins' end,
         p.cid = l.suggestion_compte_id
  from proches p
  order by p.ec > 0, case p.niveau_iap when 'Elite' then 1 when 'Premium' then 2 when 'Officiel' then 3 else 4 end, p.n30, p.raison_sociale;

  return query
  select 'commercial'::text, m.id, m.prenom || ' ' || initcap(m.nom), null::public.ep_niveau_iap, m.equipe, null::text,
         (select count(*)::integer from public.ep_leads x where x.commercial_id = m.id and x.compte_id is null and x.attribue_le > now() - interval '30 days'),
         (select count(*)::integer from public.ep_comptes c where c.commercial_id = m.id and c.departement = l.departement),
         'Commerciaux'::text,
         m.id = l.suggestion_commercial_id
  from public.commerciaux m
  where m.actif
  order by 8 desc, m.nom;
end $$;

-- ── Entonnoir de conversion (droits de l'appelant) ──────────────────
-- Un lead compte à une étape s'il l'a atteinte, même s'il a été perdu ensuite.
create function public.ep_leads_entonnoir(p_jours integer default 30, p_source text default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with l as (
    select id, statut, attribue_le, accepte_le
    from public.ep_leads
    where recu_le > now() - make_interval(days => greatest(p_jours, 1))
      and (p_source is null or source::text = p_source)
  ),
  r as (
    select l.id, l.statut = 'perdu' as perdu, greatest(
      case when l.attribue_le is not null then 1 else 0 end,
      case when l.accepte_le is not null then 2 else 0 end,
      case l.statut when 'attribue' then 1 when 'accepte' then 2 when 'contacte' then 3 when 'devis' then 4 when 'signe' then 5 else 0 end,
      coalesce((select max(case e.statut when 'attribue' then 1 when 'accepte' then 2 when 'contacte' then 3 when 'devis' then 4 when 'signe' then 5 else 0 end)
                from public.ep_lead_evenements e where e.lead_id = l.id), 0)
    ) as rang
    from l
  )
  select jsonb_build_object(
    'recus', count(*),
    'attribues', count(*) filter (where rang >= 1),
    'acceptes', count(*) filter (where rang >= 2),
    'contactes', count(*) filter (where rang >= 3),
    'devis', count(*) filter (where rang >= 4),
    'signes', count(*) filter (where rang >= 5),
    'perdus', count(*) filter (where perdu)
  ) from r
$$;

-- ── Droits d'exécution ──────────────────────────────────────────────
revoke execute on function
  public.ep_peut_gerer_leads(), public.ep_nom_utilisateur(),
  public.ep_reattribuer_lead(uuid, uuid, uuid), public.ep_relancer_pro(uuid),
  public.ep_modifier_lead(uuid, text, text, text, text, text, text, boolean),
  public.ep_ajouter_note_lead(uuid, text), public.ep_attribuer_leads(uuid[]),
  public.ep_num_departement(text), public.ep_candidats_lead(uuid), public.ep_leads_entonnoir(integer, text)
from public, anon;
revoke execute on function public.ep_nom_utilisateur(), public.ep_num_departement(text) from authenticated;
grant execute on function
  public.ep_peut_gerer_leads(),
  public.ep_reattribuer_lead(uuid, uuid, uuid), public.ep_relancer_pro(uuid),
  public.ep_modifier_lead(uuid, text, text, text, text, text, text, boolean),
  public.ep_ajouter_note_lead(uuid, text), public.ep_attribuer_leads(uuid[]),
  public.ep_candidats_lead(uuid), public.ep_leads_entonnoir(integer, text)
to authenticated;
