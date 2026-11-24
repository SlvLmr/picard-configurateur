-- Statistiques du Lead Manager : commercial, zone et département de chaque installateur (filtres)
create or replace function public.ep_stats_lead_manager(p_jours integer default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_depuis timestamptz := now() - make_interval(days => greatest(p_jours, 1)); r jsonb;
begin
  if not public.ep_est_interne() then raise exception 'Réservé aux équipes internes' using errcode = '42501'; end if;
  with l as (select * from public.ep_leads where recu_le >= v_depuis and not cree_par_pro),
  e as (select * from public.ep_lead_evenements where cree_le >= v_depuis)
  select jsonb_build_object(
    'recus', (select count(*) from l),
    'qualifies', (select count(*) from l where qualifie_le is not null),
    'attribues', (select count(*) from l where exists (select 1 from public.ep_lead_evenements x where x.lead_id = l.id and x.type in ('attribution', 'reattribution'))),
    'acceptes', (select count(*) from l where exists (select 1 from public.ep_lead_evenements x where x.lead_id = l.id and x.type = 'acceptation') or (accepte_le is not null and compte_id is null)),
    'refus', (select count(*) from e where type = 'refus'),
    'expires', (select count(*) from e where type = 'reattribution_auto'),
    'annules_installateur', (select count(*) from e where type = 'annulation' and (details ->> 'faute_installateur')::boolean),
    'signes', (select count(*) from l where statut in ('signe', 'pose')),
    'poses', (select count(*) from l where statut = 'pose'),
    'perdus', (select count(*) from l where statut = 'perdu'),
    'en_retard', (select count(*) from public.ep_leads where statut = 'attribue' and attribue_le + delai_acceptation < now()),
    'a_qualifier', (select count(*) from public.ep_leads where statut = 'a_valider' and qualifie_le is null),
    'delai_qualification_min', (select round(extract(epoch from avg(qualifie_le - recu_le)) / 60) from l where qualifie_le is not null),
    'delai_attribution_min', (select round(extract(epoch from avg(x.premiere - l.recu_le)) / 60) from l
                               join lateral (select min(cree_le) premiere from public.ep_lead_evenements y where y.lead_id = l.id and y.type = 'attribution') x on x.premiere is not null),
    'delai_acceptation_min', (select round(extract(epoch from avg(accepte_le - attribue_le)) / 60) from l where accepte_le is not null and compte_id is not null),
    'reattribues_pct', (select round(100.0 * count(*) filter (where exists (select 1 from public.ep_lead_evenements x where x.lead_id = l.id and x.type in ('refus', 'reattribution_auto', 'reattribution', 'annulation'))) / nullif(count(*), 0)) from l where attribue_le is not null or statut <> 'a_valider'),
    'par_temperature', (select coalesce(jsonb_object_agg(t, jsonb_build_object('total', n, 'signes', s)), '{}') from (
        select coalesce(temperature, 'non_qualifie') t, count(*) n, count(*) filter (where statut in ('signe', 'pose')) s from l group by 1) z),
    'motifs_refus', (select coalesce(jsonb_object_agg(m, n), '{}') from (select details ->> 'motif' m, count(*) n from e where type = 'refus' group by 1) z),
    'motifs_perte', (select coalesce(jsonb_object_agg(m, n), '{}') from (select motif_perte m, count(*) n from l where statut = 'perdu' and motif_perte is not null group by 1) z),
    'activite', (select coalesce(jsonb_agg(jsonb_build_object('jour', j, 'qualifies', q, 'attribues', a) order by j), '[]') from (
        select (cree_le at time zone 'Europe/Paris')::date j,
               count(*) filter (where type = 'qualification') q,
               count(*) filter (where type in ('attribution', 'reattribution')) a
        from e where type in ('qualification', 'attribution', 'reattribution') group by 1) z),
    'par_auteur', (select coalesce(jsonb_agg(jsonb_build_object('nom', nom, 'actions', n) order by n desc), '[]') from (
        select coalesce(nullif(trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), ''), 'Utilisateur') nom, count(*) n
        from e join public.ep_profils p on p.id = e.auteur
        where e.type in ('qualification', 'attribution', 'reattribution', 'relance', 'modification', 'annulation', 'commande') and p.role in ('admin', 'repartiteur')
        group by 1) z),
    'installateurs', (select coalesce(jsonb_agg(z order by z.recus desc), '[]') from (
        select c.raison_sociale nom, c.niveau_iap niveau, c.departement, c.type::text type_compte,
               (select m.prenom || ' ' || initcap(m.nom) from public.commerciaux m where m.id = c.commercial_id) commercial,
               (select initcap(m.equipe) from public.commerciaux m where m.id = c.commercial_id) zone,
               count(distinct x.lead_id) filter (where x.type in ('attribution', 'reattribution')) recus,
               count(distinct x.lead_id) filter (where x.type = 'acceptation') acceptes,
               count(*) filter (where x.type = 'refus') refus,
               count(*) filter (where x.type = 'reattribution_auto') expires,
               (select count(*) from public.ep_leads y where y.compte_id = c.id and y.statut in ('signe', 'pose') and y.recu_le >= v_depuis) signes,
               (select (public.ep_nps('client', v_depuis, c.id)) ->> 'score') nps
        from e x join public.ep_comptes c on c.id = x.compte_id
        group by c.id, c.raison_sociale, c.niveau_iap, c.departement, c.type, c.commercial_id
        order by recus desc limit 200) z),
    'nps_client', public.ep_nps('client', v_depuis),
    'nps_installateur', public.ep_nps('installateur', v_depuis),
    'facturation', (select jsonb_build_object(
        'facture', coalesce(sum(montant) filter (where statut = 'facture'), 0),
        'rembourse', coalesce(sum(montant) filter (where statut = 'rembourse'), 0),
        'offerts', count(*) filter (where statut = 'offert'))
      from public.ep_lead_facturation where mois = date_trunc('month', now() at time zone 'Europe/Paris')::date),
    'notifications_en_attente', (select count(*) from public.ep_notifications where statut <> 'envoye' and tentatives < 5),
    'notifications_echec', (select count(*) from public.ep_notifications where statut = 'echec')
  ) into r;
  return r;
end $$;
