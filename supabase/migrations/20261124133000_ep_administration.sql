-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : administration des utilisateurs
-- Réservé au rôle admin. Lecture des e-mails de auth.users via une
-- fonction contrôlée (jamais d'accès direct à auth.users).
-- ════════════════════════════════════════════════════════════════════

create table public.ep_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and email like '%@%'),
  role public.ep_role not null,
  prenom text,
  nom text,
  compte_id uuid references public.ep_comptes (id) on delete set null,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  invite_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now(),
  utilisee_le timestamptz,
  constraint ep_invitations_client_a_un_compte
    check (role not in ('client_gerant', 'client_equipe') or compte_id is not null)
);
alter table public.ep_invitations enable row level security;
revoke all on public.ep_invitations from anon, authenticated;
comment on table public.ep_invitations is 'Espace Pro : invitations en attente (profil créé à la création du compte)';

-- ep_est_admin() est déjà créée par la migration ep_mediatheque.

-- Liste des comptes (avec ou sans profil Espace Pro)
create function public.ep_admin_utilisateurs()
returns table (
  id uuid, email text, derniere_connexion timestamptz, cree_le timestamptz,
  role public.ep_role, prenom text, nom text, actif boolean,
  compte_id uuid, compte_nom text, commercial_id uuid, commercial_nom text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  return query
    select u.id, u.email::text, u.last_sign_in_at, u.created_at,
           p.role, p.prenom, p.nom, p.actif,
           p.compte_id, c.raison_sociale, p.commercial_id,
           case when m.id is null then null else m.prenom || ' ' || m.nom end
      from auth.users u
      left join public.ep_profils p on p.id = u.id
      left join public.ep_comptes c on c.id = p.compte_id
      left join public.commerciaux m on m.id = p.commercial_id
     order by p.role nulls last, u.email;
end $$;

-- Créer ou modifier le profil d'un compte existant
create function public.ep_admin_definir_profil(
  p_utilisateur uuid, p_role public.ep_role, p_prenom text default null, p_nom text default null,
  p_compte uuid default null, p_commercial uuid default null, p_actif boolean default true
) returns public.ep_profils
language plpgsql security definer set search_path = '' as $$
declare r public.ep_profils;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_utilisateur = auth.uid() and (p_role <> 'admin' or not p_actif) then
    raise exception 'Vous ne pouvez pas retirer vos propres droits d’administrateur';
  end if;
  if p_role in ('client_gerant', 'client_equipe') and p_compte is null then
    raise exception 'Un client doit être rattaché à un compte';
  end if;
  if p_role = 'atc' and p_commercial is null then
    raise exception 'Un commercial doit être rattaché à sa fiche commerciale';
  end if;
  insert into public.ep_profils (id, role, prenom, nom, compte_id, commercial_id, actif)
  values (p_utilisateur, p_role, p_prenom, p_nom,
          case when p_role in ('client_gerant', 'client_equipe') then p_compte end,
          case when p_role = 'atc' then p_commercial end, p_actif)
  on conflict (id) do update set
    role = excluded.role, prenom = excluded.prenom, nom = excluded.nom,
    compte_id = excluded.compte_id, commercial_id = excluded.commercial_id, actif = excluded.actif
  returning * into r;
  return r;
end $$;

-- Invitations
create function public.ep_admin_inviter(
  p_email text, p_role public.ep_role, p_prenom text default null, p_nom text default null,
  p_compte uuid default null, p_commercial uuid default null
) returns public.ep_invitations
language plpgsql security definer set search_path = '' as $$
declare r public.ep_invitations; v_email text := lower(trim(p_email));
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Un compte existe déjà pour cette adresse : attribuez-lui un rôle dans la liste';
  end if;
  if p_role in ('client_gerant', 'client_equipe') and p_compte is null then raise exception 'Un client doit être rattaché à un compte'; end if;
  if p_role = 'atc' and p_commercial is null then raise exception 'Un commercial doit être rattaché à sa fiche commerciale'; end if;
  insert into public.ep_invitations (email, role, prenom, nom, compte_id, commercial_id, invite_par)
  values (v_email, p_role, p_prenom, p_nom, p_compte, p_commercial, auth.uid())
  on conflict (email) do update set role = excluded.role, prenom = excluded.prenom, nom = excluded.nom,
    compte_id = excluded.compte_id, commercial_id = excluded.commercial_id, invite_par = excluded.invite_par, cree_le = now()
  returning * into r;
  return r;
end $$;

create function public.ep_admin_invitations()
returns setof public.ep_invitations
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  return query select * from public.ep_invitations where utilisee_le is null order by cree_le desc;
end $$;

create function public.ep_admin_annuler_invitation(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  delete from public.ep_invitations where id = p_id and utilisee_le is null;
end $$;

-- À la création d'un compte, son invitation devient son profil.
create function public.ep_profil_depuis_invitation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare i public.ep_invitations;
begin
  select * into i from public.ep_invitations where email = lower(new.email) and utilisee_le is null;
  if i.id is not null then
    insert into public.ep_profils (id, role, prenom, nom, compte_id, commercial_id)
    values (new.id, i.role, i.prenom, i.nom, i.compte_id, i.commercial_id)
    on conflict (id) do nothing;
    update public.ep_invitations set utilisee_le = now() where id = i.id;
  end if;
  return new;
end $$;

create trigger ep_profil_depuis_invitation after insert on auth.users
for each row execute function public.ep_profil_depuis_invitation();

-- Listes pour les formulaires
create function public.ep_admin_commerciaux()
returns table (id uuid, nom text, equipe text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  return query select c.id, c.prenom || ' ' || c.nom, c.equipe from public.commerciaux c where c.actif order by c.nom;
end $$;

revoke execute on function
  public.ep_admin_utilisateurs(),
  public.ep_admin_definir_profil(uuid, public.ep_role, text, text, uuid, uuid, boolean),
  public.ep_admin_inviter(text, public.ep_role, text, text, uuid, uuid),
  public.ep_admin_invitations(), public.ep_admin_annuler_invitation(uuid),
  public.ep_profil_depuis_invitation(), public.ep_admin_commerciaux()
from public, anon;
revoke execute on function public.ep_profil_depuis_invitation() from authenticated;
grant execute on function
  public.ep_admin_utilisateurs(),
  public.ep_admin_definir_profil(uuid, public.ep_role, text, text, uuid, uuid, boolean),
  public.ep_admin_inviter(text, public.ep_role, text, text, uuid, uuid),
  public.ep_admin_invitations(), public.ep_admin_annuler_invitation(uuid), public.ep_admin_commerciaux()
to authenticated;
