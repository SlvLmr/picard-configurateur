-- Démonstration : avancement tiré au hasard ligne par ligne (le premier tirage était identique pour tous les comptes).
with t as (
  select a.id, (substring(e.code from 2))::int as o, e.type, random() as r
  from public.ep_campagne_actions a
  join public.ep_campagne_cibles c on c.id = a.cible_id
  join public.ep_campagnes k on k.id = c.campagne_id and k.demo
  cross join lateral (
    select x ->> 'code' as code, x ->> 'type' as type from jsonb_array_elements(k.etapes) x where x ->> 'code' = a.etape
  ) e
)
update public.ep_campagne_actions a
   set statut = case when t.r < greatest(0.05, 0.8 - (t.o - 1) * 0.17) then 'fait' when t.r > 0.95 then 'sans_objet' else 'a_faire' end,
       fait_le = case when t.r < greatest(0.05, 0.8 - (t.o - 1) * 0.17) then now() - make_interval(days => (t.r * 28)::int, hours => (t.r * 90)::int % 9) end,
       montant = case when t.type = 'commande' and t.r < greatest(0.05, 0.8 - (t.o - 1) * 0.17) then round((300 + t.r * 9000)::numeric, 2) end,
       commentaire = case when t.o = 1 and t.r between 0.6 and 0.7 then 'Intéressé, rappeler après les congés' end
  from t
 where a.id = t.id;
