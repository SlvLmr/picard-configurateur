-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : activités commerciales du CRM
-- Visites, appels et comptes rendus ; actions de suivi ; plans d'action.
-- Lecture : commercial = son portefeuille ; admin, CODIR, chefs = tout ;
-- clients et autres rôles = rien. Écritures uniquement via fonctions.
-- ════════════════════════════════════════════════════════════════════

create table public.ep_plans_action (
  id uuid primary key default gen_random_uuid(),
  compte_id uuid not null references public.ep_comptes (id) on delete cascade,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  objectif text not null,
  type text not null default 'autre'
    check (type in ('passage_niveau', 'developpement_ca', 'recrutement_iap', 'fidelisation', 'autre')),
  echeance date,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'atteint', 'abandonne')),
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now(),
  demo boolean not null default false
);
create index ep_plans_action_compte_idx on public.ep_plans_action (compte_id);

create table public.ep_activites (
  id uuid primary key default gen_random_uuid(),
  compte_id uuid not null references public.ep_comptes (id) on delete cascade,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  type text not null check (type in ('visite', 'appel', 'email', 'formation', 'demo', 'salon')),
  date_prevue timestamptz,
  date_realisee timestamptz,
  objet text not null,
  compte_rendu text,
  prochaines_etapes text,
  statut text not null default 'planifiee' check (statut in ('planifiee', 'realisee', 'annulee')),
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now(),
  demo boolean not null default false,
  constraint ep_activites_date check (date_prevue is not null or date_realisee is not null)
);
create index ep_activites_compte_idx on public.ep_activites (compte_id, coalesce(date_realisee, date_prevue) desc);
create index ep_activites_commercial_idx on public.ep_activites (commercial_id, date_prevue);

create table public.ep_actions (
  id uuid primary key default gen_random_uuid(),
  compte_id uuid not null references public.ep_comptes (id) on delete cascade,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  titre text not null,
  echeance date,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'fait')),
  activite_id uuid references public.ep_activites (id) on delete set null,
  plan_id uuid references public.ep_plans_action (id) on delete set null,
  fait_le timestamptz,
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now(),
  demo boolean not null default false
);
create index ep_actions_compte_idx on public.ep_actions (compte_id);
create index ep_actions_commercial_idx on public.ep_actions (commercial_id, statut, echeance);

comment on table public.ep_activites is 'Espace Pro : visites, appels et comptes rendus des commerciaux';
comment on table public.ep_actions is 'Espace Pro : actions de suivi par compte';
comment on table public.ep_plans_action is 'Espace Pro : plans d''action par compte (objectif, échéance)';

-- ── Droits ──────────────────────────────────────────────────────────
-- Vue complète : admin, CODIR, chefs de service et de marché.
create function public.ep_crm_vue_complete() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('admin', 'codir', 'chef_service', 'chef_marche')
    from public.ep_profils where id = auth.uid() and actif), false)
$$;

-- Peut écrire sur ce compte : vue complète, ou commercial du compte.
create function public.ep_crm_peut_ecrire(p_compte uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.ep_crm_vue_complete()
      or exists (select 1 from public.ep_comptes c
                  where c.id = p_compte and c.commercial_id is not null
                    and c.commercial_id = public.ep_mon_commercial())
$$;

alter table public.ep_plans_action enable row level security;
alter table public.ep_activites enable row level security;
alter table public.ep_actions enable row level security;

create policy ep_plans_action_lecture on public.ep_plans_action for select to authenticated using (
  public.ep_crm_vue_complete()
  or commercial_id = public.ep_mon_commercial()
  or compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
);
create policy ep_activites_lecture on public.ep_activites for select to authenticated using (
  public.ep_crm_vue_complete()
  or commercial_id = public.ep_mon_commercial()
  or compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
);
create policy ep_actions_lecture on public.ep_actions for select to authenticated using (
  public.ep_crm_vue_complete()
  or commercial_id = public.ep_mon_commercial()
  or compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
);

revoke all on public.ep_plans_action, public.ep_activites, public.ep_actions from anon;
revoke insert, update, delete on public.ep_plans_action, public.ep_activites, public.ep_actions from authenticated;

-- Commercial à affecter : le commercial connecté, sinon celui du compte.
create function public.ep_crm_commercial_pour(p_compte uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select coalesce(public.ep_mon_commercial(), (select commercial_id from public.ep_comptes where id = p_compte))
$$;

-- ── Actions (RPC) ───────────────────────────────────────────────────
create function public.ep_planifier_activite(p_compte uuid, p_type text, p_date timestamptz, p_objet text)
returns public.ep_activites
language plpgsql security definer set search_path = '' as $$
declare r public.ep_activites;
begin
  if not public.ep_crm_peut_ecrire(p_compte) then
    raise exception 'Ce compte ne fait pas partie de votre portefeuille' using errcode = '42501';
  end if;
  if coalesce(trim(p_objet), '') = '' then raise exception 'Précisez l’objet de l’activité'; end if;
  if p_date is null then raise exception 'Choisissez une date'; end if;
  insert into public.ep_activites (compte_id, commercial_id, type, date_prevue, objet, statut, cree_par)
  values (p_compte, public.ep_crm_commercial_pour(p_compte), p_type, p_date, trim(p_objet), 'planifiee', auth.uid())
  returning * into r;
  return r;
end $$;

-- Compte rendu : clôt une activité planifiée, ou enregistre une activité déjà réalisée.
create function public.ep_realiser_activite(
  p_compte_rendu text,
  p_activite uuid default null,
  p_compte uuid default null,
  p_type text default 'visite',
  p_objet text default null,
  p_prochaines_etapes text default null,
  p_date timestamptz default null
) returns public.ep_activites
language plpgsql security definer set search_path = '' as $$
declare r public.ep_activites;
begin
  if coalesce(trim(p_compte_rendu), '') = '' then raise exception 'Le compte rendu est vide'; end if;

  if p_activite is not null then
    select * into r from public.ep_activites where id = p_activite for update;
    if r.id is null or not public.ep_crm_peut_ecrire(r.compte_id) then raise exception 'Activité introuvable'; end if;
    if r.statut = 'annulee' then raise exception 'Cette activité a été annulée'; end if;
    update public.ep_activites
       set statut = 'realisee', date_realisee = coalesce(p_date, now()),
           compte_rendu = trim(p_compte_rendu), prochaines_etapes = nullif(trim(coalesce(p_prochaines_etapes, '')), ''),
           objet = coalesce(nullif(trim(coalesce(p_objet, '')), ''), objet)
     where id = p_activite
    returning * into r;
    return r;
  end if;

  if p_compte is null or not public.ep_crm_peut_ecrire(p_compte) then
    raise exception 'Ce compte ne fait pas partie de votre portefeuille' using errcode = '42501';
  end if;
  insert into public.ep_activites (compte_id, commercial_id, type, date_realisee, objet, compte_rendu, prochaines_etapes, statut, cree_par)
  values (p_compte, public.ep_crm_commercial_pour(p_compte), p_type, coalesce(p_date, now()),
          coalesce(nullif(trim(coalesce(p_objet, '')), ''), 'Compte rendu'), trim(p_compte_rendu),
          nullif(trim(coalesce(p_prochaines_etapes, '')), ''), 'realisee', auth.uid())
  returning * into r;
  return r;
end $$;

create function public.ep_annuler_activite(p_activite uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_compte uuid;
begin
  select compte_id into v_compte from public.ep_activites where id = p_activite and statut = 'planifiee';
  if v_compte is null or not public.ep_crm_peut_ecrire(v_compte) then raise exception 'Activité introuvable'; end if;
  update public.ep_activites set statut = 'annulee' where id = p_activite;
end $$;

create function public.ep_creer_action(p_compte uuid, p_titre text, p_echeance date default null, p_activite uuid default null, p_plan uuid default null)
returns public.ep_actions
language plpgsql security definer set search_path = '' as $$
declare r public.ep_actions;
begin
  if not public.ep_crm_peut_ecrire(p_compte) then
    raise exception 'Ce compte ne fait pas partie de votre portefeuille' using errcode = '42501';
  end if;
  if coalesce(trim(p_titre), '') = '' then raise exception 'Décrivez l’action'; end if;
  insert into public.ep_actions (compte_id, commercial_id, titre, echeance, activite_id, plan_id, cree_par)
  values (p_compte, public.ep_crm_commercial_pour(p_compte), trim(p_titre), p_echeance, p_activite, p_plan, auth.uid())
  returning * into r;
  return r;
end $$;

create function public.ep_terminer_action(p_action uuid, p_fait boolean default true) returns public.ep_actions
language plpgsql security definer set search_path = '' as $$
declare r public.ep_actions;
begin
  select * into r from public.ep_actions where id = p_action for update;
  if r.id is null or not public.ep_crm_peut_ecrire(r.compte_id) then raise exception 'Action introuvable'; end if;
  update public.ep_actions
     set statut = case when p_fait then 'fait' else 'a_faire' end,
         fait_le = case when p_fait then now() end
   where id = p_action
  returning * into r;
  return r;
end $$;

create function public.ep_creer_plan(p_compte uuid, p_objectif text, p_type text default 'autre', p_echeance date default null)
returns public.ep_plans_action
language plpgsql security definer set search_path = '' as $$
declare r public.ep_plans_action;
begin
  if not public.ep_crm_peut_ecrire(p_compte) then
    raise exception 'Ce compte ne fait pas partie de votre portefeuille' using errcode = '42501';
  end if;
  if coalesce(trim(p_objectif), '') = '' then raise exception 'Précisez l’objectif du plan'; end if;
  insert into public.ep_plans_action (compte_id, commercial_id, objectif, type, echeance, cree_par)
  values (p_compte, public.ep_crm_commercial_pour(p_compte), trim(p_objectif), p_type, p_echeance, auth.uid())
  returning * into r;
  return r;
end $$;

create function public.ep_changer_statut_plan(p_plan uuid, p_statut text) returns public.ep_plans_action
language plpgsql security definer set search_path = '' as $$
declare r public.ep_plans_action;
begin
  if p_statut not in ('en_cours', 'atteint', 'abandonne') then raise exception 'Statut non autorisé'; end if;
  select * into r from public.ep_plans_action where id = p_plan for update;
  if r.id is null or not public.ep_crm_peut_ecrire(r.compte_id) then raise exception 'Plan introuvable'; end if;
  update public.ep_plans_action set statut = p_statut where id = p_plan returning * into r;
  return r;
end $$;

-- ── Droits d'exécution ──────────────────────────────────────────────
revoke execute on function
  public.ep_crm_vue_complete(), public.ep_crm_peut_ecrire(uuid), public.ep_crm_commercial_pour(uuid),
  public.ep_planifier_activite(uuid, text, timestamptz, text),
  public.ep_realiser_activite(text, uuid, uuid, text, text, text, timestamptz),
  public.ep_annuler_activite(uuid),
  public.ep_creer_action(uuid, text, date, uuid, uuid),
  public.ep_terminer_action(uuid, boolean),
  public.ep_creer_plan(uuid, text, text, date),
  public.ep_changer_statut_plan(uuid, text)
from public, anon;
revoke execute on function public.ep_crm_commercial_pour(uuid) from authenticated;
grant execute on function
  public.ep_crm_vue_complete(), public.ep_crm_peut_ecrire(uuid),
  public.ep_planifier_activite(uuid, text, timestamptz, text),
  public.ep_realiser_activite(text, uuid, uuid, text, text, text, timestamptz),
  public.ep_annuler_activite(uuid),
  public.ep_creer_action(uuid, text, date, uuid, uuid),
  public.ep_terminer_action(uuid, boolean),
  public.ep_creer_plan(uuid, text, text, date),
  public.ep_changer_statut_plan(uuid, text)
to authenticated;

-- ════════════════════════════════════════════════════════════════════
-- Données de démonstration (demo = true). Suppression :
--   delete from public.ep_actions where demo; delete from public.ep_activites where demo;
--   delete from public.ep_plans_action where demo;
-- Pour les 3 commerciaux qui ont le plus de comptes : visites passées,
-- visites de la semaine, actions (dont en retard) et plans d'action.
-- ════════════════════════════════════════════════════════════════════
do $$
declare
  com record;
  cpt record;
  i int := 0;
  v_activite uuid;
  v_plan uuid;
  objets text[] := array['Point trimestriel', 'Présentation de la gamme Altitude', 'Bilan des leads du mois',
    'Formation pose bloc-porte A2P BP3', 'Préparation du passage de niveau', 'Relance devis copropriété'];
  comptes_rendus text[] := array[
    E'Objet : point trimestriel.\nÉchanges : activité soutenue sur les portes palières, attente sur les délais Altitude.\nProchaines étapes : envoyer la notice v3 et proposer une démonstration en showroom.',
    E'Objet : présentation Altitude.\nÉchanges : intérêt pour la finition chêne clair, demande de tarifs pour 6 portes.\nProchaines étapes : chiffrage à envoyer sous huit jours.',
    E'Objet : bilan des leads.\nÉchanges : deux leads non acceptés dans les délais, le gérant était en congés.\nProchaines étapes : ajouter un second contact pour la réception des leads.'];
  actions text[] := array['Envoyer la notice de pose Altitude v3', 'Chiffrer 6 portes palières finition chêne clair',
    'Installer le présentoir showroom', 'Inscrire un technicien à la formation BP3', 'Ajouter un second contact pour les leads'];
begin
  for com in
    select c.commercial_id from public.ep_comptes c
     where c.commercial_id is not null and c.actif
     group by c.commercial_id order by count(*) desc limit 3
  loop
    i := 0;
    for cpt in
      select id, niveau_iap from public.ep_comptes
       where commercial_id = com.commercial_id and actif
       order by case niveau_iap when 'Elite' then 1 when 'Premium' then 2 else 3 end, raison_sociale
       limit 8
    loop
      i := i + 1;
      -- Visite passée avec compte rendu
      insert into public.ep_activites (compte_id, commercial_id, type, date_prevue, date_realisee, objet, compte_rendu, prochaines_etapes, statut, demo)
      values (cpt.id, com.commercial_id, case when i % 3 = 0 then 'appel' else 'visite' end,
              now() - make_interval(days => 10 + i * 9), now() - make_interval(days => 10 + i * 9),
              objets[1 + i % array_length(objets, 1)], comptes_rendus[1 + i % array_length(comptes_rendus, 1)],
              'Voir les actions ouvertes', 'realisee', true)
      returning id into v_activite;

      -- Visite de la semaine pour les 4 premiers comptes
      if i <= 4 then
        insert into public.ep_activites (compte_id, commercial_id, type, date_prevue, objet, statut, demo)
        values (cpt.id, com.commercial_id, 'visite',
                date_trunc('day', now()) + make_interval(days => (i - 1) % 3, hours => 9 + (i * 2) % 8, mins => 30),
                objets[1 + (i + 2) % array_length(objets, 1)], 'planifiee', true);
      end if;

      -- Actions : une ouverte par compte, en retard pour un sur trois, une terminée
      insert into public.ep_actions (compte_id, commercial_id, titre, echeance, statut, activite_id, demo)
      values (cpt.id, com.commercial_id, actions[1 + i % array_length(actions, 1)],
              (current_date + case when i % 3 = 0 then -4 - i else 3 + i end), 'a_faire', v_activite, true);
      insert into public.ep_actions (compte_id, commercial_id, titre, echeance, statut, fait_le, activite_id, demo)
      values (cpt.id, com.commercial_id, actions[1 + (i + 2) % array_length(actions, 1)],
              current_date - 12, 'fait', now() - interval '11 days', v_activite, true);

      -- Plan d'action pour les comptes Premium (passage Elite) et quelques autres
      if cpt.niveau_iap = 'Premium' or i % 4 = 1 then
        insert into public.ep_plans_action (compte_id, commercial_id, objectif, type, echeance, demo)
        values (cpt.id, com.commercial_id,
                case when cpt.niveau_iap = 'Premium' then 'Passer IAP Elite d’ici la fin du semestre'
                     else 'Développer le chiffre d’affaires portes blindées de 15 %' end,
                case when cpt.niveau_iap = 'Premium' then 'passage_niveau' else 'developpement_ca' end,
                (date_trunc('month', current_date) + interval '6 months')::date, true)
        returning id into v_plan;
        insert into public.ep_actions (compte_id, commercial_id, titre, echeance, statut, plan_id, demo)
        values (cpt.id, com.commercial_id, 'Faire le point sur le plan d’action', current_date + 21, 'a_faire', v_plan, true);
      end if;
    end loop;
  end loop;
end $$;

-- ── Objectif annuel d'un commercial (pour sa journée) ───────────────
-- Commercial : le sien. Vue complète : celui demandé, sinon la société.
create function public.ep_crm_objectif(p_annee integer default extract(year from now())::int, p_commercial uuid default null)
returns jsonb
language sql stable security definer set search_path = '' as $$
  with cible as (
    select case
      when public.ep_mon_commercial() is not null then public.ep_mon_commercial()
      when public.ep_crm_vue_complete() then p_commercial
    end as commercial_id,
    (public.ep_mon_commercial() is not null or public.ep_crm_vue_complete()) as autorise
  )
  select case when not (select autorise from cible) then null else (
    select jsonb_build_object(
      'annee', p_annee,
      'budget', coalesce(sum(m.budget), 0),
      'realise', coalesce(sum(m.realise), 0),
      'realise_n1', coalesce(sum(m.realise_n1), 0),
      'dernier_mois', max(m.mois) filter (where m.realise is not null and m.realise <> 0)
    )
    from public.atc_mois m, cible
    where m.annee = p_annee and (cible.commercial_id is null or m.commercial_id = cible.commercial_id)
  ) end
$$;
revoke execute on function public.ep_crm_objectif(integer, uuid) from public, anon;
grant execute on function public.ep_crm_objectif(integer, uuid) to authenticated;
