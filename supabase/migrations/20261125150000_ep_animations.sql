-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : rubrique Animations (sous Local)
-- Les actions de l'année sur une seule page : offre simple (avec kit de
-- promotion et inscription), offre de remboursement (dépôt et suivi de
-- dossiers) et offre de parrainage (code, filleuls, récompense).
-- ════════════════════════════════════════════════════════════════════

create table public.ep_animations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('offre', 'remboursement', 'parrainage')),
  titre text not null,
  accroche text,
  description text,
  conditions text,
  debut date not null,
  fin date not null check (fin >= debut),
  montant numeric,              -- remboursement par dossier, ou récompense du parrain en euros
  points integer,               -- récompense en points boutique
  produits text,                -- produits concernés (texte libre)
  lien_kit text,                -- kit de promotion (médiathèque ou lien externe)
  niveaux public.ep_niveau_iap[] not null default '{}', -- vide : tout le réseau
  publie boolean not null default true,
  demo boolean not null default false,
  cree_le timestamptz not null default now(),
  cree_par uuid references auth.users (id) on delete set null
);

create table public.ep_animation_participations (
  id uuid primary key default gen_random_uuid(),
  animation_id uuid not null references public.ep_animations (id) on delete cascade,
  compte_id uuid not null references public.ep_comptes (id) on delete cascade,
  auteur uuid references auth.users (id) on delete set null,
  statut text not null default 'inscrit' check (statut in ('inscrit', 'depose', 'valide', 'paye', 'refuse')),
  reference text,               -- facture ou commande (remboursement)
  client_final text,
  montant numeric,
  motif text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
create index ep_animation_participations_idx on public.ep_animation_participations (animation_id, compte_id);

create table public.ep_parrainages (
  id uuid primary key default gen_random_uuid(),
  animation_id uuid not null references public.ep_animations (id) on delete cascade,
  compte_id uuid not null references public.ep_comptes (id) on delete cascade,
  filleul_nom text not null,
  filleul_email text,
  filleul_telephone text,
  statut text not null default 'invite' check (statut in ('invite', 'inscrit', 'recompense')),
  cree_le timestamptz not null default now()
);

-- Code de parrainage stable par compte
alter table public.ep_comptes add column code_parrainage text unique;

alter table public.ep_animations enable row level security;
alter table public.ep_animation_participations enable row level security;
alter table public.ep_parrainages enable row level security;
revoke all on public.ep_animations, public.ep_animation_participations, public.ep_parrainages from anon;
revoke insert, update, delete on public.ep_animations, public.ep_animation_participations, public.ep_parrainages from authenticated;

create policy ep_animations_lecture on public.ep_animations for select to authenticated using (
  public.ep_est_interne() or public.ep_mon_commercial() is not null
  or (publie and (cardinality(niveaux) = 0 or exists (
    select 1 from public.ep_comptes c where c.id = public.ep_mon_compte() and c.niveau_iap = any (niveaux))))
);
create policy ep_participations_lecture on public.ep_animation_participations for select to authenticated using (
  public.ep_est_interne() or compte_id = public.ep_mon_compte()
  or compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
);
create policy ep_parrainages_lecture on public.ep_parrainages for select to authenticated using (
  public.ep_est_interne() or compte_id = public.ep_mon_compte()
  or compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
);

-- ── Administration ──────────────────────────────────────────────────
create function public.ep_admin_enregistrer_animation(
  p_id uuid, p_type text, p_titre text, p_accroche text, p_description text, p_conditions text,
  p_debut date, p_fin date, p_montant numeric default null, p_points integer default null,
  p_produits text default null, p_lien_kit text default null, p_niveaux public.ep_niveau_iap[] default '{}', p_publie boolean default true
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_titre), '') = '' then raise exception 'Le titre est obligatoire'; end if;
  if p_debut is null or p_fin is null or p_fin < p_debut then raise exception 'Vérifiez les dates de début et de fin'; end if;
  if p_id is null then
    insert into public.ep_animations (type, titre, accroche, description, conditions, debut, fin, montant, points, produits, lien_kit, niveaux, publie, cree_par)
    values (p_type, trim(p_titre), nullif(trim(p_accroche), ''), nullif(trim(p_description), ''), nullif(trim(p_conditions), ''), p_debut, p_fin,
            p_montant, p_points, nullif(trim(p_produits), ''), nullif(trim(p_lien_kit), ''), coalesce(p_niveaux, '{}'), p_publie, auth.uid())
    returning id into v_id;
  else
    update public.ep_animations set type = p_type, titre = trim(p_titre), accroche = nullif(trim(p_accroche), ''), description = nullif(trim(p_description), ''),
      conditions = nullif(trim(p_conditions), ''), debut = p_debut, fin = p_fin, montant = p_montant, points = p_points,
      produits = nullif(trim(p_produits), ''), lien_kit = nullif(trim(p_lien_kit), ''), niveaux = coalesce(p_niveaux, '{}'), publie = p_publie, demo = false
    where id = p_id returning id into v_id;
  end if;
  return v_id;
end $$;

-- ── Participation (client) ──────────────────────────────────────────
create function public.ep_participer_animation(p_animation uuid, p_reference text default null, p_client text default null, p_montant numeric default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare a public.ep_animations; v_compte uuid := public.ep_mon_compte(); v_id uuid;
begin
  if v_compte is null then raise exception 'Réservé aux clients' using errcode = '42501'; end if;
  select * into a from public.ep_animations where id = p_animation and publie;
  if a.id is null then raise exception 'Animation introuvable'; end if;
  if current_date > a.fin then raise exception 'Cette animation est terminée'; end if;
  if cardinality(a.niveaux) > 0 and not exists (select 1 from public.ep_comptes c where c.id = v_compte and c.niveau_iap = any (a.niveaux)) then
    raise exception 'Cette animation est réservée à d’autres niveaux IAP';
  end if;
  if a.type = 'remboursement' then
    if coalesce(trim(p_reference), '') = '' then raise exception 'Indiquez la référence de la facture ou de la commande'; end if;
    insert into public.ep_animation_participations (animation_id, compte_id, auteur, statut, reference, client_final, montant)
    values (a.id, v_compte, auth.uid(), 'depose', trim(p_reference), nullif(trim(p_client), ''), coalesce(p_montant, a.montant))
    returning id into v_id;
  else
    select id into v_id from public.ep_animation_participations where animation_id = a.id and compte_id = v_compte limit 1;
    if v_id is null then
      insert into public.ep_animation_participations (animation_id, compte_id, auteur, statut)
      values (a.id, v_compte, auth.uid(), 'inscrit') returning id into v_id;
    end if;
  end if;
  return v_id;
end $$;

create function public.ep_mon_code_parrainage() returns text
language plpgsql security definer set search_path = '' as $$
declare v_compte uuid := public.ep_mon_compte(); v_code text;
begin
  if v_compte is null then return null; end if;
  select code_parrainage into v_code from public.ep_comptes where id = v_compte;
  if v_code is null then
    loop
      v_code := 'PIC-' || upper(substr(md5(random()::text), 1, 6));
      begin
        update public.ep_comptes set code_parrainage = v_code where id = v_compte;
        exit;
      exception when unique_violation then
        -- code déjà pris : on en tire un autre
      end;
    end loop;
  end if;
  return v_code;
end $$;

create function public.ep_inviter_filleul(p_animation uuid, p_nom text, p_email text default null, p_telephone text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare a public.ep_animations; v_compte uuid := public.ep_mon_compte(); v_id uuid;
begin
  if v_compte is null then raise exception 'Réservé aux clients' using errcode = '42501'; end if;
  select * into a from public.ep_animations where id = p_animation and publie and type = 'parrainage';
  if a.id is null then raise exception 'Animation introuvable'; end if;
  if current_date > a.fin then raise exception 'Cette animation est terminée'; end if;
  if coalesce(trim(p_nom), '') = '' then raise exception 'Indiquez le nom de votre filleul'; end if;
  if coalesce(trim(p_email), '') = '' and coalesce(trim(p_telephone), '') = '' then raise exception 'Indiquez un e-mail ou un téléphone'; end if;
  insert into public.ep_parrainages (animation_id, compte_id, filleul_nom, filleul_email, filleul_telephone)
  values (a.id, v_compte, trim(p_nom), nullif(lower(trim(p_email)), ''), nullif(trim(p_telephone), '')) returning id into v_id;
  -- le parrain est inscrit à l'animation à sa première invitation
  if not exists (select 1 from public.ep_animation_participations where animation_id = a.id and compte_id = v_compte) then
    insert into public.ep_animation_participations (animation_id, compte_id, auteur, statut) values (a.id, v_compte, auth.uid(), 'inscrit');
  end if;
  return v_id;
end $$;

-- ── Traitement (équipes internes habilitées : administrateur) ────────
create function public.ep_traiter_participation(p_id uuid, p_statut text, p_motif text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_statut not in ('depose', 'valide', 'paye', 'refuse') then raise exception 'Statut inconnu'; end if;
  if p_statut = 'refuse' and coalesce(trim(p_motif), '') = '' then raise exception 'Indiquez le motif du refus'; end if;
  update public.ep_animation_participations set statut = p_statut, motif = nullif(trim(p_motif), ''), maj_le = now() where id = p_id;
end $$;

create function public.ep_traiter_parrainage(p_id uuid, p_statut text) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.ep_parrainages; a public.ep_animations;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_statut not in ('invite', 'inscrit', 'recompense') then raise exception 'Statut inconnu'; end if;
  update public.ep_parrainages set statut = p_statut where id = p_id returning * into p;
  select * into a from public.ep_animations where id = p.animation_id;
  if p_statut = 'recompense' and coalesce(a.points, 0) > 0 then
    insert into public.ep_points (compte_id, points, motif) values (p.compte_id, a.points, 'Parrainage : ' || p.filleul_nom);
  end if;
end $$;

-- ── Droits d'accès à la rubrique ────────────────────────────────────
insert into public.ep_droits (module, role, autorise) values
  ('animations', 'admin', true), ('animations', 'codir', true), ('animations', 'chef_service', true), ('animations', 'chef_marche', true),
  ('animations', 'atc', true), ('animations', 'repartiteur', false), ('animations', 'client_gerant', true), ('animations', 'client_equipe', true),
  ('animations', 'sav', false), ('animations', 'bureau_etudes', false), ('animations', 'qualite', false)
on conflict do nothing;

-- ── Démonstration ───────────────────────────────────────────────────
insert into public.ep_animations (type, titre, accroche, description, conditions, debut, fin, montant, points, produits, niveaux, demo) values
  ('offre', 'Mois de la sécurité', 'Une campagne nationale clé en main pour remplir votre carnet de commandes',
   'Affiches, flyers, posts pour les réseaux sociaux et campagne locale co-financée. Inscrivez-vous pour recevoir votre kit personnalisé avec vos coordonnées.',
   'Réservé aux IAP. Inscription avant le 15 février.', date '2027-03-01', date '2027-03-31', null, 200, 'Toute la gamme', '{}', true),
  ('remboursement', 'Jusqu’à 150 € remboursés sur Altitude', 'Offrez un argument décisif à vos clients',
   'Pour tout bloc-porte Altitude posé, votre client final reçoit 150 € de remboursement. Déposez le dossier ici, Picard s’occupe du reste.',
   'Une facture par dossier. Pose réalisée entre le 1er décembre et le 28 février.', date '2026-12-01', date '2027-02-28', 150, null, 'Altitude', '{}', true),
  ('parrainage', 'Parrainez un confrère', 'Faites entrer un serrurier de confiance dans le réseau',
   'Invitez un confrère : s’il devient IAP, vous gagnez 500 points boutique.', 'Le filleul doit passer sa première commande dans les 3 mois.',
   date '2026-11-01', date '2027-06-30', null, 500, null, '{}', true);

revoke execute on function
  public.ep_admin_enregistrer_animation(uuid, text, text, text, text, text, date, date, numeric, integer, text, text, public.ep_niveau_iap[], boolean),
  public.ep_participer_animation(uuid, text, text, numeric), public.ep_mon_code_parrainage(), public.ep_inviter_filleul(uuid, text, text, text),
  public.ep_traiter_participation(uuid, text, text), public.ep_traiter_parrainage(uuid, text)
from public, anon;
grant execute on function
  public.ep_admin_enregistrer_animation(uuid, text, text, text, text, text, date, date, numeric, integer, text, text, public.ep_niveau_iap[], boolean),
  public.ep_participer_animation(uuid, text, text, numeric), public.ep_mon_code_parrainage(), public.ep_inviter_filleul(uuid, text, text, text),
  public.ep_traiter_participation(uuid, text, text), public.ep_traiter_parrainage(uuid, text)
to authenticated;
