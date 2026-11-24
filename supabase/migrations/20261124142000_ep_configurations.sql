-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : configurations de portes, devis et commandes
-- Lecture filtrée par rôle (RLS) ; écritures uniquement par fonctions.
-- ════════════════════════════════════════════════════════════════════

create type public.ep_configuration_statut as enum ('brouillon', 'devis', 'commande');
create type public.ep_commande_porte_statut as enum ('transmise_adv', 'en_fabrication', 'expediee');

create sequence public.ep_configurations_numero_seq start 1000;
create sequence public.ep_commandes_portes_numero_seq start 1000;

create table public.ep_configurations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('P-' || nextval('public.ep_configurations_numero_seq')),
  compte_id uuid references public.ep_comptes (id) on delete set null,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  auteur uuid references auth.users (id) on delete set null,
  lead_id uuid references public.ep_leads (id) on delete set null,
  gamme text not null default 'portes_blindees',
  modele text not null,
  chantier text,
  client_final text,
  donnees jsonb not null,
  prix_achat numeric(10, 2) not null check (prix_achat >= 0),
  prix_vente numeric(10, 2) check (prix_vente is null or prix_vente >= 0),
  statut public.ep_configuration_statut not null default 'brouillon',
  devis_le timestamptz,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
create index ep_configurations_compte_idx on public.ep_configurations (compte_id);
create index ep_configurations_auteur_idx on public.ep_configurations (auteur);
create index ep_configurations_lead_idx on public.ep_configurations (lead_id);
comment on table public.ep_configurations is 'Espace Pro : portes configurées (brouillon, devis, commande)';

create table public.ep_commandes_portes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('PC-' || nextval('public.ep_commandes_portes_numero_seq')),
  configuration_id uuid not null unique references public.ep_configurations (id) on delete cascade,
  statut public.ep_commande_porte_statut not null default 'transmise_adv',
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now()
);
comment on table public.ep_commandes_portes is 'Espace Pro : commandes de portes transmises à l’ADV';

-- ── Lecture ─────────────────────────────────────────────────────────
alter table public.ep_configurations enable row level security;
alter table public.ep_commandes_portes enable row level security;

create policy ep_configurations_lecture on public.ep_configurations for select to authenticated using (
  public.ep_est_interne()
  or auteur = auth.uid()
  or compte_id = public.ep_mon_compte()
  or commercial_id = public.ep_mon_commercial()
  or compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
);
create policy ep_commandes_portes_lecture on public.ep_commandes_portes for select to authenticated using (
  exists (select 1 from public.ep_configurations c where c.id = configuration_id)
);
revoke all on public.ep_configurations, public.ep_commandes_portes from anon;

-- ── Droits de l'utilisateur courant sur une configuration ───────────
create function public.ep_configuration_modifiable(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ep_configurations c
    where c.id = p_id and (
      public.ep_est_interne()
      or c.auteur = auth.uid()
      or (c.compte_id is not null and c.compte_id = public.ep_mon_compte())
      or (c.commercial_id is not null and c.commercial_id = public.ep_mon_commercial())
      or c.compte_id in (select x.id from public.ep_comptes x where x.commercial_id = public.ep_mon_commercial())
    )
  )
$$;

-- Si le lead lié appartient au client connecté et n'a pas encore de devis, il passe en « devis ».
create function public.ep_configuration_lead_vers_devis(p_lead uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads;
begin
  if p_lead is null then return; end if;
  select * into l from public.ep_leads where id = p_lead;
  if l.id is not null and l.compte_id is not null and l.compte_id = public.ep_mon_compte() and l.statut in ('accepte', 'contacte') then
    perform public.ep_changer_statut_lead(p_lead, 'devis');
  end if;
end $$;

-- ── Enregistrer (création ou mise à jour) ───────────────────────────
create function public.ep_enregistrer_configuration(
  p_donnees jsonb,
  p_modele text,
  p_prix_achat numeric,
  p_prix_vente numeric default null,
  p_chantier text default null,
  p_client_final text default null,
  p_id uuid default null,
  p_lead uuid default null,
  p_compte uuid default null
) returns public.ep_configurations
language plpgsql security definer set search_path = '' as $$
declare
  moi public.ep_profils := public.ep_profil_courant();
  r public.ep_configurations;
  v_compte uuid;
  v_commercial uuid;
begin
  if moi.id is null then raise exception 'Profil Espace Pro introuvable' using errcode = '42501'; end if;
  if p_donnees is null or coalesce(trim(p_modele), '') = '' then raise exception 'Configuration incomplète'; end if;

  -- Compte rattaché selon le rôle
  if moi.role in ('client_gerant', 'client_equipe') then
    v_compte := moi.compte_id;
  elsif moi.role = 'atc' then
    v_commercial := moi.commercial_id;
    if p_compte is not null and not exists (select 1 from public.ep_comptes where id = p_compte and commercial_id = moi.commercial_id) then
      raise exception 'Ce client ne fait pas partie de votre portefeuille';
    end if;
    v_compte := p_compte;
  else
    v_compte := p_compte;
  end if;

  -- Le lead lié doit être visible par l'utilisateur
  if p_lead is not null and not exists (
    select 1 from public.ep_leads l where l.id = p_lead and (
      public.ep_est_interne()
      or l.compte_id = public.ep_mon_compte()
      or l.commercial_id = public.ep_mon_commercial()
      or l.compte_id in (select x.id from public.ep_comptes x where x.commercial_id = public.ep_mon_commercial())
    )
  ) then
    raise exception 'Lead introuvable';
  end if;

  if p_id is null then
    insert into public.ep_configurations (compte_id, commercial_id, auteur, lead_id, modele, chantier, client_final, donnees, prix_achat, prix_vente)
    values (v_compte, v_commercial, auth.uid(), p_lead, p_modele, nullif(trim(p_chantier), ''), nullif(trim(p_client_final), ''), p_donnees, p_prix_achat, p_prix_vente)
    returning * into r;
  else
    if not public.ep_configuration_modifiable(p_id) then raise exception 'Configuration introuvable'; end if;
    select * into r from public.ep_configurations where id = p_id for update;
    if r.statut = 'commande' then raise exception 'Cette configuration est déjà commandée : dupliquez-la pour la modifier'; end if;
    update public.ep_configurations set
      modele = p_modele, chantier = nullif(trim(p_chantier), ''), client_final = nullif(trim(p_client_final), ''),
      donnees = p_donnees, prix_achat = p_prix_achat, prix_vente = p_prix_vente,
      lead_id = coalesce(p_lead, lead_id),
      compte_id = coalesce(v_compte, compte_id),
      -- un devis modifié redevient un brouillon : il faudra le régénérer
      statut = 'brouillon', devis_le = null, maj_le = now()
    where id = p_id
    returning * into r;
  end if;
  return r;
end $$;

-- ── Générer le devis ────────────────────────────────────────────────
create function public.ep_generer_devis(p_id uuid) returns public.ep_configurations
language plpgsql security definer set search_path = '' as $$
declare r public.ep_configurations;
begin
  if not public.ep_configuration_modifiable(p_id) then raise exception 'Configuration introuvable'; end if;
  select * into r from public.ep_configurations where id = p_id for update;
  if r.statut = 'commande' then raise exception 'Cette configuration est déjà commandée'; end if;
  if r.prix_vente is null or r.prix_vente <= 0 then raise exception 'Renseignez votre prix de vente avant de générer le devis'; end if;
  update public.ep_configurations set statut = 'devis', devis_le = now(), maj_le = now() where id = p_id returning * into r;
  perform public.ep_configuration_lead_vers_devis(r.lead_id);
  return r;
end $$;

-- ── Commander ───────────────────────────────────────────────────────
create function public.ep_commander_configuration(p_id uuid) returns public.ep_commandes_portes
language plpgsql security definer set search_path = '' as $$
declare r public.ep_configurations; c public.ep_commandes_portes;
begin
  if not public.ep_configuration_modifiable(p_id) then raise exception 'Configuration introuvable'; end if;
  select * into r from public.ep_configurations where id = p_id for update;
  if r.statut = 'commande' then raise exception 'Cette configuration est déjà commandée'; end if;
  if r.prix_achat <= 0 then raise exception 'Configuration non chiffrée'; end if;

  insert into public.ep_commandes_portes (configuration_id, cree_par) values (p_id, auth.uid()) returning * into c;
  update public.ep_configurations set statut = 'commande', maj_le = now() where id = p_id;
  perform public.ep_configuration_lead_vers_devis(r.lead_id);
  return c;
end $$;

-- ── Droits d'exécution ──────────────────────────────────────────────
revoke execute on function
  public.ep_configuration_modifiable(uuid), public.ep_configuration_lead_vers_devis(uuid),
  public.ep_enregistrer_configuration(jsonb, text, numeric, numeric, text, text, uuid, uuid, uuid),
  public.ep_generer_devis(uuid), public.ep_commander_configuration(uuid)
from public, anon;
revoke execute on function public.ep_configuration_modifiable(uuid), public.ep_configuration_lead_vers_devis(uuid) from authenticated;
grant execute on function
  public.ep_enregistrer_configuration(jsonb, text, numeric, numeric, text, text, uuid, uuid, uuid),
  public.ep_generer_devis(uuid), public.ep_commander_configuration(uuid)
to authenticated;
