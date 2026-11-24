-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : demandes d'accès déposées depuis la page de connexion.
-- Dépôt possible sans être connecté, via une fonction contrôlée
-- (champs validés, limite de dépôts par adresse). Lecture réservée à l'admin.
-- ════════════════════════════════════════════════════════════════════

create table public.ep_demandes_acces (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  email text not null check (email = lower(email) and email like '%_@_%._%'),
  telephone text,
  entreprise text,
  profil text not null check (profil in ('iap', 'serrurier', 'fenetrier', 'interne', 'autre')),
  message text,
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'invitee', 'refusee')),
  cree_le timestamptz not null default now(),
  traitee_le timestamptz,
  traitee_par uuid references auth.users (id) on delete set null
);
alter table public.ep_demandes_acces enable row level security;
revoke all on public.ep_demandes_acces from anon, authenticated;

create function public.ep_demander_acces(
  p_prenom text, p_nom text, p_email text, p_telephone text, p_entreprise text, p_profil text, p_message text
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(p_email));
begin
  if coalesce(trim(p_prenom), '') = '' or coalesce(trim(p_nom), '') = '' then raise exception 'Indiquez votre prénom et votre nom'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Adresse e-mail invalide'; end if;
  if length(coalesce(p_message, '')) > 1000 or length(p_prenom) > 80 or length(p_nom) > 80 or length(coalesce(p_entreprise, '')) > 160 then
    raise exception 'Un des champs est trop long';
  end if;
  if (select count(*) from public.ep_demandes_acces where email = v_email and cree_le > now() - interval '1 day') >= 3 then
    raise exception 'Une demande est déjà en cours pour cette adresse';
  end if;
  insert into public.ep_demandes_acces (prenom, nom, email, telephone, entreprise, profil, message)
  values (trim(p_prenom), trim(p_nom), v_email, nullif(trim(p_telephone), ''), nullif(trim(p_entreprise), ''),
          coalesce(nullif(p_profil, ''), 'autre'), nullif(trim(p_message), ''));
end $$;

create function public.ep_admin_demandes_acces()
returns setof public.ep_demandes_acces
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  return query select * from public.ep_demandes_acces where statut = 'nouvelle' order by cree_le desc;
end $$;

create function public.ep_admin_traiter_demande(p_id uuid, p_statut text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_statut not in ('invitee', 'refusee') then raise exception 'Statut non autorisé'; end if;
  update public.ep_demandes_acces set statut = p_statut, traitee_le = now(), traitee_par = auth.uid() where id = p_id;
end $$;

revoke execute on function
  public.ep_demander_acces(text, text, text, text, text, text, text),
  public.ep_admin_demandes_acces(), public.ep_admin_traiter_demande(uuid, text)
from public;
grant execute on function public.ep_demander_acces(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.ep_admin_demandes_acces(), public.ep_admin_traiter_demande(uuid, text) to authenticated;
revoke execute on function public.ep_admin_demandes_acces(), public.ep_admin_traiter_demande(uuid, text) from anon;
