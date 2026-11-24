-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : Leads, version 2 (fiche validée le 25/11/2026)
--  · Lead Manager (ex-répartiteur) : qualification, température, création
--  · Coordonnées du client masquées jusqu'à l'acceptation
--  · Statuts rendez-vous et posé, motifs de perte, annulation
--  · Facturation des leads (paramétrable, activable, remisable)
--  · Notifications e-mail et SMS (file d'envoi)
--  · Enquêtes de satisfaction (NPS client final et installateur)
--  · Leads créés par l'installateur, fil de commentaires partagé
-- ════════════════════════════════════════════════════════════════════

-- ── Colonnes ────────────────────────────────────────────────────────
alter table public.ep_leads
  add column adresse text,
  add column message text,
  add column contact_prefere text check (contact_prefere in ('telephone', 'email', 'sms')),
  add column temperature text check (temperature in ('froid', 'tiede', 'chaud')),
  add column nature_projet text,
  add column echeance text,
  add column budget text,
  add column type_bien text,
  add column qualifie_le timestamptz,
  add column qualifie_par uuid references auth.users (id) on delete set null,
  add column motif_perte text,
  add column reference_commande text,
  add column reference_validee_le timestamptz,
  add column cree_par_pro boolean not null default false;

-- Contacts de l'installateur pour les notifications de leads
alter table public.ep_comptes
  add column email_leads text check (email_leads is null or email_leads like '%_@_%'),
  add column telephone_leads text;

alter table public.ep_lead_evenements drop constraint ep_lead_evenements_type_check;
alter table public.ep_lead_evenements add constraint ep_lead_evenements_type_check check (type in (
  'recu', 'attribution', 'acceptation', 'refus', 'statut', 'reattribution_auto',
  'reattribution', 'relance', 'note', 'modification',
  'qualification', 'annulation', 'creation_pro', 'commentaire', 'commande', 'enquete'
));

-- Fil partagé : une note peut être interne (Picard) ou visible par l'installateur
alter table public.ep_lead_notes add column interne boolean not null default true;
drop policy ep_lead_notes_lecture on public.ep_lead_notes;
create policy ep_lead_notes_lecture on public.ep_lead_notes for select to authenticated using (
  public.ep_est_interne()
  or exists (select 1 from public.ep_leads l where l.id = lead_id and l.commercial_id = public.ep_mon_commercial())
  or (not interne and exists (select 1 from public.ep_leads l where l.id = lead_id and l.compte_id = public.ep_mon_compte() and l.statut not in ('a_valider', 'attribue')))
);

-- ── Coordonnées masquées ────────────────────────────────────────────
-- Les colonnes nominatives ne sont plus lisibles directement : elles passent
-- par ep_leads_coordonnees(), qui les masque tant que le lead n'est pas accepté.
revoke select on public.ep_leads from authenticated;
grant select (
  id, reference, recu_le, source, cp, ville, departement, projet, configuration_ma_porte, gros_projet, statut,
  suggestion_compte_id, suggestion_commercial_id, compte_id, commercial_id, attribue_le, attribue_par,
  delai_acceptation, accepte_le, demo, message, contact_prefere, temperature, nature_projet, echeance, budget,
  type_bien, qualifie_le, qualifie_par, motif_perte, reference_commande, reference_validee_le, cree_par_pro
) on public.ep_leads to authenticated;

create function public.ep_lead_visible(l public.ep_leads) returns text
language sql stable security definer set search_path = '' as $$
  -- 'complet' : coordonnées visibles ; 'masque' : lead visible sans coordonnées ; null : invisible
  select case
    when public.ep_est_interne() then 'complet'
    when public.ep_mon_commercial() is not null and (
      l.commercial_id = public.ep_mon_commercial()
      or l.compte_id in (select c.id from public.ep_comptes c where c.commercial_id = public.ep_mon_commercial())
    ) then 'complet'
    when l.compte_id is not null and l.compte_id = public.ep_mon_compte() then
      case when l.statut = 'a_valider' then null when l.statut = 'attribue' then 'masque' else 'complet' end
  end
$$;

create function public.ep_leads_coordonnees(p_ids uuid[])
returns table (id uuid, contact_nom text, telephone text, email text, adresse text, masque boolean)
language sql stable security definer set search_path = '' as $$
  select l.id,
         case when v.niveau = 'complet' then l.contact_nom end,
         case when v.niveau = 'complet' then l.telephone end,
         case when v.niveau = 'complet' then l.email end,
         case when v.niveau = 'complet' then l.adresse end,
         v.niveau = 'masque'
  from public.ep_leads l
  cross join lateral (select public.ep_lead_visible(l) as niveau) v
  where l.id = any (coalesce(p_ids, '{}')) and v.niveau is not null
$$;

-- ── Paramètres ──────────────────────────────────────────────────────
insert into public.ep_parametres (cle, valeur, libelle, aide, unite, groupe, ordre) values
  ('lead_facturation_active', 0, 'Facturation des leads', 'Facture chaque lead accepté par un installateur. Les leads créés par l’installateur lui-même ne sont jamais facturés.', 'oui/non', 'Facturation des leads', 1),
  ('lead_prix', 10, 'Prix d’un lead', 'Montant facturé à l’acceptation, avant remise.', '€', 'Facturation des leads', 2),
  ('lead_remise_elite', 0, 'Remise IAP Elite', 'Remise appliquée aux installateurs Elite. 100 % rend les leads gratuits.', '%', 'Facturation des leads', 3),
  ('lead_remise_premium', 0, 'Remise IAP Premium', 'Remise appliquée aux installateurs Premium.', '%', 'Facturation des leads', 4),
  ('lead_remise_officiel', 0, 'Remise IAP Officiel', 'Remise appliquée aux installateurs Officiel.', '%', 'Facturation des leads', 5),
  ('lead_gratuits_mois', 0, 'Leads offerts chaque mois', 'Nombre de leads non facturés par installateur et par mois.', 'leads', 'Facturation des leads', 6),
  ('lead_remboursement_vente', 1, 'Remboursement à la vente', 'Rembourse le lead quand une commande Picard y est rattachée et validée par le Lead Manager.', 'oui/non', 'Facturation des leads', 7),
  ('lead_notifications_sms', 1, 'SMS à l’attribution', 'Envoie un SMS à l’installateur et à son commercial en plus de l’e-mail.', 'oui/non', 'Leads', 2),
  ('lead_enquete_auto', 0, 'Enquête de satisfaction automatique', 'Envoie l’enquête au client et à l’installateur quand le lead passe à « posé ».', 'oui/non', 'Leads', 3)
on conflict (cle) do nothing;

-- Remise propre à un installateur (prioritaire sur la remise de son niveau)
create table public.ep_lead_tarifs_comptes (
  compte_id uuid primary key references public.ep_comptes (id) on delete cascade,
  remise_pct numeric not null check (remise_pct between 0 and 100),
  maj_le timestamptz not null default now(),
  maj_par uuid references auth.users (id) on delete set null
);
alter table public.ep_lead_tarifs_comptes enable row level security;
revoke all on public.ep_lead_tarifs_comptes from anon;
revoke insert, update, delete on public.ep_lead_tarifs_comptes from authenticated;
create policy ep_lead_tarifs_lecture on public.ep_lead_tarifs_comptes for select to authenticated using (public.ep_est_interne());

-- ── Facturation ─────────────────────────────────────────────────────
create table public.ep_lead_facturation (
  id bigint generated always as identity primary key,
  lead_id uuid not null unique references public.ep_leads (id) on delete cascade,
  compte_id uuid not null references public.ep_comptes (id) on delete cascade,
  mois date not null,
  prix numeric not null,
  remise_pct numeric not null default 0,
  montant numeric not null,
  statut text not null check (statut in ('facture', 'offert', 'rembourse')),
  motif text,
  cree_le timestamptz not null default now(),
  rembourse_le timestamptz
);
create index ep_lead_facturation_compte_idx on public.ep_lead_facturation (compte_id, mois);
alter table public.ep_lead_facturation enable row level security;
revoke all on public.ep_lead_facturation from anon;
revoke insert, update, delete on public.ep_lead_facturation from authenticated;
-- Visible par Picard et par le gérant du compte (pas par son équipe)
create policy ep_lead_facturation_lecture on public.ep_lead_facturation for select to authenticated using (
  public.ep_est_interne()
  or (compte_id = public.ep_mon_compte() and exists (select 1 from public.ep_profils p where p.id = auth.uid() and p.role = 'client_gerant' and p.actif))
);

create function public.ep_facturer_lead(p_lead uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  l public.ep_leads; c public.ep_comptes; v_prix numeric; v_remise numeric; v_mois date; v_offerts int; v_quota int;
begin
  if public.ep_parametre('lead_facturation_active', 0) < 1 then return; end if;
  select * into l from public.ep_leads where id = p_lead;
  if l.compte_id is null or l.cree_par_pro then return; end if;
  if exists (select 1 from public.ep_lead_facturation where lead_id = p_lead) then return; end if;
  select * into c from public.ep_comptes where id = l.compte_id;
  v_prix := public.ep_parametre('lead_prix', 10);
  v_remise := coalesce(
    (select remise_pct from public.ep_lead_tarifs_comptes where compte_id = c.id),
    case c.niveau_iap
      when 'Elite' then public.ep_parametre('lead_remise_elite', 0)
      when 'Premium' then public.ep_parametre('lead_remise_premium', 0)
      when 'Officiel' then public.ep_parametre('lead_remise_officiel', 0)
      else 0 end);
  v_mois := date_trunc('month', now() at time zone 'Europe/Paris')::date;
  v_quota := public.ep_parametre('lead_gratuits_mois', 0)::int;
  select count(*) into v_offerts from public.ep_lead_facturation where compte_id = c.id and mois = v_mois and motif = 'Lead offert du mois';

  if v_offerts < v_quota then
    insert into public.ep_lead_facturation (lead_id, compte_id, mois, prix, remise_pct, montant, statut, motif)
    values (p_lead, c.id, v_mois, v_prix, 100, 0, 'offert', 'Lead offert du mois');
  elsif v_remise >= 100 then
    insert into public.ep_lead_facturation (lead_id, compte_id, mois, prix, remise_pct, montant, statut, motif)
    values (p_lead, c.id, v_mois, v_prix, 100, 0, 'offert', 'Remise de 100 %');
  else
    insert into public.ep_lead_facturation (lead_id, compte_id, mois, prix, remise_pct, montant, statut)
    values (p_lead, c.id, v_mois, v_prix, v_remise, round(v_prix * (100 - v_remise) / 100, 2), 'facture');
  end if;
end $$;

-- ── Notifications (file d'envoi, expédiée par l'application) ────────
create table public.ep_notifications (
  id bigint generated always as identity primary key,
  canal text not null check (canal in ('email', 'sms')),
  destinataire text not null,
  destinataire_nom text,
  sujet text,
  contenu text not null,
  lien text,
  lead_id uuid references public.ep_leads (id) on delete set null,
  motif text not null,
  statut text not null default 'a_envoyer' check (statut in ('a_envoyer', 'envoye', 'echec')),
  tentatives integer not null default 0,
  erreur text,
  cree_le timestamptz not null default now(),
  envoye_le timestamptz
);
create index ep_notifications_statut_idx on public.ep_notifications (statut, cree_le);
alter table public.ep_notifications enable row level security;
revoke all on public.ep_notifications from anon;
revoke insert, update, delete on public.ep_notifications from authenticated;
create policy ep_notifications_lecture on public.ep_notifications for select to authenticated using (public.ep_est_interne());

create function public.ep_notifier(
  p_canal text, p_destinataire text, p_nom text, p_sujet text, p_contenu text, p_lien text, p_lead uuid, p_motif text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(trim(p_destinataire), '') = '' then return; end if;
  if p_canal = 'sms' and public.ep_parametre('lead_notifications_sms', 1) < 1 and p_motif like 'attribution%' then return; end if;
  insert into public.ep_notifications (canal, destinataire, destinataire_nom, sujet, contenu, lien, lead_id, motif)
  values (p_canal, trim(p_destinataire), p_nom, p_sujet, p_contenu, p_lien, p_lead, p_motif);
end $$;

-- Installateur (gérants et contact leads du compte) et son commercial
create function public.ep_notifier_attribution(p_lead uuid, p_relance boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
declare
  l public.ep_leads; c public.ep_comptes; m public.commerciaux; u record; v_texte text; v_sujet text;
begin
  select * into l from public.ep_leads where id = p_lead;
  if l.id is null then return; end if;
  if l.compte_id is not null then
    select * into c from public.ep_comptes where id = l.compte_id;
    v_sujet := case when p_relance then 'Rappel : un lead vous attend (' || l.reference || ')' else 'Nouveau lead ' || l.reference || ' : ' || l.projet end;
    v_texte := case when p_relance
      then 'Picard Serrures : le lead ' || l.reference || ' (' || l.projet || ', ' || coalesce(l.ville, l.cp) || ') attend votre réponse. Acceptez-le sur l’Espace Pro.'
      else 'Picard Serrures : nouveau lead ' || l.reference || ', ' || l.projet || ' à ' || coalesce(l.ville, l.cp) || ' (' || l.cp || '). Vous avez ' ||
           round(extract(epoch from l.delai_acceptation) / 3600) || ' h pour l’accepter sur l’Espace Pro.' end;
    -- e-mail : contact leads du compte, sinon les gérants
    if c.email_leads is not null then
      perform public.ep_notifier('email', c.email_leads, c.raison_sociale, v_sujet, v_texte, '/leads', p_lead, case when p_relance then 'relance' else 'attribution' end);
    else
      for u in select au.email, coalesce(p.prenom || ' ' || p.nom, c.raison_sociale) as nom
               from public.ep_profils p join auth.users au on au.id = p.id
               where p.compte_id = c.id and p.role = 'client_gerant' and p.actif loop
        perform public.ep_notifier('email', u.email, u.nom, v_sujet, v_texte, '/leads', p_lead, case when p_relance then 'relance' else 'attribution' end);
      end loop;
    end if;
    perform public.ep_notifier('sms', c.telephone_leads, c.raison_sociale, null, v_texte, '/leads', p_lead, case when p_relance then 'relance' else 'attribution' end);
  end if;

  if not p_relance and l.commercial_id is not null then
    select * into m from public.commerciaux where id = l.commercial_id;
    v_texte := case when l.compte_id is not null
      then 'Picard Serrures : le lead ' || l.reference || ' (' || l.projet || ', ' || coalesce(l.ville, l.cp) || ') vient d’être attribué à votre client ' || c.raison_sociale || '.'
      else 'Picard Serrures : le lead ' || l.reference || ' (' || l.projet || ', ' || coalesce(l.ville, l.cp) || ') vous est attribué directement, sans installateur dans la zone.' end;
    perform public.ep_notifier('email', m.email, m.prenom || ' ' || m.nom, 'Lead ' || l.reference || ' : ' || l.projet, v_texte, '/leads', p_lead, 'attribution_atc');
    perform public.ep_notifier('sms', m.telephone, m.prenom || ' ' || m.nom, null, v_texte, '/leads', p_lead, 'attribution_atc');
  end if;
end $$;

create function public.ep_notifications_a_envoyer(p_limite integer default 50)
returns setof public.ep_notifications
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.ep_peut_gerer_leads() or public.ep_est_admin()) then raise exception 'Réservé au Lead Manager' using errcode = '42501'; end if;
  return query select * from public.ep_notifications where statut <> 'envoye' and tentatives < 5 order by cree_le limit greatest(p_limite, 1);
end $$;

create function public.ep_notification_resultat(p_id bigint, p_ok boolean, p_erreur text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.ep_peut_gerer_leads() or public.ep_est_admin()) then raise exception 'Réservé au Lead Manager' using errcode = '42501'; end if;
  update public.ep_notifications set
    statut = case when p_ok then 'envoye' else 'echec' end,
    tentatives = tentatives + 1,
    erreur = case when p_ok then null else left(p_erreur, 500) end,
    envoye_le = case when p_ok then now() end
  where id = p_id;
end $$;

-- ── Attribution, réattribution, relance (versions Lead Manager) ─────
create or replace function public.ep_attribuer_lead(p_lead uuid, p_compte uuid default null, p_commercial uuid default null)
returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_compte uuid; v_commercial uuid;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seul le Lead Manager peut attribuer un lead' using errcode = '42501'; end if;
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if l.statut <> 'a_valider' then raise exception 'Ce lead a déjà été attribué'; end if;

  if p_compte is not null or p_commercial is not null then
    v_compte := p_compte;
    v_commercial := coalesce(p_commercial, (select commercial_id from public.ep_comptes where id = p_compte));
  else
    v_compte := l.suggestion_compte_id;
    v_commercial := coalesce(l.suggestion_commercial_id, (select commercial_id from public.ep_comptes where id = l.suggestion_compte_id));
  end if;
  if v_compte is null and v_commercial is null then raise exception 'Choisissez un installateur ou un commercial'; end if;

  update public.ep_leads
     set statut = (case when v_compte is null then 'accepte' else 'attribue' end)::public.ep_lead_statut,
         compte_id = v_compte, commercial_id = v_commercial,
         attribue_le = now(), attribue_par = auth.uid(),
         accepte_le = case when v_compte is null then now() end,
         delai_acceptation = public.ep_delai_acceptation()
   where id = p_lead returning * into l;

  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'attribution', l.statut, v_compte, auth.uid(), jsonb_build_object('commercial_id', v_commercial, 'par', public.ep_nom_utilisateur()));
  perform public.ep_notifier_attribution(p_lead);
  return l;
end $$;

create or replace function public.ep_reattribuer_lead(p_lead uuid, p_compte uuid default null, p_commercial uuid default null)
returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_commercial uuid;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seul le Lead Manager peut réattribuer un lead' using errcode = '42501'; end if;
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if l.statut <> 'attribue' then raise exception 'Seul un lead en attente d’acceptation peut être réattribué'; end if;
  if p_compte is null and p_commercial is null then raise exception 'Choisissez un installateur ou un commercial'; end if;
  if p_compte is not null and p_compte = l.compte_id then raise exception 'Ce lead est déjà attribué à cet installateur'; end if;

  v_commercial := coalesce(p_commercial, (select commercial_id from public.ep_comptes where id = p_compte));
  update public.ep_leads
     set compte_id = p_compte, commercial_id = v_commercial,
         statut = (case when p_compte is null then 'accepte' else 'attribue' end)::public.ep_lead_statut,
         attribue_le = now(), attribue_par = auth.uid(),
         accepte_le = case when p_compte is null then now() end,
         delai_acceptation = public.ep_delai_acceptation()
   where id = p_lead returning * into l;

  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'reattribution', l.statut, p_compte, auth.uid(), jsonb_build_object('commercial_id', v_commercial, 'par', public.ep_nom_utilisateur()));
  perform public.ep_notifier_attribution(p_lead);
  return l;
end $$;

create or replace function public.ep_relancer_pro(p_lead uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seul le Lead Manager peut relancer un installateur' using errcode = '42501'; end if;
  select * into l from public.ep_leads where id = p_lead;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if l.statut not in ('attribue', 'accepte', 'contacte', 'rdv', 'devis') then raise exception 'Ce lead ne peut pas faire l’objet d’une relance'; end if;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'relance', l.statut, l.compte_id, auth.uid(), jsonb_build_object('par', public.ep_nom_utilisateur()));
  perform public.ep_notifier_attribution(p_lead, true);
end $$;

-- Remet un lead dans la file du Lead Manager en écartant les installateurs déjà sollicités
create function public.ep_remettre_en_file(p_lead uuid, p_type text, p_details jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; s record; exclus uuid[];
begin
  select * into l from public.ep_leads where id = p_lead for update;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, p_type, 'a_valider', l.compte_id, auth.uid(), p_details);
  select coalesce(array_agg(distinct compte_id), '{}') into exclus
    from public.ep_lead_evenements
   where lead_id = p_lead and compte_id is not null and type in ('refus', 'reattribution_auto', 'annulation');
  select * into s from public.ep_suggerer(l.departement, exclus);
  update public.ep_leads
     set statut = 'a_valider', compte_id = null, commercial_id = null, attribue_le = null, attribue_par = null, accepte_le = null,
         suggestion_compte_id = s.compte_id,
         suggestion_commercial_id = case when s.compte_id is null then s.commercial_id end
   where id = p_lead;
end $$;

create or replace function public.ep_refuser_lead(p_lead uuid, p_motif text) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_compte uuid := public.ep_mon_compte();
begin
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null or l.compte_id is distinct from v_compte then raise exception 'Lead introuvable'; end if;
  if l.statut <> 'attribue' then raise exception 'Ce lead n’est plus en attente d’acceptation'; end if;
  if coalesce(trim(p_motif), '') = '' then raise exception 'Indiquez le motif du refus'; end if;
  perform public.ep_remettre_en_file(p_lead, 'refus', jsonb_build_object('motif', trim(p_motif)));
end $$;

-- Leads non acceptés dans le délai : retour automatique au Lead Manager
create function public.ep_expirer_leads() returns integer
language plpgsql security definer set search_path = '' as $$
declare l record; n int := 0;
begin
  for l in select id from public.ep_leads where statut = 'attribue' and attribue_le + delai_acceptation < now() for update skip locked loop
    perform public.ep_remettre_en_file(l.id, 'reattribution_auto', jsonb_build_object('motif', 'Délai d’acceptation dépassé'));
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.ep_accepter_lead(p_lead uuid) returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_compte uuid := public.ep_mon_compte();
begin
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null or l.compte_id is distinct from v_compte then raise exception 'Lead introuvable'; end if;
  if l.statut <> 'attribue' then raise exception 'Ce lead n’est plus en attente d’acceptation'; end if;
  if l.attribue_le + l.delai_acceptation < now() then raise exception 'Le délai d’acceptation est dépassé'; end if;

  update public.ep_leads set statut = 'accepte', accepte_le = now() where id = p_lead returning * into l;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur) values (p_lead, 'acceptation', 'accepte', v_compte, auth.uid());
  insert into public.ep_points (compte_id, points, motif, lead_id) values (v_compte, public.ep_parametre('points_lead_accepte', 20)::int, 'Lead accepté', p_lead);
  perform public.ep_facturer_lead(p_lead);
  return l;
end $$;

-- ── Avancement par l'installateur (ou le commercial en direct) ──────
drop function public.ep_changer_statut_lead(uuid, public.ep_lead_statut);
create function public.ep_changer_statut_lead(p_lead uuid, p_statut public.ep_lead_statut, p_motif text default null, p_reference text default null)
returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_compte uuid := public.ep_mon_compte(); deja boolean; gestion boolean := public.ep_peut_gerer_leads();
begin
  if p_statut not in ('contacte', 'rdv', 'devis', 'signe', 'pose', 'perdu') then raise exception 'Statut non autorisé'; end if;
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if not (gestion
          or (v_compte is not null and l.compte_id = v_compte)
          or (l.compte_id is null and l.commercial_id is not null and l.commercial_id = public.ep_mon_commercial())) then
    raise exception 'Lead introuvable';
  end if;
  if l.statut in ('a_valider', 'attribue') then raise exception 'Acceptez le lead avant de renseigner son avancement'; end if;
  if p_statut = 'perdu' and coalesce(trim(p_motif), '') = '' then raise exception 'Indiquez pourquoi le projet est perdu'; end if;

  select exists (select 1 from public.ep_lead_evenements where lead_id = p_lead and type = 'statut' and statut = p_statut) into deja;
  update public.ep_leads set
    statut = p_statut,
    motif_perte = case when p_statut = 'perdu' then trim(p_motif) else motif_perte end,
    reference_commande = coalesce(nullif(trim(p_reference), ''), reference_commande)
  where id = p_lead returning * into l;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'statut', p_statut, l.compte_id, auth.uid(), jsonb_strip_nulls(jsonb_build_object('motif', nullif(trim(p_motif), ''), 'reference', nullif(trim(p_reference), ''))));
  if not deja and v_compte is not null and l.compte_id = v_compte then
    insert into public.ep_points (compte_id, points, motif, lead_id) values (v_compte, public.ep_parametre('points_statut_renseigne', 10)::int, 'Statut renseigné', p_lead);
  end if;
  if p_statut = 'pose' and public.ep_parametre('lead_enquete_auto', 0) >= 1 then
    perform public.ep_creer_enquete(p_lead, 'client');
    perform public.ep_creer_enquete(p_lead, 'installateur');
  end if;
  return l;
end $$;

-- ── Lead Manager : qualification, annulation, commande ──────────────
create function public.ep_qualifier_lead(
  p_lead uuid, p_temperature text, p_nature text default null, p_echeance text default null, p_budget text default null, p_type_bien text default null
) returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seul le Lead Manager peut qualifier un lead' using errcode = '42501'; end if;
  if p_temperature not in ('froid', 'tiede', 'chaud') then raise exception 'Choisissez une température : froid, tiède ou chaud'; end if;
  update public.ep_leads set
    temperature = p_temperature, nature_projet = nullif(trim(p_nature), ''), echeance = nullif(trim(p_echeance), ''),
    budget = nullif(trim(p_budget), ''), type_bien = nullif(trim(p_type_bien), ''),
    qualifie_le = coalesce(qualifie_le, now()), qualifie_par = coalesce(qualifie_par, auth.uid())
  where id = p_lead returning * into l;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  insert into public.ep_lead_evenements (lead_id, type, statut, auteur, details)
  values (p_lead, 'qualification', l.statut, auth.uid(), jsonb_build_object('temperature', p_temperature, 'par', public.ep_nom_utilisateur()));
  return l;
end $$;

create function public.ep_annuler_lead(p_lead uuid, p_faute_installateur boolean, p_motif text) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seul le Lead Manager peut annuler un lead' using errcode = '42501'; end if;
  if coalesce(trim(p_motif), '') = '' then raise exception 'Indiquez le motif de l’annulation'; end if;
  select * into l from public.ep_leads where id = p_lead for update;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if l.statut not in ('accepte', 'contacte', 'rdv', 'devis') then raise exception 'Seul un lead en cours de suivi peut être annulé'; end if;
  if p_faute_installateur and l.compte_id is not null then
    perform public.ep_remettre_en_file(p_lead, 'annulation', jsonb_build_object('motif', trim(p_motif), 'faute_installateur', true, 'par', public.ep_nom_utilisateur()));
  else
    update public.ep_leads set statut = 'perdu', motif_perte = trim(p_motif) where id = p_lead;
    insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
    values (p_lead, 'annulation', 'perdu', l.compte_id, auth.uid(), jsonb_build_object('motif', trim(p_motif), 'faute_installateur', false, 'par', public.ep_nom_utilisateur()));
  end if;
end $$;

-- Rattache une commande Picard et rembourse le lead si le paramètre est actif
create function public.ep_valider_commande_lead(p_lead uuid, p_reference text) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seul le Lead Manager peut valider une commande' using errcode = '42501'; end if;
  if coalesce(trim(p_reference), '') = '' then raise exception 'Indiquez la référence de la commande'; end if;
  update public.ep_leads set reference_commande = trim(p_reference), reference_validee_le = now(),
    statut = case when statut in ('accepte', 'contacte', 'rdv', 'devis') then 'signe'::public.ep_lead_statut else statut end
  where id = p_lead returning * into l;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'commande', l.statut, l.compte_id, auth.uid(), jsonb_build_object('reference', trim(p_reference), 'par', public.ep_nom_utilisateur()));
  if public.ep_parametre('lead_remboursement_vente', 1) >= 1 then
    update public.ep_lead_facturation set statut = 'rembourse', rembourse_le = now() where lead_id = p_lead and statut = 'facture';
  end if;
end $$;

-- ── Création de leads ───────────────────────────────────────────────
create function public.ep_creer_lead(
  p_source public.ep_lead_source, p_contact text, p_telephone text, p_email text, p_adresse text, p_cp text, p_ville text,
  p_projet text, p_message text default null, p_contact_prefere text default null
) returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; v_compte uuid := public.ep_mon_compte(); c public.ep_comptes; pro boolean;
begin
  pro := v_compte is not null;
  if not (pro or public.ep_peut_gerer_leads()) then raise exception 'Vous ne pouvez pas créer de lead' using errcode = '42501'; end if;
  if coalesce(trim(p_contact), '') = '' then raise exception 'Le nom du client est obligatoire'; end if;
  if coalesce(trim(p_cp), '') !~ '^[0-9]{5}$' then raise exception 'Le code postal doit comporter 5 chiffres'; end if;
  if coalesce(trim(p_projet), '') = '' then raise exception 'Le projet est obligatoire'; end if;
  if coalesce(trim(p_telephone), '') = '' and coalesce(trim(p_email), '') = '' then raise exception 'Indiquez un téléphone ou un e-mail'; end if;

  if pro then
    select * into c from public.ep_comptes where id = v_compte;
    insert into public.ep_leads (source, contact_nom, telephone, email, adresse, cp, ville, projet, message, contact_prefere,
                                 statut, compte_id, commercial_id, suggestion_compte_id, attribue_le, accepte_le, cree_par_pro)
    values ('Installateur', trim(p_contact), nullif(trim(p_telephone), ''), nullif(lower(trim(p_email)), ''), nullif(trim(p_adresse), ''),
            trim(p_cp), nullif(trim(p_ville), ''), trim(p_projet), nullif(trim(p_message), ''), p_contact_prefere,
            'accepte', v_compte, c.commercial_id, v_compte, now(), now(), true)
    returning * into l;
    insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
    values (l.id, 'creation_pro', 'accepte', v_compte, auth.uid(), jsonb_build_object('par', public.ep_nom_utilisateur()));
  else
    insert into public.ep_leads (source, contact_nom, telephone, email, adresse, cp, ville, projet, message, contact_prefere)
    values (p_source, trim(p_contact), nullif(trim(p_telephone), ''), nullif(lower(trim(p_email)), ''), nullif(trim(p_adresse), ''),
            trim(p_cp), nullif(trim(p_ville), ''), trim(p_projet), nullif(trim(p_message), ''), p_contact_prefere)
    returning * into l;
  end if;
  return l;
end $$;

-- Modification : coordonnées complètes (adresse et contact préféré inclus)
drop function public.ep_modifier_lead(uuid, text, text, text, text, text, text, boolean);
create function public.ep_modifier_lead(
  p_lead uuid, p_contact text, p_telephone text, p_email text, p_cp text, p_ville text, p_projet text, p_gros_projet boolean,
  p_adresse text default null, p_message text default null, p_contact_prefere text default null
) returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; avant public.ep_leads;
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seul le Lead Manager peut modifier un lead' using errcode = '42501'; end if;
  select * into avant from public.ep_leads where id = p_lead for update;
  if avant.id is null then raise exception 'Lead introuvable'; end if;
  if coalesce(trim(p_contact), '') = '' then raise exception 'Le nom du contact est obligatoire'; end if;
  if coalesce(trim(p_cp), '') !~ '^[0-9]{5}$' then raise exception 'Le code postal doit comporter 5 chiffres'; end if;
  if coalesce(trim(p_projet), '') = '' then raise exception 'Le projet est obligatoire'; end if;

  update public.ep_leads set
    contact_nom = trim(p_contact), telephone = nullif(trim(p_telephone), ''), email = nullif(lower(trim(p_email)), ''),
    cp = trim(p_cp), ville = nullif(trim(p_ville), ''), projet = trim(p_projet), gros_projet = coalesce(p_gros_projet, false),
    adresse = nullif(trim(p_adresse), ''), message = nullif(trim(p_message), ''), contact_prefere = p_contact_prefere
  where id = p_lead returning * into l;

  insert into public.ep_lead_evenements (lead_id, type, statut, auteur, details)
  values (p_lead, 'modification', l.statut, auth.uid(), jsonb_strip_nulls(jsonb_build_object(
    'contact', case when avant.contact_nom is distinct from l.contact_nom then true end,
    'telephone', case when avant.telephone is distinct from l.telephone then true end,
    'email', case when avant.email is distinct from l.email then true end,
    'adresse', case when avant.cp is distinct from l.cp or avant.ville is distinct from l.ville or avant.adresse is distinct from l.adresse then true end,
    'projet', case when avant.projet is distinct from l.projet or avant.gros_projet is distinct from l.gros_projet then true end,
    'par', public.ep_nom_utilisateur()
  )));
  return l;
end $$;

-- ── Commentaires partagés avec l'installateur ───────────────────────
create function public.ep_commenter_lead(p_lead uuid, p_contenu text) returns public.ep_lead_notes
language plpgsql security definer set search_path = '' as $$
declare n public.ep_lead_notes; l public.ep_leads; v text;
begin
  select * into l from public.ep_leads where id = p_lead;
  v := public.ep_lead_visible(l);
  if l.id is null or v is distinct from 'complet' then raise exception 'Vous ne pouvez pas commenter ce lead' using errcode = '42501'; end if;
  if coalesce(trim(p_contenu), '') = '' then raise exception 'Le commentaire est vide'; end if;
  insert into public.ep_lead_notes (lead_id, auteur, auteur_nom, contenu, interne)
  values (p_lead, auth.uid(), public.ep_nom_utilisateur(), trim(p_contenu), false) returning * into n;
  insert into public.ep_lead_evenements (lead_id, type, statut, auteur, details)
  values (p_lead, 'commentaire', l.statut, auth.uid(), jsonb_build_object('par', n.auteur_nom));
  return n;
end $$;

-- ── Enquêtes de satisfaction (NPS) ──────────────────────────────────
create table public.ep_lead_enquetes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.ep_leads (id) on delete cascade,
  cible text not null check (cible in ('client', 'installateur')),
  compte_id uuid references public.ep_comptes (id) on delete set null,
  jeton uuid not null unique default gen_random_uuid(),
  envoyee_le timestamptz not null default now(),
  relances integer not null default 0,
  repondue_le timestamptz,
  note integer check (note between 0 and 10),
  commentaire text,
  unique (lead_id, cible)
);
alter table public.ep_lead_enquetes enable row level security;
revoke all on public.ep_lead_enquetes from anon;
revoke insert, update, delete on public.ep_lead_enquetes from authenticated;
create policy ep_lead_enquetes_lecture on public.ep_lead_enquetes for select to authenticated using (public.ep_est_interne());

create function public.ep_creer_enquete(p_lead uuid, p_cible text) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.ep_leads; e public.ep_lead_enquetes; c public.ep_comptes; u record; v_texte text; v_sujet text; v_lien text;
begin
  select * into l from public.ep_leads where id = p_lead;
  if l.id is null then raise exception 'Lead introuvable'; end if;
  if p_cible = 'installateur' and l.compte_id is null then return; end if;
  select * into e from public.ep_lead_enquetes where lead_id = p_lead and cible = p_cible;
  if e.id is not null and e.repondue_le is not null then return; end if;
  if e.id is null then
    insert into public.ep_lead_enquetes (lead_id, cible, compte_id) values (p_lead, p_cible, l.compte_id) returning * into e;
  else
    update public.ep_lead_enquetes set relances = relances + 1, envoyee_le = now() where id = e.id returning * into e;
  end if;
  v_lien := '/enquete/' || e.jeton;
  select * into c from public.ep_comptes where id = l.compte_id;

  if p_cible = 'client' then
    v_sujet := 'Votre avis sur votre projet ' || l.projet;
    v_texte := 'Picard Serrures : merci pour votre confiance. Recommanderiez-vous ' || coalesce(c.raison_sociale, 'votre installateur') ||
               ' et Picard Serrures à un proche ? Donnez votre avis en 30 secondes : {{lien}}';
    perform public.ep_notifier('email', l.email, l.contact_nom, v_sujet, v_texte, v_lien, p_lead, 'enquete_client');
    perform public.ep_notifier('sms', l.telephone, l.contact_nom, null, v_texte, v_lien, p_lead, 'enquete_client');
  else
    v_sujet := 'Votre avis sur le lead ' || l.reference;
    v_texte := 'Picard Serrures : que pensez-vous du lead ' || l.reference || ' (' || l.projet || ') ? Notez la qualité du service Leads en 30 secondes : {{lien}}';
    if c.email_leads is not null then
      perform public.ep_notifier('email', c.email_leads, c.raison_sociale, v_sujet, v_texte, v_lien, p_lead, 'enquete_installateur');
    else
      for u in select au.email, coalesce(p.prenom || ' ' || p.nom, c.raison_sociale) as nom
               from public.ep_profils p join auth.users au on au.id = p.id
               where p.compte_id = c.id and p.role = 'client_gerant' and p.actif loop
        perform public.ep_notifier('email', u.email, u.nom, v_sujet, v_texte, v_lien, p_lead, 'enquete_installateur');
      end loop;
    end if;
  end if;
  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'enquete', l.statut, l.compte_id, auth.uid(), jsonb_build_object('cible', p_cible));
end $$;

create function public.ep_envoyer_enquete(p_lead uuid, p_cible text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_peut_gerer_leads() then raise exception 'Seul le Lead Manager peut envoyer une enquête' using errcode = '42501'; end if;
  if p_cible not in ('client', 'installateur') then raise exception 'Cible inconnue'; end if;
  perform public.ep_creer_enquete(p_lead, p_cible);
end $$;

-- Page publique de l'enquête (sans connexion, accès par jeton)
create function public.ep_enquete_publique(p_jeton uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'cible', e.cible, 'reference', l.reference, 'projet', l.projet, 'ville', l.ville,
    'installateur', c.raison_sociale, 'repondue', e.repondue_le is not null
  )
  from public.ep_lead_enquetes e
  join public.ep_leads l on l.id = e.lead_id
  left join public.ep_comptes c on c.id = e.compte_id
  where e.jeton = p_jeton
$$;

create function public.ep_repondre_enquete(p_jeton uuid, p_note integer, p_commentaire text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare e public.ep_lead_enquetes;
begin
  if p_note is null or p_note not between 0 and 10 then raise exception 'Choisissez une note entre 0 et 10'; end if;
  select * into e from public.ep_lead_enquetes where jeton = p_jeton for update;
  if e.id is null then raise exception 'Enquête introuvable'; end if;
  if e.repondue_le is not null then raise exception 'Vous avez déjà répondu, merci !'; end if;
  update public.ep_lead_enquetes set note = p_note, commentaire = nullif(left(trim(p_commentaire), 2000), ''), repondue_le = now() where id = e.id;
end $$;

-- ── Statistiques ────────────────────────────────────────────────────
create function public.ep_nps(p_cible text, p_depuis timestamptz, p_compte uuid default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'reponses', count(*),
    'envoyees', (select count(*) from public.ep_lead_enquetes x where x.cible = p_cible and x.envoyee_le >= p_depuis and (p_compte is null or x.compte_id = p_compte)),
    'promoteurs', count(*) filter (where note >= 9),
    'passifs', count(*) filter (where note between 7 and 8),
    'detracteurs', count(*) filter (where note <= 6),
    'score', case when count(*) = 0 then null
                  else round(100.0 * (count(*) filter (where note >= 9) - count(*) filter (where note <= 6)) / count(*)) end
  )
  from public.ep_lead_enquetes
  where cible = p_cible and repondue_le >= p_depuis and (p_compte is null or compte_id = p_compte)
$$;

create function public.ep_stats_lead_manager(p_jours integer default 30) returns jsonb
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
        select c.raison_sociale nom, c.niveau_iap niveau,
               count(distinct x.lead_id) filter (where x.type in ('attribution', 'reattribution')) recus,
               count(distinct x.lead_id) filter (where x.type = 'acceptation') acceptes,
               count(*) filter (where x.type = 'refus') refus,
               count(*) filter (where x.type = 'reattribution_auto') expires,
               (select count(*) from public.ep_leads y where y.compte_id = c.id and y.statut in ('signe', 'pose') and y.recu_le >= v_depuis) signes,
               (select (public.ep_nps('client', v_depuis, c.id)) ->> 'score') nps
        from e x join public.ep_comptes c on c.id = x.compte_id
        group by c.id, c.raison_sociale, c.niveau_iap
        order by 3 desc limit 30) z),
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

-- Indicateurs de l'installateur connecté
create function public.ep_stats_pro(p_jours integer default 365) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_compte uuid := public.ep_mon_compte(); v_depuis timestamptz := now() - make_interval(days => greatest(p_jours, 1)); r jsonb;
begin
  if v_compte is null then return null; end if;
  select jsonb_build_object(
    'recus', count(distinct e.lead_id) filter (where e.type in ('attribution', 'reattribution')),
    'acceptes', count(distinct e.lead_id) filter (where e.type = 'acceptation'),
    'refus', count(*) filter (where e.type = 'refus'),
    'expires', count(*) filter (where e.type = 'reattribution_auto'),
    'temps_reponse_min', (select round(extract(epoch from avg(accepte_le - attribue_le)) / 60) from public.ep_leads where compte_id = v_compte and not cree_par_pro and accepte_le >= v_depuis),
    'termines', (select count(*) from public.ep_leads where compte_id = v_compte and statut in ('signe', 'pose') and recu_le >= v_depuis),
    'nps', (public.ep_nps('client', v_depuis, v_compte)) -> 'score'
  ) into r
  from public.ep_lead_evenements e where e.compte_id = v_compte and e.cree_le >= v_depuis;
  return r;
end $$;

-- Entonnoir : étapes rendez-vous et posé
create or replace function public.ep_leads_entonnoir(p_jours integer default 30, p_source text default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with l as (
    select id, statut, attribue_le, accepte_le
    from public.ep_leads
    where recu_le > now() - make_interval(days => greatest(p_jours, 1))
      and (p_source is null or source::text = p_source)
  ),
  r as (
    select l.id, l.statut = 'perdu' as perdu, greatest(
      case when l.attribue_le is not null then 1 else 0 end,
      case when l.accepte_le is not null then 2 else 0 end,
      case l.statut::text when 'attribue' then 1 when 'accepte' then 2 when 'contacte' then 3 when 'rdv' then 4 when 'devis' then 5 when 'signe' then 6 when 'pose' then 7 else 0 end,
      coalesce((select max(case e.statut::text when 'attribue' then 1 when 'accepte' then 2 when 'contacte' then 3 when 'rdv' then 4 when 'devis' then 5 when 'signe' then 6 when 'pose' then 7 else 0 end)
                from public.ep_lead_evenements e where e.lead_id = l.id), 0)
    ) as rang
    from l
  )
  select jsonb_build_object(
    'recus', count(*),
    'attribues', count(*) filter (where rang >= 1),
    'acceptes', count(*) filter (where rang >= 2),
    'contactes', count(*) filter (where rang >= 3),
    'rdv', count(*) filter (where rang >= 4),
    'devis', count(*) filter (where rang >= 5),
    'signes', count(*) filter (where rang >= 6),
    'poses', count(*) filter (where rang >= 7),
    'perdus', count(*) filter (where perdu)
  ) from r
$$;

create or replace function public.ep_accueil_recap() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'leads_a_valider', (select count(*) from public.ep_leads where statut = 'a_valider'),
    'leads_a_accepter', (select count(*) from public.ep_leads where statut = 'attribue'),
    'leads_en_suivi', (select count(*) from public.ep_leads where statut in ('accepte', 'contacte', 'rdv', 'devis')),
    'sav_ouverts', (select count(*) from public.ep_sav_demandes where statut not in ('resolue', 'cloturee')),
    'sav_reponse_attendue', (select count(*) from public.ep_sav_demandes where statut = 'infos_demandees'),
    'sav_nouveaux', (select count(*) from public.ep_sav_demandes where statut = 'nouvelle'),
    'commandes_a_valider', (select count(*) from public.ep_commandes where statut = 'a_valider'),
    'configurations_devis', (select count(*) from public.ep_configurations where statut = 'devis'),
    'visites_aujourdhui', (select count(*) from public.ep_activites
                            where statut = 'planifiee' and (date_prevue at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date),
    'actions_en_retard', (select count(*) from public.ep_actions where statut = 'a_faire' and echeance < (now() at time zone 'Europe/Paris')::date),
    'points', public.ep_solde_points(null)
  )
$$;

-- Les colonnes nominatives n'étant plus lisibles, plus de « select * » côté appelant
create or replace function public.ep_stats_leads(p_jours integer default 30) returns jsonb
language sql stable set search_path = '' as $$
  with l as (select statut, recu_le, attribue_le, accepte_le from public.ep_leads where recu_le > now() - make_interval(days => p_jours))
  select jsonb_build_object(
    'recus', (select count(*) from l),
    'a_valider', (select count(*) from public.ep_leads where statut = 'a_valider'),
    'sans_pro', (select count(*) from public.ep_leads where statut = 'a_valider' and suggestion_compte_id is null),
    'en_attente_pro', (select count(*) from public.ep_leads where statut = 'attribue'),
    'delai_moyen_min', (select round(extract(epoch from avg(accepte_le - recu_le)) / 60) from l where accepte_le is not null),
    'acceptes_24h_pct', (select round(100.0 * count(*) filter (where accepte_le - recu_le <= interval '24 hours') / nullif(count(*) filter (where attribue_le is not null), 0)) from l),
    'transformation_pct', (select round(100.0 * count(*) filter (where statut in ('signe', 'pose')) / nullif(count(*) filter (where statut not in ('a_valider', 'attribue')), 0)) from l),
    'statut_renseigne_pct', (select round(100.0 * count(*) filter (where statut not in ('a_valider', 'attribue', 'accepte')) / nullif(count(*) filter (where statut not in ('a_valider', 'attribue')), 0)) from l),
    'par_statut', (select coalesce(jsonb_object_agg(statut, n), '{}') from (select statut, count(*) n from l group by statut) s)
  )
$$;

-- ── Administration : contacts et remise d'un installateur ───────────
create function public.ep_admin_contacts_leads(p_compte uuid, p_email text, p_telephone text, p_remise_pct numeric default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if p_email is not null and trim(p_email) <> '' and trim(p_email) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Adresse e-mail invalide'; end if;
  update public.ep_comptes set email_leads = nullif(lower(trim(p_email)), ''), telephone_leads = nullif(trim(p_telephone), '') where id = p_compte;
  if p_remise_pct is null then
    delete from public.ep_lead_tarifs_comptes where compte_id = p_compte;
  else
    if p_remise_pct not between 0 and 100 then raise exception 'La remise doit être comprise entre 0 et 100 %%'; end if;
    insert into public.ep_lead_tarifs_comptes (compte_id, remise_pct, maj_par) values (p_compte, p_remise_pct, auth.uid())
    on conflict (compte_id) do update set remise_pct = excluded.remise_pct, maj_le = now(), maj_par = auth.uid();
  end if;
end $$;

-- ── Droits d'exécution ──────────────────────────────────────────────
revoke execute on function
  public.ep_lead_visible(public.ep_leads), public.ep_leads_coordonnees(uuid[]), public.ep_facturer_lead(uuid),
  public.ep_notifier(text, text, text, text, text, text, uuid, text), public.ep_notifier_attribution(uuid, boolean),
  public.ep_notifications_a_envoyer(integer), public.ep_notification_resultat(bigint, boolean, text),
  public.ep_remettre_en_file(uuid, text, jsonb), public.ep_expirer_leads(),
  public.ep_changer_statut_lead(uuid, public.ep_lead_statut, text, text),
  public.ep_qualifier_lead(uuid, text, text, text, text, text), public.ep_annuler_lead(uuid, boolean, text),
  public.ep_valider_commande_lead(uuid, text),
  public.ep_creer_lead(public.ep_lead_source, text, text, text, text, text, text, text, text, text),
  public.ep_modifier_lead(uuid, text, text, text, text, text, text, boolean, text, text, text),
  public.ep_commenter_lead(uuid, text), public.ep_creer_enquete(uuid, text), public.ep_envoyer_enquete(uuid, text),
  public.ep_enquete_publique(uuid), public.ep_repondre_enquete(uuid, integer, text),
  public.ep_nps(text, timestamptz, uuid), public.ep_stats_lead_manager(integer), public.ep_stats_pro(integer),
  public.ep_admin_contacts_leads(uuid, text, text, numeric)
from public, anon;
revoke execute on function
  public.ep_lead_visible(public.ep_leads), public.ep_facturer_lead(uuid),
  public.ep_notifier(text, text, text, text, text, text, uuid, text), public.ep_notifier_attribution(uuid, boolean),
  public.ep_remettre_en_file(uuid, text, jsonb), public.ep_creer_enquete(uuid, text), public.ep_nps(text, timestamptz, uuid)
from authenticated;
grant execute on function
  public.ep_leads_coordonnees(uuid[]), public.ep_notifications_a_envoyer(integer), public.ep_notification_resultat(bigint, boolean, text),
  public.ep_expirer_leads(), public.ep_changer_statut_lead(uuid, public.ep_lead_statut, text, text),
  public.ep_qualifier_lead(uuid, text, text, text, text, text), public.ep_annuler_lead(uuid, boolean, text),
  public.ep_valider_commande_lead(uuid, text),
  public.ep_creer_lead(public.ep_lead_source, text, text, text, text, text, text, text, text, text),
  public.ep_modifier_lead(uuid, text, text, text, text, text, text, boolean, text, text, text),
  public.ep_commenter_lead(uuid, text), public.ep_envoyer_enquete(uuid, text),
  public.ep_stats_lead_manager(integer), public.ep_stats_pro(integer), public.ep_admin_contacts_leads(uuid, text, text, numeric)
to authenticated;
grant execute on function public.ep_enquete_publique(uuid), public.ep_repondre_enquete(uuid, integer, text) to anon, authenticated;
