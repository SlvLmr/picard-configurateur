-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : boutique (catalogue, commandes, enveloppes commerciales)
-- Paiement en points, par carte (simulé pour l'instant), mixte,
-- ou sur l'enveloppe annuelle d'un commercial pour ses clients.
-- Écritures : uniquement via ep_commander (contrôle du rôle et du solde).
-- ════════════════════════════════════════════════════════════════════

create type public.ep_mode_paiement as enum ('points', 'cb', 'mixte', 'enveloppe');
create type public.ep_commande_statut as enum ('a_valider', 'paiement_en_attente', 'validee', 'expediee', 'livree', 'annulee');

create table public.ep_produits (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  nom text not null,
  description text,
  categorie text not null check (categorie in ('Goodies', 'Tenues', 'PLV', 'Outillage')),
  prix_points integer not null check (prix_points > 0),
  prix_euros numeric(10, 2) not null check (prix_euros > 0),
  stock integer not null default 0 check (stock >= 0),
  variantes jsonb not null default '[]'::jsonb,
  visuel text,
  actif boolean not null default true,
  ordre integer not null default 0,
  cree_le timestamptz not null default now()
);
comment on table public.ep_produits is 'Espace Pro : catalogue de la boutique (goodies, tenues, PLV, outillage)';

create table public.ep_enveloppes (
  id uuid primary key default gen_random_uuid(),
  commercial_id uuid not null references public.commerciaux (id) on delete cascade,
  annee integer not null,
  montant numeric(10, 2) not null check (montant >= 0),
  unique (commercial_id, annee)
);
comment on table public.ep_enveloppes is 'Espace Pro : budget annuel d’un commercial pour commander pour ses clients';

create sequence public.ep_commandes_numero_seq start 1000;

create table public.ep_commandes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('C-' || nextval('public.ep_commandes_numero_seq')),
  cree_le timestamptz not null default now(),
  cree_par uuid references auth.users (id) on delete set null,
  compte_id uuid references public.ep_comptes (id) on delete set null,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  mode public.ep_mode_paiement not null,
  statut public.ep_commande_statut not null,
  total_euros numeric(10, 2) not null,
  total_points integer not null,
  points_utilises integer not null default 0,
  montant_cb numeric(10, 2) not null default 0,
  montant_enveloppe numeric(10, 2) not null default 0
);
create index ep_commandes_compte_idx on public.ep_commandes (compte_id);
create index ep_commandes_commercial_idx on public.ep_commandes (commercial_id);

create table public.ep_commande_lignes (
  id bigint generated always as identity primary key,
  commande_id uuid not null references public.ep_commandes (id) on delete cascade,
  produit_id uuid not null references public.ep_produits (id),
  variante text,
  quantite integer not null check (quantite > 0),
  prix_euros_unitaire numeric(10, 2) not null,
  prix_points_unitaire integer not null
);
create index ep_commande_lignes_commande_idx on public.ep_commande_lignes (commande_id);

-- ── Lecture ─────────────────────────────────────────────────────────
alter table public.ep_produits enable row level security;
alter table public.ep_enveloppes enable row level security;
alter table public.ep_commandes enable row level security;
alter table public.ep_commande_lignes enable row level security;

create policy ep_produits_lecture on public.ep_produits for select to authenticated using (
  actif or public.ep_est_interne()
);
create policy ep_enveloppes_lecture on public.ep_enveloppes for select to authenticated using (
  public.ep_est_interne() or commercial_id = public.ep_mon_commercial()
);
create policy ep_commandes_lecture on public.ep_commandes for select to authenticated using (
  public.ep_est_interne()
  or compte_id = public.ep_mon_compte()
  or commercial_id = public.ep_mon_commercial()
  or cree_par = auth.uid()
);
create policy ep_commande_lignes_lecture on public.ep_commande_lignes for select to authenticated using (
  exists (select 1 from public.ep_commandes c where c.id = commande_id)
);

-- ── Solde de points (avec les droits de l'appelant) ─────────────────
create function public.ep_solde_points(p_compte uuid default null) returns integer
language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(points), 0)::integer from public.ep_points
  where compte_id = coalesce(p_compte, public.ep_mon_compte())
$$;

-- ── Commander ───────────────────────────────────────────────────────
-- p_lignes : [{ "produit_id": uuid, "variante": text|null, "quantite": int }]
-- Client gérant : p_points = points utilisés (le reste est payé par carte).
-- Commercial : commande sur son enveloppe, p_compte = client bénéficiaire.
create function public.ep_commander(p_lignes jsonb, p_points integer default null, p_compte uuid default null)
returns public.ep_commandes
language plpgsql security definer set search_path = '' as $$
declare
  moi public.ep_profils := public.ep_profil_courant();
  c public.ep_commandes;
  l jsonb;
  p public.ep_produits;
  q integer;
  v_total_euros numeric(10, 2) := 0;
  v_total_points integer := 0;
  v_points integer;
  v_solde integer;
  v_cb numeric(10, 2);
  v_dispo numeric(10, 2);
begin
  if moi.role is null then raise exception 'Profil Espace Pro introuvable' using errcode = '42501'; end if;
  if p_lignes is null or jsonb_array_length(p_lignes) = 0 then raise exception 'Le panier est vide'; end if;

  -- Totaux et contrôle du stock
  for l in select * from jsonb_array_elements(p_lignes) loop
    q := coalesce((l ->> 'quantite')::integer, 0);
    if q <= 0 then raise exception 'Quantité invalide'; end if;
    select * into p from public.ep_produits where id = (l ->> 'produit_id')::uuid and actif for update;
    if p.id is null then raise exception 'Produit indisponible'; end if;
    if p.stock < q then raise exception 'Stock insuffisant pour « % » (% disponibles)', p.nom, p.stock; end if;
    v_total_euros := v_total_euros + p.prix_euros * q;
    v_total_points := v_total_points + p.prix_points * q;
  end loop;

  if moi.role = 'client_gerant' then
    v_points := greatest(0, least(coalesce(p_points, v_total_points), v_total_points));
    select coalesce(sum(points), 0) into v_solde from public.ep_points where compte_id = moi.compte_id;
    if v_points > v_solde then
      raise exception 'Solde insuffisant : % points disponibles, % demandés', v_solde, v_points;
    end if;
    v_cb := round(v_total_euros * (1 - v_points::numeric / v_total_points), 2);
    insert into public.ep_commandes (cree_par, compte_id, mode, statut, total_euros, total_points, points_utilises, montant_cb)
    values (
      auth.uid(), moi.compte_id,
      (case when v_cb = 0 then 'points' when v_points = 0 then 'cb' else 'mixte' end)::public.ep_mode_paiement,
      (case when v_cb > 0 then 'paiement_en_attente' else 'validee' end)::public.ep_commande_statut,
      v_total_euros, v_total_points, v_points, v_cb
    ) returning * into c;
    if v_points > 0 then
      insert into public.ep_points (compte_id, points, motif) values (moi.compte_id, -v_points, 'Commande ' || c.reference);
    end if;

  elsif moi.role = 'atc' then
    if moi.commercial_id is null then raise exception 'Aucun commercial rattaché à ce profil'; end if;
    if p_compte is not null and not exists (
      select 1 from public.ep_comptes where id = p_compte and commercial_id = moi.commercial_id
    ) then
      raise exception 'Ce client ne fait pas partie de votre portefeuille';
    end if;
    select e.montant - coalesce((
      select sum(montant_enveloppe) from public.ep_commandes
      where commercial_id = moi.commercial_id and mode = 'enveloppe' and statut <> 'annulee'
        and extract(year from cree_le) = extract(year from now())
    ), 0) into v_dispo
    from public.ep_enveloppes e
    where e.commercial_id = moi.commercial_id and e.annee = extract(year from now())::integer;
    if v_dispo is null then raise exception 'Aucune enveloppe ouverte pour cette année'; end if;
    if v_total_euros > v_dispo then
      raise exception 'Enveloppe insuffisante : % € disponibles, % € demandés', v_dispo, v_total_euros;
    end if;
    insert into public.ep_commandes (cree_par, compte_id, commercial_id, mode, statut, total_euros, total_points, montant_enveloppe)
    values (
      auth.uid(), p_compte, moi.commercial_id, 'enveloppe',
      -- au-delà de 300 €, validation par le chef de marché
      (case when v_total_euros > 300 then 'a_valider' else 'validee' end)::public.ep_commande_statut,
      v_total_euros, v_total_points, v_total_euros
    ) returning * into c;

  else
    raise exception 'La boutique est réservée aux gérants clients et aux commerciaux' using errcode = '42501';
  end if;

  -- Lignes et décrément du stock
  for l in select * from jsonb_array_elements(p_lignes) loop
    q := (l ->> 'quantite')::integer;
    update public.ep_produits set stock = stock - q where id = (l ->> 'produit_id')::uuid returning * into p;
    insert into public.ep_commande_lignes (commande_id, produit_id, variante, quantite, prix_euros_unitaire, prix_points_unitaire)
    values (c.id, p.id, nullif(l ->> 'variante', ''), q, p.prix_euros, p.prix_points);
  end loop;

  return c;
end $$;

revoke execute on function public.ep_solde_points(uuid), public.ep_commander(jsonb, integer, uuid) from public, anon;
grant execute on function public.ep_solde_points(uuid), public.ep_commander(jsonb, integer, uuid) to authenticated;
revoke all on public.ep_produits, public.ep_enveloppes, public.ep_commandes, public.ep_commande_lignes from anon;

-- ── Données initiales ───────────────────────────────────────────────
insert into public.ep_produits (reference, nom, description, categorie, prix_points, prix_euros, stock, variantes, visuel, ordre) values
  ('G-MUG', 'Mug isotherme', 'Inox double paroi, 40 cl, logo gravé.', 'Goodies', 250, 12.50, 120, '[]', 'coffee', 10),
  ('G-CASQ', 'Casquette brodée', 'Coton épais, réglable, logo brodé.', 'Goodies', 300, 15.00, 80, '[]', 'hard-hat', 20),
  ('G-PORTE-CLES', 'Porte-clés métal', 'Lot de 50 porte-clés pour vos clients.', 'Goodies', 600, 30.00, 40, '[]', 'key-round', 30),
  ('G-CARNET', 'Carnet de chantier', 'Lot de 10 carnets A5 à couverture rigide.', 'Goodies', 400, 20.00, 60, '[]', 'notebook-pen', 40),
  ('T-POLO', 'Polo technicien', 'Piqué coton, logo poitrine et dos.', 'Tenues', 450, 22.50, 150, '["S","M","L","XL","XXL"]', 'shirt', 10),
  ('T-SOFTSHELL', 'Veste softshell', 'Coupe-vent déperlante, logo brodé.', 'Tenues', 1900, 95.00, 45, '["S","M","L","XL","XXL"]', 'shirt', 20),
  ('T-PANTALON', 'Pantalon de travail', 'Poches genouillères, renforts.', 'Tenues', 1200, 60.00, 50, '["38","40","42","44","46","48"]', 'ruler', 30),
  ('P-KAKEMONO', 'Kakémono roll-up', '85 × 200 cm, personnalisé à votre nom.', 'PLV', 2400, 120.00, 25, '[]', 'flag', 10),
  ('P-PRESENTOIR', 'Présentoir showroom', 'Présentoir de porte blindée, échantillons inclus.', 'PLV', 6500, 325.00, 8, '[]', 'door-open', 20),
  ('P-VITRINE', 'Adhésif vitrine', 'Installateur agréé, 60 × 40 cm.', 'PLV', 350, 17.50, 200, '[]', 'sticker', 30),
  ('O-COFFRET', 'Coffret outils de pose', 'Gabarits, forets et clés de réglage.', 'Outillage', 3200, 160.00, 20, '[]', 'wrench', 10),
  ('O-TABLETTE', 'Tablette de démonstration', 'Tablette 11 pouces avec le configurateur.', 'Outillage', 9800, 490.00, 6, '[]', 'tablet', 20);

insert into public.ep_enveloppes (commercial_id, annee, montant)
select id, extract(year from now())::integer, 3000 from public.commerciaux where actif
on conflict (commercial_id, annee) do nothing;
