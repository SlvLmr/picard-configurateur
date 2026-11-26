-- SAV Management (Outils direction) : direction, encadrement, SAV et qualité
insert into public.ep_droits (module, role, autorise, niveaux)
select 'sav_management', r::public.ep_role, r in ('admin', 'codir', 'chef_service', 'chef_marche', 'sav', 'qualite'), '{}'
from unnest(array['admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe', 'sav', 'bureau_etudes', 'qualite']) as r
on conflict (module, role) do nothing;
