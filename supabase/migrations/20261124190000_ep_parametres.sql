-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : paramètres modifiables par l'administrateur,
-- et administration des commerciaux et des comptes clients.
-- Valeurs par défaut identiques aux valeurs en dur précédentes.
-- ════════════════════════════════════════════════════════════════════

create table public.ep_parametres (
  cle text primary key,
  valeur numeric not null,
  libelle text not null,
  aide text,
  unite text,
  groupe text not null,
  ordre integer not null default 0,
  maj_le timestamptz not null default now(),
  maj_par uuid references auth.users (id) on delete set null
);
alter table public.ep_parametres enable row level security;
revoke all on public.ep_parametres from anon;
revoke insert, update, delete on public.ep_parametres from authenticated;
create policy ep_parametres_lecture on public.ep_parametres for select to authenticated using (true);

insert into public.ep_parametres (cle, valeur, libelle, aide, unite, groupe, ordre) values
  ('delai_acceptation_heures', 24, 'Délai d’acceptation d’un lead', 'Au-delà, le lead peut être réattribué. S’applique aux leads reçus après la modification.', 'heures', 'Leads', 1),
  ('points_lead_accepte', 20, 'Points pour un lead accepté', null, 'points', 'Points de fidélité', 1),
  ('points_statut_renseigne', 10, 'Points pour un statut renseigné', 'Crédités une seule fois par statut et par lead.', 'points', 'Points de fidélité', 2),
  ('palier_points', 6500, 'Prochain palier affiché aux clients', 'Repère affiché sur l’accueil des clients.', 'points', 'Points de fidélité', 3),
  ('seuil_validation_commande', 300, 'Seuil de validation des commandes', 'Au-delà, une commande de la Boutique attend la validation d’un chef de marché ou de l’administrateur.', '€', 'Boutique', 1);

create function public.ep_parametre(p_cle text, p_defaut numeric) returns numeric
language sql stable security definer set search_path = '' as $$
  select coalesce((select valeur from public.ep_parametres where cle = p_cle), p_defaut)
$$;

create function public.ep_admin_maj_parametre(p_cle text, p_valeur numeric) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_valeur is null or p_valeur < 0 then raise exception 'La valeur doit être positive'; end if;
  update public.ep_parametres set valeur = p_valeur, maj_le = now(), maj_par = auth.uid() where cle = p_cle;
  if not found then raise exception 'Paramètre inconnu'; end if;
end $$;

-- Délai d'acceptation des nouveaux leads
create function public.ep_delai_acceptation() returns interval
language sql stable security definer set search_path = '' as $$
  select make_interval(hours => public.ep_parametre('delai_acceptation_heures', 24)::int)
$$;
alter table public.ep_leads alter column delai_acceptation set default public.ep_delai_acceptation();

-- Points et seuil : les fonctions existantes lisent désormais les paramètres
do $$
declare d text;
begin
  d := pg_get_functiondef('public.ep_accepter_lead(uuid)'::regprocedure);
  d := replace(d, 'values (v_compte, 20, ''Lead accepté''', 'values (v_compte, public.ep_parametre(''points_lead_accepte'', 20)::int, ''Lead accepté''');
  execute d;
  d := pg_get_functiondef('public.ep_changer_statut_lead(uuid, public.ep_lead_statut)'::regprocedure);
  d := replace(d, 'values (v_compte, 10, ''Statut renseigné''', 'values (v_compte, public.ep_parametre(''points_statut_renseigne'', 10)::int, ''Statut renseigné''');
  execute d;
  select pg_get_functiondef(p.oid) into d from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'ep_commander' limit 1;
  d := replace(d, 'v_total_euros > 300 then', 'v_total_euros > public.ep_parametre(''seuil_validation_commande'', 300) then');
  execute d;
end $$;

-- ── Commerciaux (table partagée avec l'outil Commerce : champs limités) ──
create function public.ep_admin_enregistrer_commercial(
  p_id uuid, p_prenom text, p_nom text, p_equipe text, p_fonction text default null,
  p_email text default null, p_telephone text default null, p_iap_objectif integer default null, p_actif boolean default true
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_nom), '') = '' or coalesce(trim(p_equipe), '') = '' then raise exception 'Le nom et la zone sont obligatoires'; end if;
  if p_id is null then
    insert into public.commerciaux (prenom, nom, equipe, fonction, email, telephone, iap_objectif, actif)
    values (coalesce(trim(p_prenom), ''), upper(trim(p_nom)), upper(trim(p_equipe)), nullif(trim(p_fonction), ''),
            nullif(trim(p_email), ''), nullif(trim(p_telephone), ''), coalesce(p_iap_objectif, 0), p_actif)
    returning id into v_id;
  else
    update public.commerciaux set
      prenom = coalesce(trim(p_prenom), prenom), nom = upper(trim(p_nom)), equipe = upper(trim(p_equipe)),
      fonction = nullif(trim(p_fonction), ''), email = nullif(trim(p_email), ''), telephone = nullif(trim(p_telephone), ''),
      iap_objectif = coalesce(p_iap_objectif, iap_objectif), actif = p_actif
    where id = p_id returning id into v_id;
    if v_id is null then raise exception 'Commercial introuvable'; end if;
  end if;
  return v_id;
end $$;

create function public.ep_admin_commerciaux_detail()
returns table (id uuid, prenom text, nom text, equipe text, fonction text, email text, telephone text,
               iap_objectif integer, actif boolean, comptes bigint, iap bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  return query
    select c.id, c.prenom, c.nom, c.equipe, c.fonction, c.email, c.telephone, c.iap_objectif, c.actif,
           (select count(*) from public.ep_comptes k where k.commercial_id = c.id and k.actif),
           (select count(*) from public.ep_comptes k where k.commercial_id = c.id and k.actif and k.niveau_iap is not null)
      from public.commerciaux c
     order by c.equipe, c.nom;
end $$;

-- ── Comptes clients ─────────────────────────────────────────────────
create function public.ep_admin_enregistrer_compte(
  p_id uuid, p_raison_sociale text, p_type public.ep_type_compte, p_niveau public.ep_niveau_iap,
  p_numero text, p_cp text, p_ville text, p_commercial uuid, p_actif boolean default true
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_raison_sociale), '') = '' then raise exception 'La raison sociale est obligatoire'; end if;
  if p_type <> 'IAP' and p_niveau is not null then raise exception 'Seuls les IAP ont un niveau'; end if;
  if p_id is null then
    insert into public.ep_comptes (raison_sociale, type, niveau_iap, numero_client, cp, ville, commercial_id, actif)
    values (trim(p_raison_sociale), p_type, p_niveau, nullif(trim(p_numero), ''), nullif(trim(p_cp), ''), nullif(trim(p_ville), ''), p_commercial, p_actif)
    returning id into v_id;
  else
    update public.ep_comptes set raison_sociale = trim(p_raison_sociale), type = p_type, niveau_iap = p_niveau,
      numero_client = nullif(trim(p_numero), ''), cp = nullif(trim(p_cp), ''), ville = nullif(trim(p_ville), ''),
      commercial_id = p_commercial, actif = p_actif
    where id = p_id returning id into v_id;
    if v_id is null then raise exception 'Compte introuvable'; end if;
  end if;
  return v_id;
end $$;

revoke execute on function
  public.ep_parametre(text, numeric), public.ep_admin_maj_parametre(text, numeric), public.ep_delai_acceptation(),
  public.ep_admin_enregistrer_commercial(uuid, text, text, text, text, text, text, integer, boolean),
  public.ep_admin_commerciaux_detail(),
  public.ep_admin_enregistrer_compte(uuid, text, public.ep_type_compte, public.ep_niveau_iap, text, text, text, uuid, boolean)
from public, anon;
grant execute on function
  public.ep_parametre(text, numeric), public.ep_admin_maj_parametre(text, numeric), public.ep_delai_acceptation(),
  public.ep_admin_enregistrer_commercial(uuid, text, text, text, text, text, text, integer, boolean),
  public.ep_admin_commerciaux_detail(),
  public.ep_admin_enregistrer_compte(uuid, text, public.ep_type_compte, public.ep_niveau_iap, text, text, text, uuid, boolean)
to authenticated;
