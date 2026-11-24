-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : Pilotage campagne
-- Une campagne = une liste d'étapes (appel, e-mail, information, visite,
-- relance, présentation, commande) à mener chez des comptes ciblés.
-- Chaque commercial suit ses clients ; la direction suit l'avancement
-- commercial par commercial et zone par zone.
-- Inspiré de la campagne « Boost » de l'outil Commerce (non modifiée).
-- ════════════════════════════════════════════════════════════════════

create table public.ep_campagnes (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  objectif text,
  description text,
  debut date not null default current_date,
  fin date,
  -- [{ "code": "e1", "type": "appel", "libelle": "Appel de présentation" }, ...] dans l'ordre
  etapes jsonb not null,
  cible_niveaux public.ep_niveau_iap[] not null default '{}',
  cible_types public.ep_type_compte[] not null default '{}',
  cible_zones text[] not null default '{}',
  statut text not null default 'active' check (statut in ('brouillon', 'active', 'terminee')),
  demo boolean not null default false,
  cree_par uuid references auth.users (id) on delete set null,
  cree_le timestamptz not null default now(),
  constraint ep_campagnes_dates check (fin is null or fin >= debut),
  constraint ep_campagnes_etapes check (jsonb_typeof(etapes) = 'array' and jsonb_array_length(etapes) between 1 and 12)
);
comment on table public.ep_campagnes is 'Espace Pro : campagnes d’actions commerciales';

create table public.ep_campagne_cibles (
  id uuid primary key default gen_random_uuid(),
  campagne_id uuid not null references public.ep_campagnes (id) on delete cascade,
  compte_id uuid not null references public.ep_comptes (id) on delete cascade,
  commercial_id uuid references public.commerciaux (id) on delete set null,
  rappel date,
  unique (campagne_id, compte_id)
);
create index ep_campagne_cibles_commercial_idx on public.ep_campagne_cibles (campagne_id, commercial_id);

create table public.ep_campagne_actions (
  id uuid primary key default gen_random_uuid(),
  cible_id uuid not null references public.ep_campagne_cibles (id) on delete cascade,
  etape text not null,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'fait', 'sans_objet')),
  fait_le timestamptz,
  commentaire text,
  resultat text,
  montant numeric(12, 2) check (montant is null or montant >= 0),
  fait_par uuid references auth.users (id) on delete set null,
  maj_le timestamptz not null default now(),
  unique (cible_id, etape)
);
create index ep_campagne_actions_cible_idx on public.ep_campagne_actions (cible_id);

-- ── Lecture : direction et chefs tout, commercial son portefeuille, clients rien ──
alter table public.ep_campagnes enable row level security;
alter table public.ep_campagne_cibles enable row level security;
alter table public.ep_campagne_actions enable row level security;
revoke all on public.ep_campagnes, public.ep_campagne_cibles, public.ep_campagne_actions from anon;
revoke insert, update, delete on public.ep_campagnes, public.ep_campagne_cibles, public.ep_campagne_actions from authenticated;

create policy ep_campagnes_lecture on public.ep_campagnes for select to authenticated using (
  public.ep_crm_vue_complete()
  or (statut <> 'brouillon' and exists (
    select 1 from public.ep_campagne_cibles c where c.campagne_id = ep_campagnes.id and c.commercial_id = public.ep_mon_commercial()
  ))
);

create policy ep_campagne_cibles_lecture on public.ep_campagne_cibles for select to authenticated using (
  public.ep_crm_vue_complete() or commercial_id = public.ep_mon_commercial()
);

create policy ep_campagne_actions_lecture on public.ep_campagne_actions for select to authenticated using (
  exists (select 1 from public.ep_campagne_cibles c where c.id = cible_id)
);

-- ── Outils internes ─────────────────────────────────────────────────
-- Vérifie et normalise la liste d'étapes (types autorisés, codes uniques, libellés).
create function public.ep_campagne_normaliser_etapes(p_etapes jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare e jsonb; res jsonb := '[]'::jsonb; i int := 0; v_type text; v_libelle text;
begin
  if p_etapes is null or jsonb_typeof(p_etapes) <> 'array' or jsonb_array_length(p_etapes) = 0 then
    raise exception 'Choisissez au moins une étape';
  end if;
  for e in select * from jsonb_array_elements(p_etapes) loop
    i := i + 1;
    v_type := e ->> 'type';
    if v_type not in ('appel', 'email', 'information', 'visite', 'relance', 'presentation', 'commande') then
      raise exception 'Type d’étape inconnu : %', v_type;
    end if;
    v_libelle := nullif(trim(coalesce(e ->> 'libelle', '')), '');
    res := res || jsonb_build_array(jsonb_build_object('code', 'e' || i, 'type', v_type, 'libelle', coalesce(v_libelle, initcap(v_type))));
  end loop;
  if i > 12 then raise exception 'Douze étapes au plus'; end if;
  return res;
end $$;

-- Comptes correspondant à un ciblage (niveaux IAP, types de comptes, zones = équipe du commercial).
create function public.ep_campagne_comptes_cibles(p_niveaux public.ep_niveau_iap[], p_types public.ep_type_compte[], p_zones text[])
returns table (compte_id uuid, commercial_id uuid)
language sql stable security definer set search_path = '' as $$
  select c.id, c.commercial_id
  from public.ep_comptes c
  left join public.commerciaux m on m.id = c.commercial_id
  where c.actif
    and (cardinality(coalesce(p_niveaux, '{}')) = 0 or c.niveau_iap = any (p_niveaux))
    and (cardinality(coalesce(p_types, '{}')) = 0 or c.type = any (p_types))
    and (cardinality(coalesce(p_zones, '{}')) = 0 or m.equipe = any (p_zones))
$$;

-- ── Écritures (RPC) ─────────────────────────────────────────────────
create function public.ep_apercu_ciblage(p_niveaux public.ep_niveau_iap[] default '{}', p_types public.ep_type_compte[] default '{}', p_zones text[] default '{}')
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ep_crm_vue_complete() then raise exception 'Réservé à la direction et aux chefs' using errcode = '42501'; end if;
  return (
    select jsonb_build_object('comptes', count(*), 'commerciaux', count(distinct commercial_id))
    from public.ep_campagne_comptes_cibles(p_niveaux, p_types, p_zones)
  );
end $$;

create function public.ep_campagne_zones() returns text[]
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ep_crm_vue_complete() then return '{}'; end if;
  return (select coalesce(array_agg(distinct equipe order by equipe), '{}') from public.commerciaux where actif and equipe is not null and equipe <> '');
end $$;

create function public.ep_creer_campagne(
  p_titre text, p_etapes jsonb, p_objectif text default null, p_description text default null,
  p_debut date default current_date, p_fin date default null,
  p_niveaux public.ep_niveau_iap[] default '{}', p_types public.ep_type_compte[] default '{}', p_zones text[] default '{}',
  p_activer boolean default true
) returns public.ep_campagnes
language plpgsql security definer set search_path = '' as $$
declare r public.ep_campagnes; v_etapes jsonb;
begin
  if not public.ep_crm_vue_complete() then raise exception 'Réservé à la direction et aux chefs' using errcode = '42501'; end if;
  if coalesce(trim(p_titre), '') = '' then raise exception 'Le titre est obligatoire'; end if;
  v_etapes := public.ep_campagne_normaliser_etapes(p_etapes);

  insert into public.ep_campagnes (titre, objectif, description, debut, fin, etapes, cible_niveaux, cible_types, cible_zones, statut, cree_par)
  values (trim(p_titre), nullif(trim(p_objectif), ''), nullif(trim(p_description), ''), coalesce(p_debut, current_date), p_fin, v_etapes,
          coalesce(p_niveaux, '{}'), coalesce(p_types, '{}'), coalesce(p_zones, '{}'),
          case when p_activer then 'active' else 'brouillon' end, auth.uid())
  returning * into r;

  insert into public.ep_campagne_cibles (campagne_id, compte_id, commercial_id)
  select r.id, t.compte_id, t.commercial_id from public.ep_campagne_comptes_cibles(r.cible_niveaux, r.cible_types, r.cible_zones) t;

  if not exists (select 1 from public.ep_campagne_cibles where campagne_id = r.id) then
    raise exception 'Aucun compte ne correspond à ce ciblage';
  end if;

  insert into public.ep_campagne_actions (cible_id, etape)
  select c.id, e ->> 'code' from public.ep_campagne_cibles c cross join jsonb_array_elements(v_etapes) e where c.campagne_id = r.id;

  return r;
end $$;

create function public.ep_changer_statut_campagne(p_campagne uuid, p_statut text) returns public.ep_campagnes
language plpgsql security definer set search_path = '' as $$
declare r public.ep_campagnes;
begin
  if not public.ep_crm_vue_complete() then raise exception 'Réservé à la direction et aux chefs' using errcode = '42501'; end if;
  if p_statut not in ('brouillon', 'active', 'terminee') then raise exception 'Statut inconnu'; end if;
  update public.ep_campagnes set statut = p_statut where id = p_campagne returning * into r;
  if r.id is null then raise exception 'Campagne introuvable'; end if;
  return r;
end $$;

-- Met à jour une étape chez un client. Commercial : uniquement son portefeuille.
create function public.ep_maj_action_campagne(
  p_cible uuid, p_etape text, p_statut text, p_commentaire text default null, p_montant numeric default null, p_resultat text default null
) returns public.ep_campagne_actions
language plpgsql security definer set search_path = '' as $$
declare c public.ep_campagne_cibles; v_statut text; r public.ep_campagne_actions;
begin
  select * into c from public.ep_campagne_cibles where id = p_cible;
  if c.id is null then raise exception 'Client introuvable dans cette campagne'; end if;
  if not (public.ep_crm_vue_complete() or (c.commercial_id is not null and c.commercial_id = public.ep_mon_commercial())) then
    raise exception 'Ce client n’est pas dans votre portefeuille' using errcode = '42501';
  end if;
  select statut into v_statut from public.ep_campagnes where id = c.campagne_id;
  if v_statut <> 'active' then raise exception 'La campagne n’est pas active'; end if;
  if p_statut not in ('a_faire', 'fait', 'sans_objet') then raise exception 'Statut inconnu'; end if;

  update public.ep_campagne_actions
     set statut = p_statut,
         fait_le = case when p_statut = 'a_faire' then null else coalesce(fait_le, now()) end,
         commentaire = coalesce(nullif(trim(p_commentaire), ''), commentaire),
         resultat = coalesce(nullif(trim(p_resultat), ''), resultat),
         montant = coalesce(p_montant, montant),
         fait_par = case when p_statut = 'a_faire' then null else auth.uid() end,
         maj_le = now()
   where cible_id = p_cible and etape = p_etape
  returning * into r;
  if r.id is null then raise exception 'Étape introuvable'; end if;
  return r;
end $$;

create function public.ep_planifier_rappel_campagne(p_cible uuid, p_date date) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.ep_campagne_cibles;
begin
  select * into c from public.ep_campagne_cibles where id = p_cible;
  if c.id is null then raise exception 'Client introuvable dans cette campagne'; end if;
  if not (public.ep_crm_vue_complete() or (c.commercial_id is not null and c.commercial_id = public.ep_mon_commercial())) then
    raise exception 'Ce client n’est pas dans votre portefeuille' using errcode = '42501';
  end if;
  update public.ep_campagne_cibles set rappel = p_date where id = p_cible;
end $$;

-- ── Synthèses ───────────────────────────────────────────────────────
-- Avancement d'une campagne : par commercial, par zone, par étape.
-- Direction et chefs : tout. Commercial : ses seuls clients. Autres : vide.
create function public.ep_campagne_avancement(p_campagne uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_complet boolean := public.ep_crm_vue_complete(); v_moi uuid := public.ep_mon_commercial(); v_etapes jsonb;
begin
  if not v_complet and v_moi is null then return null; end if;
  select etapes into v_etapes from public.ep_campagnes where id = p_campagne and (v_complet or statut <> 'brouillon');
  if v_etapes is null then return null; end if;

  return (
    with c as (
      select c.* from public.ep_campagne_cibles c
      where c.campagne_id = p_campagne and (v_complet or c.commercial_id = v_moi)
    ),
    a as (
      select a.*, c.commercial_id, c.compte_id from public.ep_campagne_actions a join c on c.id = a.cible_id
    ),
    par_cible as (
      select c.id, c.commercial_id,
             count(a.id) filter (where a.statut = 'a_faire') as restantes
      from c left join public.ep_campagne_actions a on a.cible_id = c.id
      group by c.id, c.commercial_id
    ),
    par_atc as (
      select pc.commercial_id,
             count(*) as clients,
             count(*) filter (where pc.restantes = 0) as clients_termines,
             (select count(*) from a where a.commercial_id is not distinct from pc.commercial_id) as actions,
             (select count(*) from a where a.commercial_id is not distinct from pc.commercial_id and a.statut = 'fait') as faites,
             (select count(*) from a where a.commercial_id is not distinct from pc.commercial_id and a.statut = 'sans_objet') as sans_objet,
             (select coalesce(sum(a.montant), 0) from a where a.commercial_id is not distinct from pc.commercial_id) as montant,
             (select max(a.fait_le) from a where a.commercial_id is not distinct from pc.commercial_id) as derniere_action
      from par_cible pc group by pc.commercial_id
    )
    select jsonb_build_object(
      'clients', (select count(*) from c),
      'clients_termines', (select count(*) from par_cible where restantes = 0),
      'actions', (select count(*) from a),
      'faites', (select count(*) from a where statut = 'fait'),
      'sans_objet', (select count(*) from a where statut = 'sans_objet'),
      'montant', (select coalesce(sum(montant), 0) from a),
      'rappels_depasses', (select count(*) from c where rappel < current_date),
      'par_etape', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'code', e ->> 'code', 'type', e ->> 'type', 'libelle', e ->> 'libelle',
          'faites', (select count(*) from a where a.etape = e ->> 'code' and a.statut = 'fait'),
          'sans_objet', (select count(*) from a where a.etape = e ->> 'code' and a.statut = 'sans_objet'),
          'total', (select count(*) from a where a.etape = e ->> 'code')
        ) order by o), '[]'::jsonb)
        from jsonb_array_elements(v_etapes) with ordinality as t(e, o)
      ),
      'par_atc', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'commercial_id', p.commercial_id,
          'nom', coalesce(m.prenom || ' ' || m.nom, 'Sans commercial'),
          'zone', coalesce(nullif(m.equipe, ''), 'Sans zone'),
          'clients', p.clients, 'clients_termines', p.clients_termines,
          'actions', p.actions, 'faites', p.faites, 'sans_objet', p.sans_objet,
          'montant', p.montant, 'derniere_action', p.derniere_action
        ) order by m.nom nulls last), '[]'::jsonb)
        from par_atc p left join public.commerciaux m on m.id = p.commercial_id
      ),
      'par_zone', (
        select coalesce(jsonb_agg(z order by z ->> 'zone'), '[]'::jsonb) from (
          select jsonb_build_object(
            'zone', coalesce(nullif(m.equipe, ''), 'Sans zone'),
            'commerciaux', count(distinct p.commercial_id),
            'clients', sum(p.clients), 'clients_termines', sum(p.clients_termines),
            'actions', sum(p.actions), 'faites', sum(p.faites), 'sans_objet', sum(p.sans_objet),
            'montant', sum(p.montant)
          ) as z
          from par_atc p left join public.commerciaux m on m.id = p.commercial_id
          group by coalesce(nullif(m.equipe, ''), 'Sans zone')
        ) zz
      )
    )
  );
end $$;

-- Liste des campagnes visibles, avec l'avancement dans le périmètre de l'appelant.
create function public.ep_campagnes_resume() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', k.id, 'titre', k.titre, 'objectif', k.objectif, 'debut', k.debut, 'fin', k.fin, 'statut', k.statut,
    'etapes', jsonb_array_length(k.etapes), 'demo', k.demo,
    'clients', (select count(*) from public.ep_campagne_cibles c where c.campagne_id = k.id),
    'actions', (select count(*) from public.ep_campagne_actions a join public.ep_campagne_cibles c on c.id = a.cible_id where c.campagne_id = k.id),
    'faites', (select count(*) from public.ep_campagne_actions a join public.ep_campagne_cibles c on c.id = a.cible_id where c.campagne_id = k.id and a.statut <> 'a_faire')
  ) order by (k.statut = 'active') desc, k.debut desc), '[]'::jsonb)
  from public.ep_campagnes k
$$;

-- ── Droits d'exécution ──────────────────────────────────────────────
revoke execute on function
  public.ep_campagne_normaliser_etapes(jsonb),
  public.ep_campagne_comptes_cibles(public.ep_niveau_iap[], public.ep_type_compte[], text[]),
  public.ep_apercu_ciblage(public.ep_niveau_iap[], public.ep_type_compte[], text[]),
  public.ep_campagne_zones(),
  public.ep_creer_campagne(text, jsonb, text, text, date, date, public.ep_niveau_iap[], public.ep_type_compte[], text[], boolean),
  public.ep_changer_statut_campagne(uuid, text),
  public.ep_maj_action_campagne(uuid, text, text, text, numeric, text),
  public.ep_planifier_rappel_campagne(uuid, date),
  public.ep_campagne_avancement(uuid),
  public.ep_campagnes_resume()
from public, anon;
revoke execute on function
  public.ep_campagne_normaliser_etapes(jsonb),
  public.ep_campagne_comptes_cibles(public.ep_niveau_iap[], public.ep_type_compte[], text[])
from authenticated;
grant execute on function
  public.ep_apercu_ciblage(public.ep_niveau_iap[], public.ep_type_compte[], text[]),
  public.ep_campagne_zones(),
  public.ep_creer_campagne(text, jsonb, text, text, date, date, public.ep_niveau_iap[], public.ep_type_compte[], text[], boolean),
  public.ep_changer_statut_campagne(uuid, text),
  public.ep_maj_action_campagne(uuid, text, text, text, numeric, text),
  public.ep_planifier_rappel_campagne(uuid, date),
  public.ep_campagne_avancement(uuid),
  public.ep_campagnes_resume()
to authenticated;

-- ── Démonstration : campagne inspirée de « Boost » (supprimable : delete from ep_campagnes where demo) ──
do $$
declare v_id uuid; v_etapes jsonb;
begin
  v_etapes := public.ep_campagne_normaliser_etapes(
    '[{"type":"appel","libelle":"Appel de présentation"},{"type":"email","libelle":"Envoi de l’offre"},{"type":"presentation","libelle":"Présentation de la gamme"},{"type":"commande","libelle":"Commande"},{"type":"relance","libelle":"Relance"}]'::jsonb);
  insert into public.ep_campagnes (titre, objectif, description, debut, fin, etapes, cible_niveaux, statut, demo)
  values ('Boost IAP fin d’année', 'Faire passer une commande à chaque IAP avant le 31 décembre',
          'Appeler chaque IAP, lui envoyer l’offre, présenter la gamme, prendre la commande, relancer si besoin.',
          current_date - 30, current_date + 37, v_etapes, '{}', 'active', true)
  returning id into v_id;

  insert into public.ep_campagne_cibles (campagne_id, compte_id, commercial_id, rappel)
  select v_id, c.id, c.commercial_id, case when random() < 0.15 then current_date + (random() * 20 - 8)::int end
  from public.ep_comptes c where c.actif and c.type = 'IAP';

  -- Avancement simulé : les premières étapes sont plus souvent faites que les suivantes
  insert into public.ep_campagne_actions (cible_id, etape, statut, fait_le, montant, commentaire)
  select c.id, e ->> 'code',
         case
           when x.r < greatest(0.05, 0.75 - (o - 1) * 0.17) then 'fait'
           when x.r > 0.95 then 'sans_objet'
           else 'a_faire'
         end,
         case when x.r < greatest(0.05, 0.75 - (o - 1) * 0.17) then now() - make_interval(days => (random() * 28)::int, hours => (random() * 9)::int) end,
         case when e ->> 'type' = 'commande' and x.r < greatest(0.05, 0.75 - (o - 1) * 0.17) then round((300 + random() * 2700)::numeric, 2) end,
         case when o = 1 and x.r < 0.2 then 'Intéressé, rappeler après les congés' end
  from public.ep_campagne_cibles c
  cross join jsonb_array_elements(v_etapes) with ordinality as t(e, o)
  cross join lateral (select random() as r) x
  where c.campagne_id = v_id;

end $$;

