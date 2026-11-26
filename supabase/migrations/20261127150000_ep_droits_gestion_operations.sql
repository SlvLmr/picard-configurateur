-- Gestion opérations (Outils commerciaux) : commerciaux et encadrement
insert into public.ep_droits (module, role, autorise, niveaux)
select 'gestion_operations', r::public.ep_role, r in ('admin', 'codir', 'chef_service', 'chef_marche', 'atc'), '{}'
from unnest(array['admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe', 'sav', 'bureau_etudes', 'qualite']) as r
on conflict (module, role) do nothing;
