-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : rôles et droits d'accès aux rubriques, paramétrables
-- par l'administrateur. Pour les rôles clients, l'accès peut être
-- restreint à certains niveaux IAP (tableau vide = tous les clients).
-- Initialisé à l'identique des accès codés jusqu'ici.
-- ════════════════════════════════════════════════════════════════════

create table public.ep_droits (
  module text not null,
  role public.ep_role not null,
  autorise boolean not null default false,
  niveaux public.ep_niveau_iap[] not null default '{}',
  maj_le timestamptz not null default now(),
  maj_par uuid references auth.users (id) on delete set null,
  primary key (module, role)
);
alter table public.ep_droits enable row level security;
revoke all on public.ep_droits from anon;
revoke insert, update, delete on public.ep_droits from authenticated;
create policy ep_droits_lecture on public.ep_droits for select to authenticated using (true);

insert into public.ep_droits (module, role, autorise) values
  ('accueil', 'admin', true),
  ('accueil', 'codir', true),
  ('accueil', 'chef_service', true),
  ('accueil', 'chef_marche', true),
  ('accueil', 'atc', true),
  ('accueil', 'repartiteur', true),
  ('accueil', 'client_gerant', true),
  ('accueil', 'client_equipe', true),
  ('accueil', 'sav', true),
  ('accueil', 'bureau_etudes', true),
  ('accueil', 'qualite', true),
  ('leads', 'admin', true),
  ('leads', 'codir', true),
  ('leads', 'chef_service', true),
  ('leads', 'chef_marche', true),
  ('leads', 'atc', true),
  ('leads', 'repartiteur', true),
  ('leads', 'client_gerant', true),
  ('leads', 'client_equipe', true),
  ('leads', 'sav', false),
  ('leads', 'bureau_etudes', false),
  ('leads', 'qualite', false),
  ('crm', 'admin', true),
  ('crm', 'codir', true),
  ('crm', 'chef_service', true),
  ('crm', 'chef_marche', true),
  ('crm', 'atc', true),
  ('crm', 'repartiteur', false),
  ('crm', 'client_gerant', false),
  ('crm', 'client_equipe', false),
  ('crm', 'sav', true),
  ('crm', 'bureau_etudes', false),
  ('crm', 'qualite', false),
  ('pilotage', 'admin', true),
  ('pilotage', 'codir', true),
  ('pilotage', 'chef_service', true),
  ('pilotage', 'chef_marche', true),
  ('pilotage', 'atc', false),
  ('pilotage', 'repartiteur', false),
  ('pilotage', 'client_gerant', false),
  ('pilotage', 'client_equipe', false),
  ('pilotage', 'sav', false),
  ('pilotage', 'bureau_etudes', false),
  ('pilotage', 'qualite', true),
  ('configurateur', 'admin', true),
  ('configurateur', 'codir', false),
  ('configurateur', 'chef_service', false),
  ('configurateur', 'chef_marche', false),
  ('configurateur', 'atc', true),
  ('configurateur', 'repartiteur', false),
  ('configurateur', 'client_gerant', true),
  ('configurateur', 'client_equipe', true),
  ('configurateur', 'sav', false),
  ('configurateur', 'bureau_etudes', true),
  ('configurateur', 'qualite', false),
  ('mediatheque', 'admin', true),
  ('mediatheque', 'codir', true),
  ('mediatheque', 'chef_service', true),
  ('mediatheque', 'chef_marche', true),
  ('mediatheque', 'atc', true),
  ('mediatheque', 'repartiteur', true),
  ('mediatheque', 'client_gerant', true),
  ('mediatheque', 'client_equipe', true),
  ('mediatheque', 'sav', true),
  ('mediatheque', 'bureau_etudes', true),
  ('mediatheque', 'qualite', true),
  ('marketing', 'admin', true),
  ('marketing', 'codir', false),
  ('marketing', 'chef_service', false),
  ('marketing', 'chef_marche', true),
  ('marketing', 'atc', true),
  ('marketing', 'repartiteur', false),
  ('marketing', 'client_gerant', true),
  ('marketing', 'client_equipe', false),
  ('marketing', 'sav', false),
  ('marketing', 'bureau_etudes', false),
  ('marketing', 'qualite', false),
  ('boutique', 'admin', true),
  ('boutique', 'codir', true),
  ('boutique', 'chef_service', true),
  ('boutique', 'chef_marche', true),
  ('boutique', 'atc', true),
  ('boutique', 'repartiteur', false),
  ('boutique', 'client_gerant', true),
  ('boutique', 'client_equipe', false),
  ('boutique', 'sav', false),
  ('boutique', 'bureau_etudes', false),
  ('boutique', 'qualite', false),
  ('sav', 'admin', true),
  ('sav', 'codir', true),
  ('sav', 'chef_service', true),
  ('sav', 'chef_marche', true),
  ('sav', 'atc', true),
  ('sav', 'repartiteur', false),
  ('sav', 'client_gerant', true),
  ('sav', 'client_equipe', true),
  ('sav', 'sav', true),
  ('sav', 'bureau_etudes', true),
  ('sav', 'qualite', true),
  ('campagnes', 'admin', true),
  ('campagnes', 'codir', true),
  ('campagnes', 'chef_service', true),
  ('campagnes', 'chef_marche', true),
  ('campagnes', 'atc', true),
  ('campagnes', 'repartiteur', false),
  ('campagnes', 'client_gerant', false),
  ('campagnes', 'client_equipe', false),
  ('campagnes', 'sav', false),
  ('campagnes', 'bureau_etudes', false),
  ('campagnes', 'qualite', false),
  ('news', 'admin', true),
  ('news', 'codir', true),
  ('news', 'chef_service', true),
  ('news', 'chef_marche', true),
  ('news', 'atc', true),
  ('news', 'repartiteur', true),
  ('news', 'client_gerant', true),
  ('news', 'client_equipe', true),
  ('news', 'sav', true),
  ('news', 'bureau_etudes', true),
  ('news', 'qualite', true),
  ('calendrier', 'admin', true),
  ('calendrier', 'codir', true),
  ('calendrier', 'chef_service', true),
  ('calendrier', 'chef_marche', true),
  ('calendrier', 'atc', true),
  ('calendrier', 'repartiteur', true),
  ('calendrier', 'client_gerant', true),
  ('calendrier', 'client_equipe', true),
  ('calendrier', 'sav', true),
  ('calendrier', 'bureau_etudes', true),
  ('calendrier', 'qualite', true),
  ('administration', 'admin', true),
  ('administration', 'codir', false),
  ('administration', 'chef_service', false),
  ('administration', 'chef_marche', false),
  ('administration', 'atc', false),
  ('administration', 'repartiteur', false),
  ('administration', 'client_gerant', false),
  ('administration', 'client_equipe', false),
  ('administration', 'sav', false),
  ('administration', 'bureau_etudes', false),
  ('administration', 'qualite', false);

-- Rubriques accessibles à l'utilisateur connecté
create function public.ep_modules_autorises() returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(d.module order by d.module), '{}')
  from public.ep_profils p
  left join public.ep_comptes c on c.id = p.compte_id
  join public.ep_droits d on d.role = p.role
  where p.id = auth.uid() and p.actif
    and (p.role = 'admin' or d.autorise)
    and (p.role = 'admin' or cardinality(d.niveaux) = 0 or p.role not in ('client_gerant', 'client_equipe') or c.niveau_iap = any (d.niveaux))
$$;

create function public.ep_admin_maj_droit(p_module text, p_role public.ep_role, p_autorise boolean, p_niveaux public.ep_niveau_iap[] default '{}')
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_role = 'admin' then raise exception 'L’administrateur garde toujours l’accès à toutes les rubriques'; end if;
  if p_module = 'accueil' and not p_autorise then raise exception 'L’accueil reste accessible à tous'; end if;
  if p_module = 'administration' and p_autorise then raise exception 'L’administration est réservée à l’administrateur'; end if;
  insert into public.ep_droits (module, role, autorise, niveaux, maj_le, maj_par)
  values (p_module, p_role, p_autorise, coalesce(p_niveaux, '{}'), now(), auth.uid())
  on conflict (module, role) do update set autorise = excluded.autorise, niveaux = excluded.niveaux, maj_le = now(), maj_par = auth.uid();
end $$;

revoke execute on function public.ep_modules_autorises(), public.ep_admin_maj_droit(text, public.ep_role, boolean, public.ep_niveau_iap[]) from public, anon;
grant execute on function public.ep_modules_autorises(), public.ep_admin_maj_droit(text, public.ep_role, boolean, public.ep_niveau_iap[]) to authenticated;
