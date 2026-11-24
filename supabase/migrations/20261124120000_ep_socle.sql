-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : socle (comptes, profils, leads, historique, points)
-- Projet Supabase « Commerce ». Toutes les tables sont préfixées ep_
-- pour cohabiter avec l'outil Commerce existant sans le modifier.
-- Écritures : uniquement via fonctions (RPC) contrôlant le rôle.
-- ════════════════════════════════════════════════════════════════════

create type public.ep_role as enum (
  'admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe'
);
create type public.ep_type_compte as enum ('IAP', 'Serrurier', 'Fenêtrier', 'Autre');
create type public.ep_niveau_iap as enum ('Elite', 'Premium', 'Officiel');
create type public.ep_lead_source as enum ('Ma Porte', 'Site web', 'Téléphone', 'Salon');
create type public.ep_lead_statut as enum (
  'a_valider', 'attribue', 'accepte', 'contacte', 'devis', 'signe', 'perdu'
);

create function public.ep_departement(cp text) returns text
language sql immutable set search_path = '' as $$
  select case when cp ~ '^97' then left(cp, 3) else left(cp, 2) end
$$;

-- ── Comptes clients (installateurs) ─────────────────────────────────
create table public.ep_comptes (
  id uuid primary key default gen_random_uuid(),
  numero_client text unique,
  raison_sociale text not null,
  type public.ep_type_compte not null default 'IAP',
  niveau_iap public.ep_niveau_iap,
  cp text,
  ville text,
  departement text generated always as (public.ep_departement(cp)) stored,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  actif boolean not null default true,
  source_boost_iap_id integer unique,
  cree_le timestamptz not null default now()
);
create index ep_comptes_departement_idx on public.ep_comptes (departement) where actif;
create index ep_comptes_commercial_idx on public.ep_comptes (commercial_id);
comment on table public.ep_comptes is 'Espace Pro : entreprises clientes (IAP, serruriers, fenêtriers)';

-- ── Profils utilisateurs ────────────────────────────────────────────
create table public.ep_profils (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.ep_role not null,
  prenom text,
  nom text,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  compte_id uuid references public.ep_comptes (id) on delete set null,
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  constraint ep_profils_client_a_un_compte
    check (role not in ('client_gerant', 'client_equipe') or compte_id is not null)
);
comment on table public.ep_profils is 'Espace Pro : rôle et périmètre de chaque utilisateur';

-- ── Leads ───────────────────────────────────────────────────────────
create sequence public.ep_leads_numero_seq start 2400;

create table public.ep_leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('L-' || nextval('public.ep_leads_numero_seq')),
  recu_le timestamptz not null default now(),
  source public.ep_lead_source not null,
  contact_nom text not null,
  telephone text,
  email text,
  cp text not null,
  ville text,
  departement text generated always as (public.ep_departement(cp)) stored,
  projet text not null,
  configuration_ma_porte jsonb,
  gros_projet boolean not null default false,
  statut public.ep_lead_statut not null default 'a_valider',
  suggestion_compte_id uuid references public.ep_comptes (id) on delete set null,
  suggestion_commercial_id uuid references public.commerciaux (id) on delete set null,
  compte_id uuid references public.ep_comptes (id) on delete set null,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  attribue_le timestamptz,
  attribue_par uuid references auth.users (id) on delete set null,
  delai_acceptation interval not null default interval '24 hours',
  accepte_le timestamptz,
  demo boolean not null default false
);
create index ep_leads_statut_idx on public.ep_leads (statut);
create index ep_leads_compte_idx on public.ep_leads (compte_id);
create index ep_leads_commercial_idx on public.ep_leads (commercial_id);
create index ep_leads_recu_idx on public.ep_leads (recu_le desc);
comment on table public.ep_leads is 'Espace Pro : demandes de particuliers et leur cycle de vie';

-- Historique complet : source de vérité pour les taux et délais
create table public.ep_lead_evenements (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.ep_leads (id) on delete cascade,
  type text not null check (type in ('recu', 'attribution', 'acceptation', 'refus', 'statut', 'reattribution_auto')),
  statut public.ep_lead_statut,
  compte_id uuid references public.ep_comptes (id) on delete set null,
  auteur uuid references auth.users (id) on delete set null,
  details jsonb,
  cree_le timestamptz not null default now()
);
create index ep_lead_evenements_lead_idx on public.ep_lead_evenements (lead_id, cree_le);

-- ── Points de fidélité ──────────────────────────────────────────────
create table public.ep_points (
  id bigint generated always as identity primary key,
  compte_id uuid not null references public.ep_comptes (id) on delete cascade,
  points integer not null,
  motif text not null,
  lead_id uuid references public.ep_leads (id) on delete set null,
  cree_le timestamptz not null default now()
);
create index ep_points_compte_idx on public.ep_points (compte_id);

-- ════════════════════════════════════════════════════════════════════
-- Contexte de l'utilisateur courant
-- ════════════════════════════════════════════════════════════════════
create function public.ep_profil_courant() returns public.ep_profils
language sql stable security definer set search_path = '' as $$
  select p.* from public.ep_profils p where p.id = auth.uid() and p.actif
$$;

create function public.ep_est_interne() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('admin', 'codir', 'chef_service', 'chef_marche', 'repartiteur')
    from public.ep_profils where id = auth.uid() and actif), false)
$$;

create function public.ep_mon_commercial() returns uuid
language sql stable security definer set search_path = '' as $$
  select commercial_id from public.ep_profils where id = auth.uid() and actif and role = 'atc'
$$;

create function public.ep_mon_compte() returns uuid
language sql stable security definer set search_path = '' as $$
  select compte_id from public.ep_profils where id = auth.uid() and actif and role in ('client_gerant', 'client_equipe')
$$;

-- ════════════════════════════════════════════════════════════════════
-- Sécurité par ligne (lecture). Aucune écriture directe autorisée.
-- ════════════════════════════════════════════════════════════════════
alter table public.ep_comptes enable row level security;
alter table public.ep_profils enable row level security;
alter table public.ep_leads enable row level security;
alter table public.ep_lead_evenements enable row level security;
alter table public.ep_points enable row level security;

create policy ep_comptes_lecture on public.ep_comptes for select to authenticated using (
  public.ep_est_interne()
  or commercial_id = public.ep_mon_commercial()
  or id = public.ep_mon_compte()
);

create policy ep_profils_lecture on public.ep_profils for select to authenticated using (
  id = auth.uid() or public.ep_est_interne()
);

create policy ep_leads_lecture on public.ep_leads for select to authenticated using (
  public.ep_est_interne()
  or commercial_id = public.ep_mon_commercial()
  or compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
  or (compte_id = public.ep_mon_compte() and statut <> 'a_valider')
);

create policy ep_lead_evenements_lecture on public.ep_lead_evenements for select to authenticated using (
  exists (select 1 from public.ep_leads l where l.id = lead_id)
);

create policy ep_points_lecture on public.ep_points for select to authenticated using (
  public.ep_est_interne()
  or compte_id = public.ep_mon_compte()
  or compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
);

-- ════════════════════════════════════════════════════════════════════
-- Attribution : pré-attribution par département, priorité de niveau,
-- puis rotation équitable (le moins servi sur 30 jours).
-- ════════════════════════════════════════════════════════════════════
create function public.ep_suggerer(p_departement text, p_exclure uuid[] default '{}')
returns table (compte_id uuid, commercial_id uuid)
language sql stable security definer set search_path = '' as $$
  with candidat as (
    select c.id, c.commercial_id
    from public.ep_comptes c
    where c.actif and c.departement = p_departement and not (c.id = any (p_exclure))
    order by
      case c.niveau_iap when 'Elite' then 1 when 'Premium' then 2 when 'Officiel' then 3 else 4 end,
      (select count(*) from public.ep_leads l
        where l.compte_id = c.id and l.attribue_le > now() - interval '30 days'),
      c.raison_sociale
    limit 1
  ),
  commercial_secteur as (
    select c.commercial_id from public.ep_comptes c
    where c.departement = p_departement and c.commercial_id is not null
    group by c.commercial_id order by count(*) desc limit 1
  )
  select (select id from candidat),
         coalesce((select commercial_id from candidat), (select commercial_id from commercial_secteur))
$$;

create function public.ep_leads_avant_insertion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare s record;
begin
  if new.suggestion_compte_id is null and new.suggestion_commercial_id is null then
    select * into s from public.ep_suggerer(public.ep_departement(new.cp));
    new.suggestion_compte_id := s.compte_id;
    -- sans client à proximité, le lead revient au commercial du secteur
    new.suggestion_commercial_id := case when s.compte_id is null then s.commercial_id end;
  end if;
  return new;
end $$;

create trigger ep_leads_suggestion before insert on public.ep_leads
for each row execute function public.ep_leads_avant_insertion();

create function public.ep_leads_apres_insertion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.ep_lead_evenements (lead_id, type, statut, cree_le)
  values (new.id, 'recu', new.statut, new.recu_le);
  return new;
end $$;

create trigger ep_leads_historique after insert on public.ep_leads
for each row execute function public.ep_leads_apres_insertion();

-- ── Actions (RPC) ───────────────────────────────────────────────────
create function public.ep_attribuer_lead(p_lead uuid, p_compte uuid default null, p_commercial uuid default null)
returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare
  moi public.ep_profils := public.ep_profil_courant();
  l public.ep_leads;
  v_compte uuid;
  v_commercial uuid;
begin
  if moi.role is null or moi.role not in ('admin', 'repartiteur') then
    raise exception 'Seuls les répartiteurs peuvent attribuer un lead' using errcode = '42501';
  end if;
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if l.statut <> 'a_valider' then raise exception 'Ce lead a déjà été attribué'; end if;

  if p_compte is not null or p_commercial is not null then
    v_compte := p_compte;
    v_commercial := coalesce(p_commercial, (select commercial_id from public.ep_comptes where id = p_compte));
  else
    v_compte := l.suggestion_compte_id;
    v_commercial := coalesce(l.suggestion_commercial_id, (select commercial_id from public.ep_comptes where id = l.suggestion_compte_id));
  end if;
  if v_compte is null and v_commercial is null then
    raise exception 'Choisissez un professionnel ou un commercial';
  end if;

  update public.ep_leads
     set statut = case when v_compte is null then 'accepte' else 'attribue' end,
         compte_id = v_compte, commercial_id = v_commercial,
         attribue_le = now(), attribue_par = auth.uid(),
         accepte_le = case when v_compte is null then now() end
   where id = p_lead
  returning * into l;

  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'attribution', l.statut, v_compte, auth.uid(), jsonb_build_object('commercial_id', v_commercial));
  return l;
end $$;

create function public.ep_accepter_lead(p_lead uuid) returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_compte uuid := public.ep_mon_compte();
begin
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null or l.compte_id is distinct from v_compte then raise exception 'Lead introuvable'; end if;
  if l.statut <> 'attribue' then raise exception 'Ce lead n’est plus en attente d’acceptation'; end if;
  if l.attribue_le + l.delai_acceptation < now() then raise exception 'Le délai d’acceptation est dépassé'; end if;

  update public.ep_leads set statut = 'accepte', accepte_le = now() where id = p_lead returning * into l;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur) values (p_lead, 'acceptation', 'accepte', v_compte, auth.uid());
  insert into public.ep_points (compte_id, points, motif, lead_id) values (v_compte, 20, 'Lead accepté', p_lead);
  return l;
end $$;

create function public.ep_refuser_lead(p_lead uuid, p_motif text) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_compte uuid := public.ep_mon_compte(); s record; exclus uuid[];
begin
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null or l.compte_id is distinct from v_compte then raise exception 'Lead introuvable'; end if;
  if l.statut <> 'attribue' then raise exception 'Ce lead n’est plus en attente d’acceptation'; end if;

  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'refus', 'a_valider', v_compte, auth.uid(), jsonb_build_object('motif', p_motif));

  select coalesce(array_agg(compte_id), '{}') into exclus
    from public.ep_lead_evenements where lead_id = p_lead and type = 'refus' and compte_id is not null;
  select * into s from public.ep_suggerer(l.departement, exclus);

  update public.ep_leads
     set statut = 'a_valider', compte_id = null, commercial_id = null, attribue_le = null, attribue_par = null,
         suggestion_compte_id = s.compte_id,
         suggestion_commercial_id = case when s.compte_id is null then s.commercial_id end
   where id = p_lead;
end $$;

create function public.ep_changer_statut_lead(p_lead uuid, p_statut public.ep_lead_statut) returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_compte uuid := public.ep_mon_compte(); deja boolean;
begin
  if p_statut not in ('contacte', 'devis', 'signe', 'perdu') then raise exception 'Statut non autorisé'; end if;
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null or l.compte_id is distinct from v_compte then raise exception 'Lead introuvable'; end if;
  if l.statut in ('a_valider', 'attribue') then raise exception 'Acceptez le lead avant de renseigner son statut'; end if;

  select exists (select 1 from public.ep_lead_evenements where lead_id = p_lead and type = 'statut' and statut = p_statut) into deja;
  update public.ep_leads set statut = p_statut where id = p_lead returning * into l;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur) values (p_lead, 'statut', p_statut, v_compte, auth.uid());
  if not deja then
    insert into public.ep_points (compte_id, points, motif, lead_id) values (v_compte, 10, 'Statut renseigné', p_lead);
  end if;
  return l;
end $$;

-- ── Indicateurs (calculés sur ce que l'utilisateur a le droit de voir) ──
create function public.ep_stats_leads(p_jours integer default 30) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with l as (select * from public.ep_leads where recu_le > now() - make_interval(days => p_jours))
  select jsonb_build_object(
    'recus', (select count(*) from l),
    'a_valider', (select count(*) from public.ep_leads where statut = 'a_valider'),
    'sans_pro', (select count(*) from public.ep_leads where statut = 'a_valider' and suggestion_compte_id is null),
    'en_attente_pro', (select count(*) from public.ep_leads where statut = 'attribue'),
    'delai_moyen_min', (select round(extract(epoch from avg(accepte_le - recu_le)) / 60) from l where accepte_le is not null),
    'acceptes_24h_pct', (select round(100.0 * count(*) filter (where accepte_le - recu_le <= interval '24 hours') / nullif(count(*) filter (where attribue_le is not null), 0)) from l),
    'transformation_pct', (select round(100.0 * count(*) filter (where statut = 'signe') / nullif(count(*) filter (where statut in ('accepte', 'contacte', 'devis', 'signe', 'perdu')), 0)) from l),
    'statut_renseigne_pct', (select round(100.0 * count(*) filter (where statut in ('contacte', 'devis', 'signe', 'perdu')) / nullif(count(*) filter (where statut in ('accepte', 'contacte', 'devis', 'signe', 'perdu')), 0)) from l),
    'par_statut', (select coalesce(jsonb_object_agg(statut, n), '{}') from (select statut, count(*) n from l group by statut) s)
  )
$$;

-- ── Droits d'exécution : utilisateurs connectés uniquement ──────────
revoke execute on function
  public.ep_departement(text), public.ep_profil_courant(), public.ep_est_interne(), public.ep_mon_commercial(),
  public.ep_mon_compte(), public.ep_suggerer(text, uuid[]), public.ep_leads_avant_insertion(),
  public.ep_leads_apres_insertion(), public.ep_attribuer_lead(uuid, uuid, uuid), public.ep_accepter_lead(uuid),
  public.ep_refuser_lead(uuid, text), public.ep_changer_statut_lead(uuid, public.ep_lead_statut),
  public.ep_stats_leads(integer)
from public, anon;

grant execute on function
  public.ep_profil_courant(), public.ep_est_interne(), public.ep_mon_commercial(), public.ep_mon_compte(),
  public.ep_attribuer_lead(uuid, uuid, uuid), public.ep_accepter_lead(uuid), public.ep_refuser_lead(uuid, text),
  public.ep_changer_statut_lead(uuid, public.ep_lead_statut), public.ep_stats_leads(integer), public.ep_departement(text)
to authenticated;

revoke all on public.ep_comptes, public.ep_profils, public.ep_leads, public.ep_lead_evenements, public.ep_points from anon;
