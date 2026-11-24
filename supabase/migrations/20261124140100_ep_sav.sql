-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : module SAV (remplace Qualios pour le SAV)
-- Demandes, fil d'échanges, fichiers (bucket privé ep-sav), historique.
-- Lecture : règles par ligne selon le rôle. Écritures : uniquement via
-- fonctions (RPC) qui vérifient le rôle de l'appelant.
-- Données de démonstration : delete from public.ep_sav_demandes where demo;
-- ════════════════════════════════════════════════════════════════════

create type public.ep_sav_type as enum ('reclamation_garantie', 'pieces_detachees', 'assistance_technique', 'livraison_litige');
create type public.ep_sav_statut as enum (
  'nouvelle', 'en_analyse', 'infos_demandees', 'avis_technique', 'decision', 'en_resolution', 'resolue', 'cloturee'
);
create type public.ep_sav_decision as enum ('garantie_acceptee', 'garantie_refusee', 'geste_commercial');
create type public.ep_sav_resolution as enum ('piece_envoyee', 'retour_produit', 'remplacement', 'avoir');

create sequence public.ep_sav_numero_seq start 1000;

create table public.ep_sav_demandes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('S-' || nextval('public.ep_sav_numero_seq')),
  cree_le timestamptz not null default now(),
  mis_a_jour_le timestamptz not null default now(),
  compte_id uuid not null references public.ep_comptes (id) on delete restrict,
  declare_par uuid references auth.users (id) on delete set null,
  declarant_nom text,
  declarant_role text,
  type public.ep_sav_type not null,
  gamme text,
  produit text,
  reference_produit text,
  numero_commande text,
  numero_serie text,
  description text not null,
  adresse_chantier text,
  statut public.ep_sav_statut not null default 'nouvelle',
  affecte_a uuid references auth.users (id) on delete set null,
  decision public.ep_sav_decision,
  decision_motif text,
  decide_le timestamptz,
  resolution public.ep_sav_resolution,
  avoir_reference text,
  avoir_montant numeric(12, 2),
  bon_retour text,
  resolu_le timestamptz,
  cloture_le timestamptz,
  non_conformite boolean,
  cause text,
  action_corrective text,
  qualifie_le timestamptz,
  demo boolean not null default false
);
create index ep_sav_demandes_compte_idx on public.ep_sav_demandes (compte_id);
create index ep_sav_demandes_statut_idx on public.ep_sav_demandes (statut);
create index ep_sav_demandes_affecte_idx on public.ep_sav_demandes (affecte_a);
comment on table public.ep_sav_demandes is 'Espace Pro : demandes SAV (réclamation, pièces, assistance, livraison)';

create table public.ep_sav_messages (
  id bigint generated always as identity primary key,
  demande_id uuid not null references public.ep_sav_demandes (id) on delete cascade,
  auteur uuid references auth.users (id) on delete set null,
  auteur_nom text not null,
  auteur_role text,
  contenu text not null,
  interne boolean not null default false,
  cree_le timestamptz not null default now()
);
create index ep_sav_messages_demande_idx on public.ep_sav_messages (demande_id, cree_le);

create table public.ep_sav_fichiers (
  id bigint generated always as identity primary key,
  demande_id uuid not null references public.ep_sav_demandes (id) on delete cascade,
  chemin text not null unique,
  nom text not null,
  type_mime text,
  taille_octets bigint,
  ajoute_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now()
);
create index ep_sav_fichiers_demande_idx on public.ep_sav_fichiers (demande_id);

create table public.ep_sav_evenements (
  id bigint generated always as identity primary key,
  demande_id uuid not null references public.ep_sav_demandes (id) on delete cascade,
  type text not null check (type in ('declaration', 'statut', 'affectation', 'decision', 'resolution', 'qualification', 'message', 'fichier')),
  statut public.ep_sav_statut,
  details jsonb,
  auteur uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now()
);
create index ep_sav_evenements_demande_idx on public.ep_sav_evenements (demande_id, cree_le);

-- ════════════════════════════════════════════════════════════════════
-- Droits
-- ════════════════════════════════════════════════════════════════════
create function public.ep_sav_role() returns text
language sql stable security definer set search_path = '' as $$
  select role::text from public.ep_profils where id = auth.uid() and actif
$$;

create function public.ep_sav_est_client() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.ep_sav_role() in ('client_gerant', 'client_equipe'), false)
$$;

create function public.ep_sav_peut_traiter() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.ep_sav_role() in ('admin', 'sav'), false)
$$;

create function public.ep_sav_peut_voir(p_demande uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare r text := public.ep_sav_role(); d record;
begin
  if r is null then return false; end if;
  select id, compte_id, statut, affecte_a into d from public.ep_sav_demandes where id = p_demande;
  if d.id is null then return false; end if;
  return r in ('admin', 'codir', 'chef_service', 'chef_marche', 'sav', 'qualite')
    or (r = 'bureau_etudes' and (d.statut = 'avis_technique' or d.affecte_a = auth.uid()))
    or (r = 'atc' and exists (select 1 from public.ep_comptes c where c.id = d.compte_id and c.commercial_id = public.ep_mon_commercial()))
    or (r in ('client_gerant', 'client_equipe') and d.compte_id = public.ep_mon_compte());
end $$;

-- Dossier de stockage « <id de la demande>/… » autorisé pour l'appelant
create function public.ep_sav_dossier_autorise(p_chemin text, p_ecriture boolean) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare v_id text := split_part(p_chemin, '/', 1);
begin
  if v_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  if not public.ep_sav_peut_voir(v_id::uuid) then return false; end if;
  if p_ecriture then
    return exists (select 1 from public.ep_sav_demandes where id = v_id::uuid and statut <> 'cloturee');
  end if;
  return true;
end $$;

-- Nom affiché de l'appelant dans le fil d'échanges
create function public.ep_sav_nom_appelant() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select case
       when p.role::text in ('client_gerant', 'client_equipe') then coalesce(c.raison_sociale, trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')))
       when p.role::text = 'sav' then trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')) || ', service SAV'
       when p.role::text = 'bureau_etudes' then trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')) || ', bureau d’études'
       when p.role::text = 'qualite' then trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')) || ', qualité'
       else trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, ''))
     end
     from public.ep_profils p left join public.ep_comptes c on c.id = p.compte_id
     where p.id = auth.uid()),
    'Utilisateur')
$$;

alter table public.ep_sav_demandes enable row level security;
alter table public.ep_sav_messages enable row level security;
alter table public.ep_sav_fichiers enable row level security;
alter table public.ep_sav_evenements enable row level security;

create policy ep_sav_demandes_lecture on public.ep_sav_demandes for select to authenticated
  using (public.ep_sav_peut_voir(id));
create policy ep_sav_messages_lecture on public.ep_sav_messages for select to authenticated
  using (public.ep_sav_peut_voir(demande_id) and (not interne or not public.ep_sav_est_client()));
create policy ep_sav_fichiers_lecture on public.ep_sav_fichiers for select to authenticated
  using (public.ep_sav_peut_voir(demande_id));
create policy ep_sav_evenements_lecture on public.ep_sav_evenements for select to authenticated
  using (public.ep_sav_peut_voir(demande_id) and (not public.ep_sav_est_client() or type in ('declaration', 'statut', 'decision', 'resolution')));

revoke all on public.ep_sav_demandes, public.ep_sav_messages, public.ep_sav_fichiers, public.ep_sav_evenements from anon;

-- ── Stockage privé des photos et vidéos ─────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('ep-sav', 'ep-sav', false, 209715200)
on conflict (id) do nothing;

create policy ep_sav_fichiers_lecture_stockage on storage.objects for select to authenticated using (
  bucket_id = 'ep-sav' and public.ep_sav_dossier_autorise(name, false)
);
create policy ep_sav_fichiers_depot on storage.objects for insert to authenticated with check (
  bucket_id = 'ep-sav' and public.ep_sav_dossier_autorise(name, true)
);
create policy ep_sav_fichiers_suppression on storage.objects for delete to authenticated using (
  bucket_id = 'ep-sav' and public.ep_sav_peut_traiter()
);

-- ════════════════════════════════════════════════════════════════════
-- Actions (RPC)
-- ════════════════════════════════════════════════════════════════════
create function public.ep_sav_journaliser(p_demande uuid, p_type text, p_statut public.ep_sav_statut, p_details jsonb)
returns void
language sql security definer set search_path = '' as $$
  insert into public.ep_sav_evenements (demande_id, type, statut, details, auteur)
  values (p_demande, p_type, p_statut, p_details, auth.uid());
  update public.ep_sav_demandes set mis_a_jour_le = now() where id = p_demande;
$$;

create function public.ep_sav_declarer(
  p_type public.ep_sav_type, p_description text, p_compte uuid default null,
  p_gamme text default null, p_produit text default null, p_reference_produit text default null,
  p_numero_commande text default null, p_numero_serie text default null, p_adresse text default null
) returns public.ep_sav_demandes
language plpgsql security definer set search_path = '' as $$
declare r text := public.ep_sav_role(); v_compte uuid; d public.ep_sav_demandes;
begin
  if r in ('client_gerant', 'client_equipe') then
    v_compte := public.ep_mon_compte();
  elsif r = 'atc' then
    if not exists (select 1 from public.ep_comptes where id = p_compte and commercial_id = public.ep_mon_commercial()) then
      raise exception 'Ce client ne fait pas partie de votre portefeuille';
    end if;
    v_compte := p_compte;
  elsif r in ('admin', 'sav') then
    if not exists (select 1 from public.ep_comptes where id = p_compte) then raise exception 'Choisissez le client concerné'; end if;
    v_compte := p_compte;
  else
    raise exception 'Votre profil ne permet pas de déclarer une demande SAV' using errcode = '42501';
  end if;
  if v_compte is null then raise exception 'Aucun compte client rattaché à votre profil'; end if;
  if coalesce(trim(p_description), '') = '' then raise exception 'Décrivez le problème rencontré'; end if;
  if p_type = 'reclamation_garantie' and coalesce(trim(p_numero_commande), '') = '' then
    raise exception 'Le numéro de commande d’origine est nécessaire pour vérifier la garantie';
  end if;

  insert into public.ep_sav_demandes (
    compte_id, declare_par, declarant_nom, declarant_role, type, gamme, produit, reference_produit,
    numero_commande, numero_serie, description, adresse_chantier
  ) values (
    v_compte, auth.uid(), public.ep_sav_nom_appelant(), r, p_type, nullif(trim(p_gamme), ''), nullif(trim(p_produit), ''),
    nullif(trim(p_reference_produit), ''), nullif(trim(p_numero_commande), ''), nullif(trim(p_numero_serie), ''),
    trim(p_description), nullif(trim(p_adresse), '')
  ) returning * into d;

  perform public.ep_sav_journaliser(d.id, 'declaration', 'nouvelle', jsonb_build_object('type', p_type));
  return d;
end $$;

create function public.ep_sav_ajouter_fichier(p_demande uuid, p_chemin text, p_nom text, p_type_mime text, p_taille bigint)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_sav_peut_voir(p_demande) then raise exception 'Demande introuvable'; end if;
  if split_part(p_chemin, '/', 1) <> p_demande::text then raise exception 'Emplacement de fichier invalide'; end if;
  if exists (select 1 from public.ep_sav_demandes where id = p_demande and statut = 'cloturee') then
    raise exception 'Cette demande est clôturée';
  end if;
  insert into public.ep_sav_fichiers (demande_id, chemin, nom, type_mime, taille_octets, ajoute_par)
  values (p_demande, p_chemin, p_nom, p_type_mime, p_taille, auth.uid());
  perform public.ep_sav_journaliser(p_demande, 'fichier', null, jsonb_build_object('nom', p_nom));
end $$;

create function public.ep_sav_ajouter_message(p_demande uuid, p_contenu text, p_interne boolean default false)
returns void
language plpgsql security definer set search_path = '' as $$
declare d public.ep_sav_demandes; v_client boolean := public.ep_sav_est_client();
begin
  if not public.ep_sav_peut_voir(p_demande) then raise exception 'Demande introuvable'; end if;
  if coalesce(trim(p_contenu), '') = '' then raise exception 'Le message est vide'; end if;
  select * into d from public.ep_sav_demandes where id = p_demande for update;
  if d.statut = 'cloturee' then raise exception 'Cette demande est clôturée'; end if;

  insert into public.ep_sav_messages (demande_id, auteur, auteur_nom, auteur_role, contenu, interne)
  values (p_demande, auth.uid(), public.ep_sav_nom_appelant(), public.ep_sav_role(), trim(p_contenu), p_interne and not v_client);
  perform public.ep_sav_journaliser(p_demande, 'message', null, jsonb_build_object('interne', p_interne and not v_client));

  -- La réponse du client relance l'analyse
  if v_client and d.statut = 'infos_demandees' then
    update public.ep_sav_demandes set statut = 'en_analyse' where id = p_demande;
    perform public.ep_sav_journaliser(p_demande, 'statut', 'en_analyse', jsonb_build_object('motif', 'Réponse du client'));
  end if;
end $$;

create function public.ep_sav_changer_statut(p_demande uuid, p_statut public.ep_sav_statut, p_message text default null)
returns public.ep_sav_demandes
language plpgsql security definer set search_path = '' as $$
declare r text := public.ep_sav_role(); d public.ep_sav_demandes;
begin
  select * into d from public.ep_sav_demandes where id = p_demande for update;
  if d.id is null or not public.ep_sav_peut_voir(p_demande) then raise exception 'Demande introuvable'; end if;

  if r = 'bureau_etudes' then
    -- Le bureau d'études rend son avis : retour en analyse, avec un message obligatoire
    if d.statut <> 'avis_technique' or p_statut <> 'en_analyse' then raise exception 'Action non autorisée'; end if;
    if coalesce(trim(p_message), '') = '' then raise exception 'Rédigez votre avis technique'; end if;
  elsif r not in ('admin', 'sav') then
    raise exception 'Réservé au service SAV' using errcode = '42501';
  end if;
  if p_statut not in ('en_analyse', 'infos_demandees', 'avis_technique', 'cloturee') then
    raise exception 'Utilisez les actions Décider ou Résoudre pour ce statut';
  end if;
  if p_statut = 'infos_demandees' and coalesce(trim(p_message), '') = '' then
    raise exception 'Précisez les informations attendues du client';
  end if;
  if d.statut = 'cloturee' then raise exception 'Cette demande est déjà clôturée'; end if;

  update public.ep_sav_demandes set
    statut = p_statut,
    affecte_a = case when p_statut = 'en_analyse' and affecte_a is null and r = 'sav' then auth.uid() else affecte_a end,
    cloture_le = case when p_statut = 'cloturee' then now() else cloture_le end
  where id = p_demande returning * into d;

  if coalesce(trim(p_message), '') <> '' then
    insert into public.ep_sav_messages (demande_id, auteur, auteur_nom, auteur_role, contenu, interne)
    values (p_demande, auth.uid(), public.ep_sav_nom_appelant(), r, trim(p_message), p_statut = 'avis_technique' or r = 'bureau_etudes');
  end if;
  perform public.ep_sav_journaliser(p_demande, 'statut', p_statut, null);
  return d;
end $$;

create function public.ep_sav_affecter(p_demande uuid, p_utilisateur uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_sav_peut_traiter() then raise exception 'Réservé au service SAV' using errcode = '42501'; end if;
  if not exists (select 1 from public.ep_sav_demandes where id = p_demande) then raise exception 'Demande introuvable'; end if;
  if p_utilisateur is not null and not exists (
    select 1 from public.ep_profils where id = p_utilisateur and actif and role::text in ('admin', 'sav', 'bureau_etudes', 'qualite')
  ) then raise exception 'Cette personne ne peut pas traiter de demande SAV'; end if;
  update public.ep_sav_demandes set affecte_a = p_utilisateur where id = p_demande;
  perform public.ep_sav_journaliser(p_demande, 'affectation', null, jsonb_build_object('utilisateur', p_utilisateur));
end $$;

create function public.ep_sav_decider(p_demande uuid, p_decision public.ep_sav_decision, p_motif text default null)
returns public.ep_sav_demandes
language plpgsql security definer set search_path = '' as $$
declare d public.ep_sav_demandes; v_texte text;
begin
  if not public.ep_sav_peut_traiter() then raise exception 'Réservé au service SAV' using errcode = '42501'; end if;
  select * into d from public.ep_sav_demandes where id = p_demande for update;
  if d.id is null then raise exception 'Demande introuvable'; end if;
  if d.statut in ('resolue', 'cloturee') then raise exception 'Cette demande est déjà traitée'; end if;
  if p_decision = 'garantie_refusee' and coalesce(trim(p_motif), '') = '' then
    raise exception 'Indiquez le motif du refus : il sera communiqué au client';
  end if;

  update public.ep_sav_demandes set
    decision = p_decision, decision_motif = nullif(trim(p_motif), ''), decide_le = now(),
    statut = case when p_decision = 'garantie_refusee' then 'resolue' else 'en_resolution' end::public.ep_sav_statut,
    resolu_le = case when p_decision = 'garantie_refusee' then now() else resolu_le end,
    affecte_a = coalesce(affecte_a, auth.uid())
  where id = p_demande returning * into d;

  v_texte := case p_decision
    when 'garantie_acceptee' then 'Votre demande est prise en charge au titre de la garantie.'
    when 'geste_commercial' then 'Votre demande est prise en charge par un geste commercial.'
    else 'Votre demande n’est pas prise en charge au titre de la garantie.'
  end || coalesce(' ' || nullif(trim(p_motif), ''), '');
  insert into public.ep_sav_messages (demande_id, auteur, auteur_nom, auteur_role, contenu, interne)
  values (p_demande, auth.uid(), public.ep_sav_nom_appelant(), public.ep_sav_role(), v_texte, false);
  perform public.ep_sav_journaliser(p_demande, 'decision', d.statut, jsonb_build_object('decision', p_decision));
  return d;
end $$;

create function public.ep_sav_resoudre(
  p_demande uuid, p_resolution public.ep_sav_resolution, p_commentaire text default null,
  p_avoir_reference text default null, p_avoir_montant numeric default null, p_bon_retour text default null
) returns public.ep_sav_demandes
language plpgsql security definer set search_path = '' as $$
declare d public.ep_sav_demandes; v_texte text;
begin
  if not public.ep_sav_peut_traiter() then raise exception 'Réservé au service SAV' using errcode = '42501'; end if;
  select * into d from public.ep_sav_demandes where id = p_demande for update;
  if d.id is null then raise exception 'Demande introuvable'; end if;
  if d.decision is null then raise exception 'Prenez d’abord une décision sur cette demande'; end if;
  if d.decision = 'garantie_refusee' then raise exception 'Une demande refusée ne peut pas être résolue par une prise en charge'; end if;
  if d.statut in ('resolue', 'cloturee') then raise exception 'Cette demande est déjà résolue'; end if;
  if p_resolution = 'avoir' and (coalesce(trim(p_avoir_reference), '') = '' or p_avoir_montant is null or p_avoir_montant <= 0) then
    raise exception 'Saisissez la référence et le montant de l’avoir émis dans Navision';
  end if;
  if p_resolution = 'retour_produit' and coalesce(trim(p_bon_retour), '') = '' then
    raise exception 'Saisissez le numéro du bon de retour';
  end if;

  update public.ep_sav_demandes set
    resolution = p_resolution, statut = 'resolue', resolu_le = now(),
    avoir_reference = case when p_resolution = 'avoir' then trim(p_avoir_reference) end,
    avoir_montant = case when p_resolution = 'avoir' then p_avoir_montant end,
    bon_retour = case when p_resolution = 'retour_produit' then trim(p_bon_retour) else bon_retour end
  where id = p_demande returning * into d;

  v_texte := case p_resolution
    when 'piece_envoyee' then 'La pièce vous a été expédiée.'
    when 'retour_produit' then 'Un bon de retour a été émis : ' || trim(p_bon_retour) || '.'
    when 'remplacement' then 'Le produit est remplacé.'
    else 'Un avoir de ' || replace(to_char(p_avoir_montant, 'FM999999990.00'), '.', ',') || ' € a été émis (référence ' || trim(p_avoir_reference) || ').'
  end || coalesce(' ' || nullif(trim(p_commentaire), ''), '');
  insert into public.ep_sav_messages (demande_id, auteur, auteur_nom, auteur_role, contenu, interne)
  values (p_demande, auth.uid(), public.ep_sav_nom_appelant(), public.ep_sav_role(), v_texte, false);
  perform public.ep_sav_journaliser(p_demande, 'resolution', 'resolue', jsonb_build_object('resolution', p_resolution));
  return d;
end $$;

create function public.ep_sav_qualifier(p_demande uuid, p_non_conformite boolean, p_cause text default null, p_action text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(public.ep_sav_role() in ('admin', 'sav', 'qualite'), false) is false then
    raise exception 'Réservé à la qualité et au service SAV' using errcode = '42501';
  end if;
  if not exists (select 1 from public.ep_sav_demandes where id = p_demande) then raise exception 'Demande introuvable'; end if;
  if p_non_conformite and coalesce(trim(p_cause), '') = '' then raise exception 'Indiquez la cause de la non-conformité'; end if;
  update public.ep_sav_demandes set
    non_conformite = p_non_conformite,
    cause = case when p_non_conformite then trim(p_cause) end,
    action_corrective = case when p_non_conformite then nullif(trim(p_action), '') end,
    qualifie_le = now()
  where id = p_demande;
  perform public.ep_sav_journaliser(p_demande, 'qualification', null, jsonb_build_object('non_conformite', p_non_conformite));
end $$;

-- Personnes pouvant traiter une demande (pour l'affectation)
create function public.ep_sav_intervenants() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when not public.ep_sav_peut_traiter() then '[]'::jsonb else coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'nom', trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), 'role', p.role::text) order by p.role, p.nom)
    from public.ep_profils p where p.actif and p.role::text in ('admin', 'sav', 'bureau_etudes', 'qualite')
  ), '[]'::jsonb) end
$$;

-- Indicateurs, calculés sur ce que l'appelant a le droit de voir
create function public.ep_sav_stats() returns jsonb
language sql stable security invoker set search_path = '' as $$
  with d as (select * from public.ep_sav_demandes)
  select jsonb_build_object(
    'total', (select count(*) from d),
    'ouvertes', (select count(*) from d where statut not in ('resolue', 'cloturee')),
    'nouvelles', (select count(*) from d where statut = 'nouvelle'),
    'infos_demandees', (select count(*) from d where statut = 'infos_demandees'),
    'avis_technique', (select count(*) from d where statut = 'avis_technique'),
    'non_affectees', (select count(*) from d where affecte_a is null and statut not in ('resolue', 'cloturee')),
    'delai_resolution_jours', (select round(extract(epoch from avg(resolu_le - cree_le)) / 86400, 1) from d where resolu_le is not null),
    'taux_garantie_pct', (select round(100.0 * count(*) filter (where decision = 'garantie_acceptee') / nullif(count(*) filter (where decision is not null), 0)) from d),
    'non_conformites', (select count(*) from d where non_conformite),
    'par_type', (select coalesce(jsonb_object_agg(type, n), '{}') from (select type, count(*) n from d group by type) x),
    'par_statut', (select coalesce(jsonb_object_agg(statut, n), '{}') from (select statut, count(*) n from d group by statut) x),
    'nc_par_gamme', (select coalesce(jsonb_object_agg(g, n), '{}') from (select coalesce(gamme, 'Non précisée') g, count(*) n from d where non_conformite group by 1) x),
    'nc_par_cause', (select coalesce(jsonb_object_agg(c, n), '{}') from (select cause c, count(*) n from d where non_conformite and cause is not null group by 1) x)
  )
$$;

-- ── Droits d'exécution ──────────────────────────────────────────────
revoke execute on function
  public.ep_sav_role(), public.ep_sav_est_client(), public.ep_sav_peut_traiter(), public.ep_sav_peut_voir(uuid),
  public.ep_sav_dossier_autorise(text, boolean), public.ep_sav_nom_appelant(),
  public.ep_sav_journaliser(uuid, text, public.ep_sav_statut, jsonb),
  public.ep_sav_declarer(public.ep_sav_type, text, uuid, text, text, text, text, text, text),
  public.ep_sav_ajouter_fichier(uuid, text, text, text, bigint),
  public.ep_sav_ajouter_message(uuid, text, boolean),
  public.ep_sav_changer_statut(uuid, public.ep_sav_statut, text),
  public.ep_sav_affecter(uuid, uuid),
  public.ep_sav_decider(uuid, public.ep_sav_decision, text),
  public.ep_sav_resoudre(uuid, public.ep_sav_resolution, text, text, numeric, text),
  public.ep_sav_qualifier(uuid, boolean, text, text),
  public.ep_sav_intervenants(), public.ep_sav_stats()
from public, anon;

-- Fonctions internes : jamais appelables directement
revoke execute on function public.ep_sav_journaliser(uuid, text, public.ep_sav_statut, jsonb), public.ep_sav_nom_appelant() from authenticated;

grant execute on function
  public.ep_sav_role(), public.ep_sav_est_client(), public.ep_sav_peut_traiter(), public.ep_sav_peut_voir(uuid),
  public.ep_sav_dossier_autorise(text, boolean),
  public.ep_sav_declarer(public.ep_sav_type, text, uuid, text, text, text, text, text, text),
  public.ep_sav_ajouter_fichier(uuid, text, text, text, bigint),
  public.ep_sav_ajouter_message(uuid, text, boolean),
  public.ep_sav_changer_statut(uuid, public.ep_sav_statut, text),
  public.ep_sav_affecter(uuid, uuid),
  public.ep_sav_decider(uuid, public.ep_sav_decision, text),
  public.ep_sav_resoudre(uuid, public.ep_sav_resolution, text, text, numeric, text),
  public.ep_sav_qualifier(uuid, boolean, text, text),
  public.ep_sav_intervenants(), public.ep_sav_stats()
to authenticated;
