-- Lead Management : rubrique interne distincte des Leads (installateurs et ATC)
insert into public.ep_droits (module, role, autorise, niveaux)
select 'lead_management', r::public.ep_role, r in ('admin', 'codir', 'chef_service', 'chef_marche', 'repartiteur'), '{}'
from unnest(array['admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe', 'sav', 'bureau_etudes', 'qualite']) as r
on conflict (module, role) do nothing;

-- Le Lead Manager travaille dans Lead Management : la rubrique Leads ne lui est plus proposée
update public.ep_droits set autorise = false where module = 'leads' and role = 'repartiteur';
