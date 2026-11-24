-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : Médiathèque
-- Ressources (photos, vidéos, docs commerciales et techniques), droits
-- par rôle et par niveau IAP, statistiques de téléchargement, stockage
-- privé (bucket ep-ressources, accès par URL signée uniquement).
-- Écritures : uniquement via fonctions réservées à l'administrateur.
-- ════════════════════════════════════════════════════════════════════

create table public.ep_ressources (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  type text not null check (type in ('photo', 'video', 'doc_commerciale', 'doc_technique')),
  gamme text,
  marque text not null default 'commune' check (marque in ('picard', 'eliot', 'commune')),
  fichier_chemin text unique,
  taille_octets bigint,
  format text,
  version integer not null default 1,
  -- Publics : tableau vide = tout le monde. Les niveaux ne filtrent que les clients.
  roles_autorises public.ep_role[] not null default '{}',
  niveaux_autorises public.ep_niveau_iap[] not null default '{}',
  kit text,
  nouveau boolean not null default false,
  actif boolean not null default true,
  demo boolean not null default false,
  cree_le timestamptz not null default now(),
  mis_a_jour_le timestamptz not null default now(),
  cree_par uuid references auth.users (id) on delete set null
);
create index ep_ressources_type_idx on public.ep_ressources (type) where actif;
create index ep_ressources_kit_idx on public.ep_ressources (kit) where actif and kit is not null;
comment on table public.ep_ressources is 'Espace Pro : ressources de la médiathèque';

create table public.ep_telechargements (
  id bigint generated always as identity primary key,
  ressource_id uuid not null references public.ep_ressources (id) on delete cascade,
  utilisateur uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now()
);
create index ep_telechargements_ressource_idx on public.ep_telechargements (ressource_id, cree_le desc);
comment on table public.ep_telechargements is 'Espace Pro : historique des téléchargements de la médiathèque';

-- ── Droits ──────────────────────────────────────────────────────────
create function public.ep_est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.ep_profils where id = auth.uid() and actif), false)
$$;

create function public.ep_ressource_visible(p_roles public.ep_role[], p_niveaux public.ep_niveau_iap[])
returns boolean
language sql stable security definer set search_path = '' as $$
  select public.ep_est_interne() or exists (
    select 1
    from public.ep_profils p
    left join public.ep_comptes c on c.id = p.compte_id
    where p.id = auth.uid() and p.actif
      and (cardinality(p_roles) = 0 or p.role = any (p_roles))
      and (cardinality(p_niveaux) = 0
           or p.role not in ('client_gerant', 'client_equipe')
           or c.niveau_iap = any (p_niveaux))
  )
$$;

alter table public.ep_ressources enable row level security;
alter table public.ep_telechargements enable row level security;

create policy ep_ressources_lecture on public.ep_ressources for select to authenticated using (
  actif and public.ep_ressource_visible(roles_autorises, niveaux_autorises)
);

create policy ep_telechargements_lecture on public.ep_telechargements for select to authenticated using (
  public.ep_est_interne() or utilisateur = auth.uid()
);

-- ── Actions ─────────────────────────────────────────────────────────
create function public.ep_creer_ressource(
  p_titre text,
  p_type text,
  p_description text default null,
  p_gamme text default null,
  p_marque text default 'commune',
  p_fichier_chemin text default null,
  p_taille_octets bigint default null,
  p_format text default null,
  p_roles public.ep_role[] default '{}',
  p_niveaux public.ep_niveau_iap[] default '{}',
  p_kit text default null
) returns public.ep_ressources
language plpgsql security definer set search_path = '' as $$
declare r public.ep_ressources;
begin
  if not public.ep_est_admin() then
    raise exception 'Seul un administrateur peut ajouter une ressource' using errcode = '42501';
  end if;
  if coalesce(trim(p_titre), '') = '' then raise exception 'Le titre est obligatoire'; end if;

  insert into public.ep_ressources (titre, type, description, gamme, marque, fichier_chemin, taille_octets, format,
                                    roles_autorises, niveaux_autorises, kit, nouveau, cree_par)
  values (trim(p_titre), p_type, nullif(trim(p_description), ''), nullif(trim(p_gamme), ''), p_marque, p_fichier_chemin,
          p_taille_octets, nullif(upper(trim(p_format)), ''), coalesce(p_roles, '{}'), coalesce(p_niveaux, '{}'),
          nullif(trim(p_kit), ''), true, auth.uid())
  returning * into r;
  return r;
end $$;

create function public.ep_remplacer_fichier_ressource(p_id uuid, p_fichier_chemin text, p_taille_octets bigint, p_format text)
returns public.ep_ressources
language plpgsql security definer set search_path = '' as $$
declare r public.ep_ressources;
begin
  if not public.ep_est_admin() then
    raise exception 'Seul un administrateur peut modifier une ressource' using errcode = '42501';
  end if;
  update public.ep_ressources
     set fichier_chemin = p_fichier_chemin, taille_octets = p_taille_octets, format = nullif(upper(trim(p_format)), ''),
         version = version + 1, mis_a_jour_le = now()
   where id = p_id
  returning * into r;
  if r.id is null then raise exception 'Ressource introuvable'; end if;
  return r;
end $$;

create function public.ep_archiver_ressource(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then
    raise exception 'Seul un administrateur peut archiver une ressource' using errcode = '42501';
  end if;
  update public.ep_ressources set actif = false where id = p_id;
end $$;

create function public.ep_enregistrer_telechargement(p_ressource uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.ep_ressources r
    where r.id = p_ressource and r.actif and public.ep_ressource_visible(r.roles_autorises, r.niveaux_autorises)
  ) then
    raise exception 'Ressource introuvable';
  end if;
  insert into public.ep_telechargements (ressource_id, utilisateur) values (p_ressource, auth.uid());
end $$;

create function public.ep_stats_mediatheque(p_jours integer default 30) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'ressources', (select count(*) from public.ep_ressources),
    'nouveautes', (select count(*) from public.ep_ressources where nouveau or cree_le > now() - make_interval(days => p_jours)),
    'mises_a_jour', (select count(*) from public.ep_ressources where version > 1 and mis_a_jour_le > now() - make_interval(days => p_jours)),
    'telechargements', (select count(*) from public.ep_telechargements where cree_le > now() - make_interval(days => p_jours)),
    'par_ressource', (select coalesce(jsonb_object_agg(ressource_id, n), '{}') from (
      select ressource_id, count(*) n from public.ep_telechargements
      where cree_le > now() - make_interval(days => p_jours) group by ressource_id) t)
  )
$$;

revoke execute on function
  public.ep_est_admin(), public.ep_ressource_visible(public.ep_role[], public.ep_niveau_iap[]),
  public.ep_creer_ressource(text, text, text, text, text, text, bigint, text, public.ep_role[], public.ep_niveau_iap[], text),
  public.ep_remplacer_fichier_ressource(uuid, text, bigint, text), public.ep_archiver_ressource(uuid),
  public.ep_enregistrer_telechargement(uuid), public.ep_stats_mediatheque(integer)
from public, anon;

grant execute on function
  public.ep_est_admin(), public.ep_ressource_visible(public.ep_role[], public.ep_niveau_iap[]),
  public.ep_creer_ressource(text, text, text, text, text, text, bigint, text, public.ep_role[], public.ep_niveau_iap[], text),
  public.ep_remplacer_fichier_ressource(uuid, text, bigint, text), public.ep_archiver_ressource(uuid),
  public.ep_enregistrer_telechargement(uuid), public.ep_stats_mediatheque(integer)
to authenticated;

revoke all on public.ep_ressources, public.ep_telechargements from anon;

-- ════════════════════════════════════════════════════════════════════
-- Stockage privé : lecture selon les droits de la ressource liée,
-- dépôt et suppression réservés à l'administrateur.
-- ════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit)
values ('ep-ressources', 'ep-ressources', false, 524288000)
on conflict (id) do nothing;

create policy ep_ressources_fichiers_lecture on storage.objects for select to authenticated using (
  bucket_id = 'ep-ressources'
  and (
    public.ep_est_admin()
    or exists (
      select 1 from public.ep_ressources r
      where r.fichier_chemin = storage.objects.name
        and r.actif
        and public.ep_ressource_visible(r.roles_autorises, r.niveaux_autorises)
    )
  )
);

create policy ep_ressources_fichiers_depot on storage.objects for insert to authenticated with check (
  bucket_id = 'ep-ressources' and public.ep_est_admin()
);

create policy ep_ressources_fichiers_modification on storage.objects for update to authenticated using (
  bucket_id = 'ep-ressources' and public.ep_est_admin()
);

create policy ep_ressources_fichiers_suppression on storage.objects for delete to authenticated using (
  bucket_id = 'ep-ressources' and public.ep_est_admin()
);

-- ════════════════════════════════════════════════════════════════════
-- Ressources de démonstration (sans fichier) :
-- delete from public.ep_ressources where demo;
-- ════════════════════════════════════════════════════════════════════
insert into public.ep_ressources
  (titre, description, type, gamme, marque, taille_octets, format, version, roles_autorises, niveaux_autorises, kit, nouveau, demo, cree_le, mis_a_jour_le)
values
  ('Fiche technique Altitude', 'Caractéristiques, performances et cotes de fabrication de la porte blindée Altitude.', 'doc_technique', 'Altitude', 'picard', 2400000, 'PDF', 3, '{}', '{}', 'Lancement Altitude', false, true, now() - interval '120 days', now() - interval '1 day'),
  ('Notice de pose Altitude', 'Pose en rénovation et en construction neuve, étape par étape.', 'doc_technique', 'Altitude', 'picard', 5100000, 'PDF', 3, '{}', '{}', 'Lancement Altitude', false, true, now() - interval '120 days', now() - interval '1 day'),
  ('Visuels d’ambiance Altitude', '24 photos haute définition en situation, libres de droits pour le réseau.', 'photo', 'Altitude', 'picard', 182000000, 'ZIP', 1, '{}', '{}', 'Lancement Altitude', true, true, now() - interval '6 days', now() - interval '6 days'),
  ('Argumentaire Altitude', 'Les arguments de vente et les réponses aux objections courantes.', 'doc_commerciale', 'Altitude', 'picard', 3200000, 'PDF', 1, '{}', '{}', 'Lancement Altitude', true, true, now() - interval '6 days', now() - interval '6 days'),
  ('Vidéo de pose d’un bloc-porte A2P BP3', 'Tutoriel de 6 minutes filmé en atelier.', 'video', 'Horizon', 'picard', 240000000, 'MP4', 1, '{}', '{}', null, false, true, now() - interval '60 days', now() - interval '60 days'),
  ('Tutoriel de prise de cotes', 'Mesurer un tableau, une feuillure et un passage libre sans erreur.', 'video', 'Toutes gammes', 'commune', 95000000, 'MP4', 2, '{}', '{}', null, false, true, now() - interval '200 days', now() - interval '20 days'),
  ('Catalogue 2027', 'Toutes les gammes Picard Serrures, avec les nouveautés de l’année.', 'doc_commerciale', 'Toutes gammes', 'picard', 48000000, 'PDF', 1, '{}', '{}', null, true, true, now() - interval '3 days', now() - interval '3 days'),
  ('Catalogue Eliot 2027', 'Gammes et finitions Eliot.', 'doc_commerciale', 'Toutes gammes', 'eliot', 36000000, 'PDF', 1, '{}', '{}', null, true, true, now() - interval '3 days', now() - interval '3 days'),
  ('Procès-verbaux de certification A2P', 'PV CNPP des portes et serrures certifiées.', 'doc_technique', 'Toutes gammes', 'commune', 1100000, 'PDF', 4, '{}', '{}', null, false, true, now() - interval '400 days', now() - interval '40 days'),
  ('Photos produits détourées', '120 visuels détourés sur fond transparent, pour devis et site web.', 'photo', 'Toutes gammes', 'commune', 310000000, 'ZIP', 2, '{}', '{}', null, false, true, now() - interval '300 days', now() - interval '25 days'),
  ('Guide de choix des cylindres', 'Choisir le bon cylindre selon le niveau de sécurité et la porte.', 'doc_technique', 'Cylindres', 'picard', 2800000, 'PDF', 1, '{}', '{}', null, false, true, now() - interval '90 days', now() - interval '90 days'),
  ('Kit vitrine Mois de la sécurité', 'Affiche, vitrophanie et chevalet de comptoir prêts à imprimer.', 'doc_commerciale', 'Toutes gammes', 'picard', 64000000, 'ZIP', 1, '{}', '{}', 'Mois de la sécurité', true, true, now() - interval '2 days', now() - interval '2 days'),
  ('Posts réseaux sociaux Mois de la sécurité', '8 visuels carrés et 4 stories, à personnaliser avec votre logo.', 'photo', 'Toutes gammes', 'picard', 42000000, 'ZIP', 1, '{}', '{}', 'Mois de la sécurité', true, true, now() - interval '2 days', now() - interval '2 days'),
  ('Visuels showroom premium', 'Photographies grand format réservées à la mise en valeur des showrooms IAP Elite.', 'photo', 'Quartz', 'picard', 260000000, 'ZIP', 1, '{}', '{Elite}', null, false, true, now() - interval '45 days', now() - interval '45 days'),
  ('Grille tarifaire 2027', 'Tarifs publics et remises par niveau. Document interne.', 'doc_commerciale', 'Toutes gammes', 'picard', 900000, 'XLSX', 2, '{admin,codir,chef_service,chef_marche,atc}', '{}', null, false, true, now() - interval '30 days', now() - interval '8 days'),
  ('Présentation de l’offre IAP', 'Support de rendez-vous pour recruter un nouvel installateur agréé.', 'doc_commerciale', 'Toutes gammes', 'picard', 12000000, 'PPTX', 1, '{admin,codir,chef_service,chef_marche,atc}', '{}', null, false, true, now() - interval '75 days', now() - interval '75 days');

insert into public.ep_telechargements (ressource_id, cree_le)
select r.id, now() - make_interval(hours => (random() * 24 * 28)::int)
from public.ep_ressources r, generate_series(1, 30) g
where r.demo and random() < case when r.nouveau then 0.6 else 0.3 end;
