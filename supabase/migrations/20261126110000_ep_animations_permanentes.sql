-- Animations : offres permanentes (sans date de fin) et démonstrations recalées sur 2027
alter table public.ep_animations alter column fin drop not null;

create or replace function public.ep_admin_enregistrer_animation(
  p_id uuid, p_type text, p_titre text, p_accroche text, p_description text, p_conditions text,
  p_debut date, p_fin date, p_montant numeric default null, p_points integer default null,
  p_produits text default null, p_lien_kit text default null, p_niveaux public.ep_niveau_iap[] default '{}', p_publie boolean default true
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_titre), '') = '' then raise exception 'Le titre est obligatoire'; end if;
  if p_debut is null or (p_fin is not null and p_fin < p_debut) then raise exception 'Vérifiez les dates de début et de fin'; end if;
  if p_id is null then
    insert into public.ep_animations (type, titre, accroche, description, conditions, debut, fin, montant, points, produits, lien_kit, niveaux, publie, cree_par)
    values (p_type, trim(p_titre), nullif(trim(p_accroche), ''), nullif(trim(p_description), ''), nullif(trim(p_conditions), ''), p_debut, p_fin,
            p_montant, p_points, nullif(trim(p_produits), ''), nullif(trim(p_lien_kit), ''), coalesce(p_niveaux, '{}'), p_publie, auth.uid())
    returning id into v_id;
  else
    update public.ep_animations set type = p_type, titre = trim(p_titre), accroche = nullif(trim(p_accroche), ''), description = nullif(trim(p_description), ''),
      conditions = nullif(trim(p_conditions), ''), debut = p_debut, fin = p_fin, montant = p_montant, points = p_points,
      produits = nullif(trim(p_produits), ''), lien_kit = nullif(trim(p_lien_kit), ''), niveaux = coalesce(p_niveaux, '{}'), publie = p_publie, demo = false
    where id = p_id returning id into v_id;
  end if;
  return v_id;
end $$;

-- Les règles de participation comparent current_date > fin : une fin vide ne bloque jamais (offre permanente).

update public.ep_animations set debut = '2027-01-01', fin = null where demo and type = 'parrainage';
update public.ep_animations set debut = '2027-01-04', fin = '2027-02-28' where demo and type = 'remboursement';
update public.ep_animations set debut = '2027-03-01', fin = '2027-03-31' where demo and type = 'offre';
