-- Questionnaires : création par l'administrateur, réponses dans l'Espace Pro, résultats agrégés
create table if not exists public.ep_questionnaires (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (char_length(titre) between 1 and 200),
  description text,
  questions jsonb not null default '[]',
  cible text not null default 'clients',
  roles public.ep_role[] not null default '{}',
  niveaux public.ep_niveau_iap[] not null default '{}',
  statut text not null default 'brouillon' check (statut in ('brouillon', 'ouvert', 'clos')),
  ouvert_le timestamptz,
  clos_le timestamptz,
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
create table if not exists public.ep_questionnaire_reponses (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.ep_questionnaires (id) on delete cascade,
  profil_id uuid not null references public.ep_profils (id) on delete cascade,
  reponses jsonb not null,
  cree_le timestamptz not null default now(),
  unique (questionnaire_id, profil_id)
);
create index if not exists ep_questionnaire_reponses_q_idx on public.ep_questionnaire_reponses (questionnaire_id);

-- Le questionnaire vise-t-il l'utilisateur courant (rôle et niveau IAP de son compte) ?
create or replace function public.ep_questionnaire_me_vise(p_roles public.ep_role[], p_niveaux public.ep_niveau_iap[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select (cardinality(p_roles) = 0 or p.role = any (p_roles))
       and (cardinality(p_niveaux) = 0 or exists (select 1 from public.ep_comptes c where c.id = p.compte_id and c.niveau_iap = any (p_niveaux)))
    from public.ep_profils p where p.id = auth.uid() and p.actif), false)
$$;

alter table public.ep_questionnaires enable row level security;
alter table public.ep_questionnaire_reponses enable row level security;
create policy ep_questionnaires_lecture on public.ep_questionnaires for select to authenticated
  using (public.ep_est_interne() or (statut <> 'brouillon' and public.ep_questionnaire_me_vise(roles, niveaux)));
create policy ep_questionnaire_reponses_lecture on public.ep_questionnaire_reponses for select to authenticated
  using (profil_id = auth.uid() or public.ep_est_interne());
revoke insert, update, delete on public.ep_questionnaires, public.ep_questionnaire_reponses from anon, authenticated;

create or replace function public.ep_admin_enregistrer_questionnaire(
  p_id uuid, p_titre text, p_description text, p_questions jsonb, p_cible text, p_roles public.ep_role[], p_niveaux public.ep_niveau_iap[]
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_titre), '') = '' then raise exception 'Le titre est obligatoire'; end if;
  if p_id is null then
    insert into public.ep_questionnaires (titre, description, questions, cible, roles, niveaux, cree_par)
    values (trim(p_titre), nullif(trim(p_description), ''), coalesce(p_questions, '[]'), p_cible, coalesce(p_roles, '{}'), coalesce(p_niveaux, '{}'), auth.uid())
    returning id into v_id;
  else
    if exists (select 1 from public.ep_questionnaire_reponses where questionnaire_id = p_id) then
      -- Avec des réponses, les questions restent figées : seuls le titre et la description changent
      update public.ep_questionnaires set titre = trim(p_titre), description = nullif(trim(p_description), ''), maj_le = now() where id = p_id returning id into v_id;
    else
      update public.ep_questionnaires set titre = trim(p_titre), description = nullif(trim(p_description), ''), questions = coalesce(p_questions, '[]'),
        cible = p_cible, roles = coalesce(p_roles, '{}'), niveaux = coalesce(p_niveaux, '{}'), maj_le = now()
      where id = p_id returning id into v_id;
    end if;
  end if;
  return v_id;
end $$;
revoke all on function public.ep_admin_enregistrer_questionnaire(uuid, text, text, jsonb, text, public.ep_role[], public.ep_niveau_iap[]) from public, anon;
grant execute on function public.ep_admin_enregistrer_questionnaire(uuid, text, text, jsonb, text, public.ep_role[], public.ep_niveau_iap[]) to authenticated;

create or replace function public.ep_admin_statut_questionnaire(p_id uuid, p_statut text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_statut not in ('brouillon', 'ouvert', 'clos') then raise exception 'Statut inconnu'; end if;
  if p_statut = 'ouvert' and jsonb_array_length((select questions from public.ep_questionnaires where id = p_id)) = 0 then
    raise exception 'Ajoutez au moins une question avant d’ouvrir le questionnaire';
  end if;
  update public.ep_questionnaires set statut = p_statut,
    ouvert_le = case when p_statut = 'ouvert' then coalesce(ouvert_le, now()) else ouvert_le end,
    clos_le = case when p_statut = 'clos' then now() else null end, maj_le = now()
  where id = p_id;
end $$;
revoke all on function public.ep_admin_statut_questionnaire(uuid, text) from public, anon;
grant execute on function public.ep_admin_statut_questionnaire(uuid, text) to authenticated;

create or replace function public.ep_admin_supprimer_questionnaire(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  delete from public.ep_questionnaires where id = p_id and statut = 'brouillon';
end $$;
revoke all on function public.ep_admin_supprimer_questionnaire(uuid) from public, anon;
grant execute on function public.ep_admin_supprimer_questionnaire(uuid) to authenticated;

-- Réponse d'un utilisateur : une seule par questionnaire, modifiable tant qu'il est ouvert
create or replace function public.ep_repondre_questionnaire(p_id uuid, p_reponses jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare q public.ep_questionnaires;
begin
  select * into q from public.ep_questionnaires where id = p_id;
  if q.id is null or q.statut <> 'ouvert' then raise exception 'Ce questionnaire n’est pas ouvert'; end if;
  if not public.ep_questionnaire_me_vise(q.roles, q.niveaux) then raise exception 'Ce questionnaire ne vous est pas destiné' using errcode = '42501'; end if;
  insert into public.ep_questionnaire_reponses (questionnaire_id, profil_id, reponses) values (p_id, auth.uid(), coalesce(p_reponses, '{}'))
  on conflict (questionnaire_id, profil_id) do update set reponses = excluded.reponses, cree_le = now();
end $$;
revoke all on function public.ep_repondre_questionnaire(uuid, jsonb) from public, anon;
grant execute on function public.ep_repondre_questionnaire(uuid, jsonb) to authenticated;

-- Rubrique ouverte à tous : on y répond ; l'administrateur crée, les équipes internes consultent les résultats
insert into public.ep_droits (module, role, autorise, niveaux)
select 'questionnaires', r::public.ep_role, true, '{}'
from unnest(array['admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe', 'sav', 'bureau_etudes', 'qualite']) as r
on conflict (module, role) do nothing;
