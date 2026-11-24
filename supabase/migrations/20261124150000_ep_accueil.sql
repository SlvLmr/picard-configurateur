-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : accueil (annonces, événements, récapitulatif)
-- Ciblage par rôle et niveau IAP via ep_ressource_visible (tableau vide = tous).
-- ════════════════════════════════════════════════════════════════════

create table public.ep_annonces (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text not null,
  ton text not null default 'info' check (ton in ('info', 'operation', 'important')),
  lien_libelle text,
  lien_url text,
  roles public.ep_role[] not null default '{}',
  niveaux public.ep_niveau_iap[] not null default '{}',
  debut date not null default current_date,
  fin date,
  epinglee boolean not null default false,
  archivee boolean not null default false,
  demo boolean not null default false,
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now()
);
comment on table public.ep_annonces is 'Espace Pro : messages d’actualité affichés sur l’accueil';

create table public.ep_evenements (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  type text not null check (type in ('salon', 'formation', 'operation', 'webinaire', 'reunion')),
  description text,
  lieu text,
  debut timestamptz not null,
  fin timestamptz,
  lien_url text,
  roles public.ep_role[] not null default '{}',
  niveaux public.ep_niveau_iap[] not null default '{}',
  archive boolean not null default false,
  demo boolean not null default false,
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now()
);
create index ep_evenements_debut_idx on public.ep_evenements (debut) where not archive;
comment on table public.ep_evenements is 'Espace Pro : salons, formations, opérations et webinaires';

alter table public.ep_annonces enable row level security;
alter table public.ep_evenements enable row level security;
revoke all on public.ep_annonces, public.ep_evenements from anon;
revoke insert, update, delete on public.ep_annonces, public.ep_evenements from authenticated;

create policy ep_annonces_lecture on public.ep_annonces for select to authenticated using (
  public.ep_est_admin()
  or (not archivee and debut <= current_date and (fin is null or fin >= current_date)
      and public.ep_ressource_visible(roles, niveaux))
);

create policy ep_evenements_lecture on public.ep_evenements for select to authenticated using (
  public.ep_est_admin() or (not archive and public.ep_ressource_visible(roles, niveaux))
);

-- ── Publication (administrateur) ────────────────────────────────────
create function public.ep_publier_annonce(
  p_titre text, p_contenu text, p_ton text default 'info', p_lien_libelle text default null, p_lien_url text default null,
  p_roles public.ep_role[] default '{}', p_niveaux public.ep_niveau_iap[] default '{}',
  p_debut date default current_date, p_fin date default null, p_epinglee boolean default false
) returns public.ep_annonces
language plpgsql security definer set search_path = '' as $$
declare r public.ep_annonces;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_titre), '') = '' or coalesce(trim(p_contenu), '') = '' then raise exception 'Le titre et le message sont obligatoires'; end if;
  if p_fin is not null and p_fin < p_debut then raise exception 'La date de fin précède la date de début'; end if;
  insert into public.ep_annonces (titre, contenu, ton, lien_libelle, lien_url, roles, niveaux, debut, fin, epinglee, cree_par)
  values (trim(p_titre), trim(p_contenu), p_ton, nullif(trim(p_lien_libelle), ''), nullif(trim(p_lien_url), ''),
          coalesce(p_roles, '{}'), coalesce(p_niveaux, '{}'), coalesce(p_debut, current_date), p_fin, p_epinglee, auth.uid())
  returning * into r;
  return r;
end $$;

create function public.ep_archiver_annonce(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  update public.ep_annonces set archivee = true where id = p_id;
end $$;

create function public.ep_creer_evenement(
  p_titre text, p_type text, p_debut timestamptz, p_fin timestamptz default null, p_lieu text default null,
  p_description text default null, p_lien_url text default null,
  p_roles public.ep_role[] default '{}', p_niveaux public.ep_niveau_iap[] default '{}'
) returns public.ep_evenements
language plpgsql security definer set search_path = '' as $$
declare r public.ep_evenements;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_titre), '') = '' then raise exception 'Le titre est obligatoire'; end if;
  if p_fin is not null and p_fin < p_debut then raise exception 'La fin précède le début'; end if;
  insert into public.ep_evenements (titre, type, debut, fin, lieu, description, lien_url, roles, niveaux, cree_par)
  values (trim(p_titre), p_type, p_debut, p_fin, nullif(trim(p_lieu), ''), nullif(trim(p_description), ''), nullif(trim(p_lien_url), ''),
          coalesce(p_roles, '{}'), coalesce(p_niveaux, '{}'), auth.uid())
  returning * into r;
  return r;
end $$;

create function public.ep_archiver_evenement(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  update public.ep_evenements set archive = true where id = p_id;
end $$;

-- ── Récapitulatif (droits de l'appelant : chacun ne compte que son périmètre) ──
create function public.ep_accueil_recap() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'leads_a_valider', (select count(*) from public.ep_leads where statut = 'a_valider'),
    'leads_a_accepter', (select count(*) from public.ep_leads where statut = 'attribue'),
    'leads_en_suivi', (select count(*) from public.ep_leads where statut in ('accepte', 'contacte', 'devis')),
    'sav_ouverts', (select count(*) from public.ep_sav_demandes where statut not in ('resolue', 'cloturee')),
    'sav_reponse_attendue', (select count(*) from public.ep_sav_demandes where statut = 'infos_demandees'),
    'sav_nouveaux', (select count(*) from public.ep_sav_demandes where statut = 'nouvelle'),
    'commandes_a_valider', (select count(*) from public.ep_commandes where statut = 'a_valider'),
    'configurations_devis', (select count(*) from public.ep_configurations where statut = 'devis'),
    'visites_aujourdhui', (select count(*) from public.ep_activites
                            where statut = 'planifiee' and (date_prevue at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date),
    'actions_en_retard', (select count(*) from public.ep_actions where statut = 'a_faire' and echeance < (now() at time zone 'Europe/Paris')::date),
    'points', public.ep_solde_points(null)
  )
$$;

revoke execute on function
  public.ep_publier_annonce(text, text, text, text, text, public.ep_role[], public.ep_niveau_iap[], date, date, boolean),
  public.ep_archiver_annonce(uuid),
  public.ep_creer_evenement(text, text, timestamptz, timestamptz, text, text, text, public.ep_role[], public.ep_niveau_iap[]),
  public.ep_archiver_evenement(uuid), public.ep_accueil_recap()
from public, anon;
grant execute on function
  public.ep_publier_annonce(text, text, text, text, text, public.ep_role[], public.ep_niveau_iap[], date, date, boolean),
  public.ep_archiver_annonce(uuid),
  public.ep_creer_evenement(text, text, timestamptz, timestamptz, text, text, text, public.ep_role[], public.ep_niveau_iap[]),
  public.ep_archiver_evenement(uuid), public.ep_accueil_recap()
to authenticated;

-- ── Démonstration (supprimable : delete ... where demo) ──────────────
insert into public.ep_annonces (titre, contenu, ton, lien_libelle, lien_url, roles, niveaux, debut, fin, epinglee, demo) values
  ('Mois de la sécurité : inscriptions ouvertes',
   'Du 1er au 31 mars, une opération nationale avec flyers, affiches et campagne locale co-financée à 50 % pour les IAP Elite. Inscrivez-vous avant le 15 février.',
   'operation', 'Voir l’opération', '/marketing', '{}', '{}', current_date - 3, current_date + 60, true, true),
  ('Nouvelle notice de pose de la gamme Altitude',
   'La version 3 corrige les cotes de réservation en rénovation. Remplacez vos exemplaires imprimés.',
   'info', 'Ouvrir la Médiathèque', '/mediatheque', '{}', '{}', current_date - 1, current_date + 30, false, true),
  ('Hausse tarifaire au 1er janvier',
   'Les nouveaux tarifs sont disponibles dans la Médiathèque. Les devis émis avant le 31 décembre restent valables 30 jours.',
   'important', null, null, '{}', '{}', current_date, current_date + 45, false, true);

insert into public.ep_evenements (titre, type, description, lieu, debut, fin, roles, niveaux, demo) values
  ('Salon Equip Baie', 'salon', 'Stand Picard Serrures, hall 4. Invitations disponibles auprès de votre commercial.', 'Paris Expo, porte de Versailles',
   date_trunc('day', now()) + interval '12 days 9 hours', date_trunc('day', now()) + interval '14 days 18 hours', '{}', '{}', true),
  ('Formation pose bloc-porte A2P BP3', 'formation', 'Une journée en atelier, deux techniciens par entreprise. Rapporte 200 points.', 'Usine Picard, Feuquières',
   date_trunc('day', now()) + interval '5 days 9 hours', date_trunc('day', now()) + interval '5 days 17 hours', '{}', '{}', true),
  ('Webinaire : vendre la sécurité au particulier', 'webinaire', 'Argumentaire, objections et financement, en 45 minutes.', 'En ligne',
   date_trunc('day', now()) + interval '2 days 11 hours', date_trunc('day', now()) + interval '2 days 11 hours 45 minutes', '{}', '{}', true),
  ('Lancement du Mois de la sécurité', 'operation', 'Début de l’opération nationale.', null,
   date_trunc('day', now()) + interval '20 days', null, '{}', '{}', true),
  ('Réunion commerciale trimestrielle', 'reunion', 'Bilan du trimestre et objectifs.', 'Siège, salle Altitude',
   date_trunc('day', now()) + interval '8 days 14 hours', date_trunc('day', now()) + interval '8 days 17 hours',
   array['admin', 'codir', 'chef_service', 'chef_marche', 'atc']::public.ep_role[], '{}', true),
  ('Club IAP Elite', 'reunion', 'Rencontre annuelle des IAP Elite : nouveautés et avant-premières.', 'Lyon',
   date_trunc('day', now()) + interval '26 days 10 hours', date_trunc('day', now()) + interval '26 days 18 hours',
   '{}', array['Elite']::public.ep_niveau_iap[], true);
