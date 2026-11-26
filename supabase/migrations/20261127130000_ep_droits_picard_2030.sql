-- Picard 2030 (Outils direction) : direction et encadrement
insert into public.ep_droits (module, role, autorise, niveaux)
select 'picard_2030', r::public.ep_role, r in ('admin', 'codir', 'chef_service', 'chef_marche'), '{}'
from unnest(array['admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe', 'sav', 'bureau_etudes', 'qualite']) as r
on conflict (module, role) do nothing;
