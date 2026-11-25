-- Newsletters : rédaction par blocs, envoi par e-mail via la file ep_notifications (Brevo)
alter table public.ep_notifications add column if not exists html text;

create table if not exists public.ep_newsletters (
  id uuid primary key default gen_random_uuid(),
  objet text not null default '' check (char_length(objet) <= 200),
  preheader text not null default '' check (char_length(preheader) <= 200),
  blocs jsonb not null default '[]',
  html text,
  cible text not null default 'clients',
  roles public.ep_role[] not null default '{}',
  niveaux public.ep_niveau_iap[] not null default '{}',
  statut text not null default 'brouillon' check (statut in ('brouillon', 'envoyee')),
  nb_destinataires integer,
  envoyee_le timestamptz,
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
alter table public.ep_newsletters enable row level security;
create policy ep_newsletters_lecture on public.ep_newsletters for select to authenticated using (public.ep_est_interne());
revoke insert, update, delete on public.ep_newsletters from anon, authenticated;

-- Destinataires : profils actifs du public visé (rôles, niveaux IAP), avec une adresse e-mail
create or replace function public.ep_newsletter_destinataires(p_roles public.ep_role[], p_niveaux public.ep_niveau_iap[])
returns table (email text, nom text)
language sql stable security definer set search_path = '' as $$
  select distinct on (lower(u.email)) u.email::text, nullif(trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), '')
  from public.ep_profils p
  join auth.users u on u.id = p.id
  left join public.ep_comptes c on c.id = p.compte_id
  where p.actif and u.email is not null
    and (cardinality(p_roles) = 0 or p.role = any (p_roles))
    and (cardinality(p_niveaux) = 0 or c.niveau_iap = any (p_niveaux))
  order by lower(u.email)
$$;
revoke all on function public.ep_newsletter_destinataires(public.ep_role[], public.ep_niveau_iap[]) from public, anon, authenticated;

create or replace function public.ep_admin_compter_destinataires(p_roles public.ep_role[], p_niveaux public.ep_niveau_iap[]) returns integer
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  return (select count(*) from public.ep_newsletter_destinataires(p_roles, p_niveaux));
end $$;
revoke all on function public.ep_admin_compter_destinataires(public.ep_role[], public.ep_niveau_iap[]) from public, anon;
grant execute on function public.ep_admin_compter_destinataires(public.ep_role[], public.ep_niveau_iap[]) to authenticated;

create or replace function public.ep_admin_enregistrer_newsletter(
  p_id uuid, p_objet text, p_preheader text, p_blocs jsonb, p_html text, p_cible text, p_roles public.ep_role[], p_niveaux public.ep_niveau_iap[]
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_id is null then
    insert into public.ep_newsletters (objet, preheader, blocs, html, cible, roles, niveaux, cree_par)
    values (coalesce(trim(p_objet), ''), coalesce(trim(p_preheader), ''), coalesce(p_blocs, '[]'), p_html, p_cible, coalesce(p_roles, '{}'), coalesce(p_niveaux, '{}'), auth.uid())
    returning id into v_id;
  else
    update public.ep_newsletters set objet = coalesce(trim(p_objet), ''), preheader = coalesce(trim(p_preheader), ''), blocs = coalesce(p_blocs, '[]'),
      html = p_html, cible = p_cible, roles = coalesce(p_roles, '{}'), niveaux = coalesce(p_niveaux, '{}'), maj_le = now()
    where id = p_id and statut = 'brouillon' returning id into v_id;
    if v_id is null then raise exception 'Une newsletter envoyée ne peut plus être modifiée'; end if;
  end if;
  return v_id;
end $$;
revoke all on function public.ep_admin_enregistrer_newsletter(uuid, text, text, jsonb, text, text, public.ep_role[], public.ep_niveau_iap[]) from public, anon;
grant execute on function public.ep_admin_enregistrer_newsletter(uuid, text, text, jsonb, text, text, public.ep_role[], public.ep_niveau_iap[]) to authenticated;

-- Envoi : un e-mail par destinataire dans la file ; p_test envoie seulement à l'administrateur
create or replace function public.ep_admin_envoyer_newsletter(p_id uuid, p_test boolean default false) returns integer
language plpgsql security definer set search_path = '' as $$
declare n public.ep_newsletters; v_nb integer;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  select * into n from public.ep_newsletters where id = p_id;
  if n.id is null then raise exception 'Newsletter introuvable'; end if;
  if coalesce(trim(n.objet), '') = '' or n.html is null then raise exception 'Renseignez l’objet et le contenu avant l’envoi'; end if;
  if p_test then
    insert into public.ep_notifications (canal, destinataire, destinataire_nom, sujet, contenu, html, motif)
    select 'email', u.email, null, '[Test] ' || n.objet, n.preheader, n.html, 'newsletter_test' from auth.users u where u.id = auth.uid();
    return 1;
  end if;
  if n.statut = 'envoyee' then raise exception 'Cette newsletter a déjà été envoyée'; end if;
  insert into public.ep_notifications (canal, destinataire, destinataire_nom, sujet, contenu, html, motif)
  select 'email', d.email, d.nom, n.objet, n.preheader, n.html, 'newsletter' from public.ep_newsletter_destinataires(n.roles, n.niveaux) d;
  get diagnostics v_nb = row_count;
  update public.ep_newsletters set statut = 'envoyee', envoyee_le = now(), nb_destinataires = v_nb where id = p_id;
  return v_nb;
end $$;
revoke all on function public.ep_admin_envoyer_newsletter(uuid, boolean) from public, anon;
grant execute on function public.ep_admin_envoyer_newsletter(uuid, boolean) to authenticated;

create or replace function public.ep_admin_supprimer_newsletter(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  delete from public.ep_newsletters where id = p_id and statut = 'brouillon';
end $$;
revoke all on function public.ep_admin_supprimer_newsletter(uuid) from public, anon;
grant execute on function public.ep_admin_supprimer_newsletter(uuid) to authenticated;

-- Rubrique Newsletters : administrateur (rédaction) ; direction et marketing en consultation
insert into public.ep_droits (module, role, autorise, niveaux)
select 'newsletters', r::public.ep_role, r in ('admin', 'codir', 'chef_marche'), '{}'
from unnest(array['admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe', 'sav', 'bureau_etudes', 'qualite']) as r
on conflict (module, role) do nothing;
