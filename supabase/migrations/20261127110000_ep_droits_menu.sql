-- Nouveau menu : Planning des tournées (mêmes droits que le CRM), Commande serrures et Reproduction de clés (à venir)
insert into public.ep_droits (module, role, autorise, niveaux)
select 'tournees', role, autorise, niveaux from public.ep_droits where module = 'crm'
on conflict (module, role) do nothing;

insert into public.ep_droits (module, role, autorise, niveaux)
select m, r::public.ep_role, r in ('admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'client_gerant', 'client_equipe', 'sav'), '{}'
from unnest(array['commande_serrures', 'reproduction_cles']) as m,
     unnest(array['admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe', 'sav', 'bureau_etudes', 'qualite']) as r
on conflict (module, role) do nothing;
