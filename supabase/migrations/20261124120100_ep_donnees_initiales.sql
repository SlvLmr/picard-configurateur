-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : données initiales
-- 1. Comptes IAP importés depuis l'outil Commerce (boost_iap)
-- 2. Leads de démonstration (demo = true, supprimables d'un coup :
--    delete from public.ep_leads where demo;)
-- ════════════════════════════════════════════════════════════════════

insert into public.ep_comptes (numero_client, raison_sociale, type, niveau_iap, cp, ville, commercial_id, source_boost_iap_id)
select
  nullif(trim(b.numero), ''),
  coalesce(nullif(trim(b.raison), ''), 'Sans raison sociale'),
  'IAP',
  case upper(b.statut) when 'ELITE' then 'Elite' when 'PREMIUM' then 'Premium' when 'OFFICIEL' then 'Officiel' end::public.ep_niveau_iap,
  nullif(trim(b.cp), ''),
  nullif(trim(b.ville), ''),
  (select c.id from public.commerciaux c where c.nom ilike b.atc or b.atc = any (c.alias) order by c.ordre nulls last limit 1),
  b.id
from public.boost_iap b
on conflict (source_boost_iap_id) do nothing;

-- Leads de démonstration répartis sur les 30 derniers jours,
-- dans les départements où le réseau est présent (et quelques-uns hors réseau).
do $$
declare
  contacts text[] := array['Mme Bernard','M. Leroy','SCI Les Tilleuls','Mme Petit','M. Garnier','Mme Rousseau','M. Caradec',
    'Mme Fontaine','M. Morel','Mme Lefèvre','M. Girard','Syndic Horizon','Mme Mercier','M. Blanc','Mme Chevalier','M. Robin',
    'Mme Gauthier','M. Perrin','Mme Lemoine','M. Faure','Cabinet Durieux','Mme Roux','M. Vincent','Mme Masson'];
  projets text[] := array['Porte blindée palière, A2P BP2','Blindage de porte existante','Cylindre haute sécurité',
    'Porte blindée de pavillon','Porte blindée palière, A2P BP1','Serrure multipoints','Bloc-porte A2P BP3',
    'Remplacement de serrure après effraction'];
  sources public.ep_lead_source[] := array['Ma Porte','Ma Porte','Site web','Site web','Téléphone','Salon']::public.ep_lead_source[];
  hors_reseau text[] := array['23000','15000','48000','05000'];
  cps text[];
  i int;
  v_cp text;
  v_recu timestamptz;
  v_lead public.ep_leads;
  r float;
  v_compte uuid;
  v_commercial uuid;
begin
  select array_agg(cp) into cps from (select cp from public.ep_comptes where cp is not null order by random() limit 60) x;

  for i in 1..90 loop
    v_cp := case when i % 15 = 0 then hors_reseau[1 + (i / 15) % 4] else cps[1 + (i % array_length(cps, 1))] end;
    -- les 12 premiers sont récents (moins de 3 h) et restent à valider
    v_recu := case when i <= 12 then now() - make_interval(mins => 8 * i + (random() * 6)::int)
                   else now() - make_interval(hours => 4 + (random() * 26 * 24)::int) end;

    insert into public.ep_leads (recu_le, source, contact_nom, cp, ville, projet, gros_projet, demo, configuration_ma_porte)
    values (
      v_recu,
      sources[1 + (i % array_length(sources, 1))],
      contacts[1 + (i % array_length(contacts, 1))],
      v_cp,
      coalesce((select ville from public.ep_comptes where cp = v_cp limit 1), 'Commune ' || v_cp),
      case when contacts[1 + (i % array_length(contacts, 1))] like any (array['SCI%','Syndic%','Cabinet%'])
           then (6 + i % 14) || ' portes palières en copropriété' else projets[1 + (i % array_length(projets, 1))] end,
      contacts[1 + (i % array_length(contacts, 1))] like any (array['SCI%','Syndic%','Cabinet%']),
      true,
      case when sources[1 + (i % array_length(sources, 1))] = 'Ma Porte'
           then jsonb_build_object('modele', (array['Altitude','Horizon','Quartz'])[1 + i % 3], 'finition', (array['Chêne clair','Gris anthracite','Blanc'])[1 + i % 3], 'largeur_cm', 90 + i % 5, 'hauteur_cm', 215) end
    )
    returning * into v_lead;

    continue when i <= 12;

    -- Cycle de vie simulé pour les plus anciens
    v_compte := v_lead.suggestion_compte_id;
    v_commercial := coalesce(v_lead.suggestion_commercial_id, (select commercial_id from public.ep_comptes where id = v_compte));
    r := random();

    update public.ep_leads set
      compte_id = v_compte, commercial_id = v_commercial,
      attribue_le = recu_le + make_interval(mins => 20 + (random() * 200)::int),
      statut = case when v_compte is null then 'accepte' when recu_le > now() - interval '20 hours' and r < 0.5 then 'attribue' else 'accepte' end::public.ep_lead_statut
    where id = v_lead.id returning * into v_lead;
    insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, cree_le)
    values (v_lead.id, 'attribution', 'attribue', v_compte, v_lead.attribue_le);

    continue when v_lead.statut = 'attribue';

    update public.ep_leads set accepte_le = attribue_le + make_interval(mins => 30 + (random() * 900)::int) where id = v_lead.id returning * into v_lead;
    insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, cree_le) values (v_lead.id, 'acceptation', 'accepte', v_compte, v_lead.accepte_le);
    if v_compte is not null then
      insert into public.ep_points (compte_id, points, motif, lead_id, cree_le) values (v_compte, 20, 'Lead accepté', v_lead.id, v_lead.accepte_le);
    end if;

    -- Progression : contacté → devis → signé / perdu
    if r > 0.12 then
      update public.ep_leads set statut = 'contacte'::public.ep_lead_statut where id = v_lead.id;
      insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, cree_le) values (v_lead.id, 'statut', 'contacte', v_compte, v_lead.accepte_le + interval '1 day');
    end if;
    if r > 0.35 then
      update public.ep_leads set statut = 'devis'::public.ep_lead_statut where id = v_lead.id;
      insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, cree_le) values (v_lead.id, 'statut', 'devis', v_compte, v_lead.accepte_le + interval '3 days');
    end if;
    if r > 0.62 then
      update public.ep_leads set statut = (case when r > 0.82 then 'perdu' else 'signe' end)::public.ep_lead_statut where id = v_lead.id;
      insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, cree_le)
      values (v_lead.id, 'statut', case when r > 0.82 then 'perdu' else 'signe' end::public.ep_lead_statut, v_compte, v_lead.accepte_le + interval '8 days');
    end if;
  end loop;
end $$;
