-- Espace Pro : demandes SAV de démonstration (supprimables : delete from public.ep_sav_demandes where demo;)
-- ════════════════════════════════════════════════════════════════════
do $$
declare
  comptes uuid[];
  noms text[];
  types public.ep_sav_type[] := array['reclamation_garantie','pieces_detachees','assistance_technique','livraison_litige']::public.ep_sav_type[];
  gammes text[] := array['Altitude','Horizon','Quartz','Cylindres','Serrures multipoints'];
  descriptions text[] := array[
    'La serrure multipoints accroche en fin de course depuis la pose, il faut forcer pour verrouiller.',
    'Besoin de deux gâches de remplacement pour un bloc-porte posé en 2023.',
    'Question sur le réglage des paumelles : la porte frotte en partie haute après une semaine.',
    'Colis reçu avec le panneau de décor rayé sur toute la hauteur.',
    'Le cylindre ne tourne plus avec la clé de secours, client bloqué dehors ce matin.',
    'Joint périphérique décollé sur la face extérieure, infiltration d’air constatée.',
    'Référence livrée différente de la commande : BP1 au lieu de BP2.',
    'Demande d’aide pour adapter un blindage sur une porte ancienne en chêne massif.'];
  statuts public.ep_sav_statut[] := array['nouvelle','nouvelle','nouvelle','en_analyse','en_analyse','infos_demandees','avis_technique','en_resolution','en_resolution','resolue','resolue','resolue','resolue','cloturee','cloturee']::public.ep_sav_statut[];
  causes text[] := array['Défaut de fabrication','Transport','Erreur de préparation','Défaut fournisseur'];
  i int; v_id uuid; v_statut public.ep_sav_statut; v_type public.ep_sav_type; v_cree timestamptz; v_compte uuid; v_nom text;
begin
  select array_agg(id order by raison_sociale), array_agg(raison_sociale order by raison_sociale) into comptes, noms
    from (select id, raison_sociale from public.ep_comptes where actif order by random() limit 12) x;

  for i in 1..15 loop
    v_statut := statuts[i];
    v_type := types[1 + (i % 4)];
    v_cree := now() - make_interval(days => (16 - i) * 2 + (random() * 2)::int, hours => (random() * 8)::int);
    v_compte := comptes[1 + (i % array_length(comptes, 1))];
    v_nom := noms[1 + (i % array_length(noms, 1))];

    insert into public.ep_sav_demandes (
      cree_le, mis_a_jour_le, compte_id, declarant_nom, declarant_role, type, gamme, produit, reference_produit,
      numero_commande, numero_serie, description, adresse_chantier, statut,
      decision, decide_le, resolution, avoir_reference, avoir_montant, bon_retour, resolu_le, cloture_le,
      non_conformite, cause, action_corrective, qualifie_le, demo
    ) values (
      v_cree, v_cree + interval '1 hour', v_compte, v_nom, 'client_gerant', v_type, gammes[1 + (i % 5)],
      case v_type when 'pieces_detachees' then 'Gâche électrique' when 'assistance_technique' then 'Bloc-porte' else 'Porte blindée ' || gammes[1 + (i % 5)] end,
      'REF-' || (4100 + i * 7),
      case when v_type in ('reclamation_garantie', 'livraison_litige') then 'CDE-2026-' || (10200 + i * 13) end,
      case when i % 3 = 0 then 'SN' || (880000 + i * 101) end,
      descriptions[1 + (i % 8)],
      case when i % 2 = 0 then (10 + i) || ' rue des Lilas' end,
      v_statut,
      case when v_statut in ('en_resolution', 'resolue', 'cloturee') then
        (case when i % 5 = 0 then 'garantie_refusee' when i % 4 = 0 then 'geste_commercial' else 'garantie_acceptee' end)::public.ep_sav_decision end,
      case when v_statut in ('en_resolution', 'resolue', 'cloturee') then v_cree + interval '2 days' end,
      case when v_statut in ('resolue', 'cloturee') and i % 5 <> 0 then
        (array['piece_envoyee','retour_produit','remplacement','avoir'])[1 + (i % 4)]::public.ep_sav_resolution end,
      case when v_statut in ('resolue', 'cloturee') and i % 5 <> 0 and (1 + (i % 4)) = 4 then 'AV-' || (5500 + i) end,
      case when v_statut in ('resolue', 'cloturee') and i % 5 <> 0 and (1 + (i % 4)) = 4 then 180 + i * 12 end,
      case when v_statut in ('resolue', 'cloturee') and i % 5 <> 0 and (1 + (i % 4)) = 2 then 'BR-' || (7700 + i) end,
      case when v_statut in ('resolue', 'cloturee') then v_cree + interval '6 days' end,
      case when v_statut = 'cloturee' then v_cree + interval '13 days' end,
      case when v_statut in ('resolue', 'cloturee') and v_type in ('reclamation_garantie', 'livraison_litige') then i % 5 <> 0 end,
      case when v_statut in ('resolue', 'cloturee') and v_type in ('reclamation_garantie', 'livraison_litige') and i % 5 <> 0 then causes[1 + (i % 4)] end,
      case when v_statut in ('resolue', 'cloturee') and v_type in ('reclamation_garantie', 'livraison_litige') and i % 5 <> 0 then 'Contrôle renforcé en sortie de ligne' end,
      case when v_statut in ('resolue', 'cloturee') and v_type in ('reclamation_garantie', 'livraison_litige') then v_cree + interval '7 days' end,
      true
    ) returning id into v_id;

    insert into public.ep_sav_evenements (demande_id, type, statut, cree_le) values (v_id, 'declaration', 'nouvelle', v_cree);
    if v_statut <> 'nouvelle' then
      insert into public.ep_sav_evenements (demande_id, type, statut, cree_le) values (v_id, 'statut', 'en_analyse', v_cree + interval '3 hours');
      insert into public.ep_sav_messages (demande_id, auteur_nom, auteur_role, contenu, cree_le)
      values (v_id, 'Service SAV', 'sav', 'Bonjour, nous avons bien reçu votre demande et nous l’analysons.', v_cree + interval '3 hours');
    end if;
    if v_statut = 'infos_demandees' then
      insert into public.ep_sav_messages (demande_id, auteur_nom, auteur_role, contenu, cree_le)
      values (v_id, 'Service SAV', 'sav', 'Pouvez-vous nous envoyer une photo de l’étiquette située sur le chant de la porte ?', v_cree + interval '1 day');
      insert into public.ep_sav_evenements (demande_id, type, statut, cree_le) values (v_id, 'statut', 'infos_demandees', v_cree + interval '1 day');
    end if;
    if v_statut = 'avis_technique' then
      insert into public.ep_sav_messages (demande_id, auteur_nom, auteur_role, contenu, interne, cree_le)
      values (v_id, 'Service SAV', 'sav', 'Avis du bureau d’études demandé sur la compatibilité du renfort.', true, v_cree + interval '1 day');
      insert into public.ep_sav_evenements (demande_id, type, statut, cree_le) values (v_id, 'statut', 'avis_technique', v_cree + interval '1 day');
    end if;
    if v_statut in ('en_resolution', 'resolue', 'cloturee') then
      insert into public.ep_sav_evenements (demande_id, type, statut, cree_le) values (v_id, 'decision', 'en_resolution', v_cree + interval '2 days');
      insert into public.ep_sav_messages (demande_id, auteur_nom, auteur_role, contenu, cree_le)
      values (v_id, 'Service SAV', 'sav',
        case when i % 5 = 0 then 'Votre demande n’est pas prise en charge au titre de la garantie : la pose ne respecte pas la notice.'
             else 'Votre demande est prise en charge au titre de la garantie.' end, v_cree + interval '2 days');
    end if;
    if v_statut in ('resolue', 'cloturee') then
      insert into public.ep_sav_evenements (demande_id, type, statut, cree_le) values (v_id, 'resolution', 'resolue', v_cree + interval '6 days');
    end if;
    if v_statut = 'cloturee' then
      insert into public.ep_sav_evenements (demande_id, type, statut, cree_le) values (v_id, 'statut', 'cloturee', v_cree + interval '13 days');
    end if;
  end loop;
end $$;
