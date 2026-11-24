-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : médiathèque organisée par gamme et par produit
-- Gamme > produits > téléchargements (doc commerciale, doc technique,
-- vidéos, photos). Une ressource sans produit reste un document général
-- de sa gamme, ou de toutes les gammes.
-- ════════════════════════════════════════════════════════════════════

create table public.ep_gammes (
  code text primary key,
  nom text not null,
  description text,
  ordre integer not null default 0
);
insert into public.ep_gammes (code, nom, description, ordre) values
  ('palieres', 'Portes blindées palières', 'Portes d’appartement blindées et certifiées A2P', 1),
  ('pavillonnaires', 'Portes blindées pavillonnaires', 'Portes d’entrée de maison, sécurité et isolation', 2),
  ('techniques', 'Portes techniques', 'Locaux techniques, coupe-feu, acoustiques', 3),
  ('hall', 'Portes de hall', 'Halls d’immeuble et parties communes', 4);

create table public.ep_media_produits (
  id uuid primary key default gen_random_uuid(),
  gamme_code text not null references public.ep_gammes (code) on update cascade,
  nom text not null,
  description text,
  marque text not null default 'picard' check (marque in ('picard', 'eliot', 'commune')),
  ordre integer not null default 0,
  actif boolean not null default true,
  demo boolean not null default false,
  cree_le timestamptz not null default now(),
  unique (gamme_code, nom)
);

alter table public.ep_ressources
  add column produit_id uuid references public.ep_media_produits (id) on delete set null,
  add column gamme_code text references public.ep_gammes (code) on update cascade;
create index ep_ressources_produit_idx on public.ep_ressources (produit_id) where actif;

alter table public.ep_gammes enable row level security;
alter table public.ep_media_produits enable row level security;
revoke all on public.ep_gammes, public.ep_media_produits from anon;
revoke insert, update, delete on public.ep_gammes, public.ep_media_produits from authenticated;
create policy ep_gammes_lecture on public.ep_gammes for select to authenticated using (true);
create policy ep_media_produits_lecture on public.ep_media_produits for select to authenticated using (actif or public.ep_est_admin());

-- Produits de démonstration (à remplacer par le catalogue réel dans l'administration)
insert into public.ep_media_produits (gamme_code, nom, description, ordre, demo) values
  ('palieres', 'Altitude', 'Bloc-porte palier A2P BP3, haute isolation acoustique', 1, true),
  ('palieres', 'Quartz', 'Porte palière premium, finitions sur mesure', 2, true),
  ('pavillonnaires', 'Horizon', 'Porte d’entrée pavillonnaire A2P BP2', 1, true),
  ('techniques', 'Tek 77', 'Porte technique pour locaux et gaines', 1, true),
  ('hall', 'Hall 80', 'Porte de hall vitrée, contrôle d’accès intégrable', 1, true);

-- Rattachement des ressources de démonstration existantes
update public.ep_ressources r set produit_id = p.id, gamme_code = p.gamme_code
  from public.ep_media_produits p where p.demo and r.gamme = p.nom;

-- ── Administration ──────────────────────────────────────────────────
create function public.ep_admin_enregistrer_produit(
  p_id uuid, p_gamme text, p_nom text, p_description text default null, p_marque text default 'picard', p_actif boolean default true
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_nom), '') = '' then raise exception 'Le nom du produit est obligatoire'; end if;
  if not exists (select 1 from public.ep_gammes where code = p_gamme) then raise exception 'Gamme inconnue'; end if;
  if p_id is null then
    insert into public.ep_media_produits (gamme_code, nom, description, marque, actif, ordre)
    values (p_gamme, trim(p_nom), nullif(trim(p_description), ''), coalesce(p_marque, 'picard'), p_actif,
            coalesce((select max(ordre) + 1 from public.ep_media_produits where gamme_code = p_gamme), 1))
    returning id into v_id;
  else
    update public.ep_media_produits set gamme_code = p_gamme, nom = trim(p_nom), description = nullif(trim(p_description), ''),
      marque = coalesce(p_marque, 'picard'), actif = p_actif, demo = false
    where id = p_id returning id into v_id;
    update public.ep_ressources set gamme_code = p_gamme where produit_id = p_id;
  end if;
  return v_id;
end $$;

create function public.ep_rattacher_ressource(p_ressource uuid, p_produit uuid, p_gamme text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  update public.ep_ressources set
    produit_id = p_produit,
    gamme_code = coalesce((select gamme_code from public.ep_media_produits where id = p_produit), nullif(p_gamme, ''))
  where id = p_ressource;
end $$;

revoke execute on function public.ep_admin_enregistrer_produit(uuid, text, text, text, text, boolean), public.ep_rattacher_ressource(uuid, uuid, text) from public, anon;
grant execute on function public.ep_admin_enregistrer_produit(uuid, text, text, text, text, boolean), public.ep_rattacher_ressource(uuid, uuid, text) to authenticated;
