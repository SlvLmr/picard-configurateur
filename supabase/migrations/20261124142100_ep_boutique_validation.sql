-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : validation des commandes boutique de plus de 300 €
-- Par l'administrateur ou un chef de marché. Un refus annule la commande,
-- remet le stock et rend les points éventuellement utilisés ;
-- l'enveloppe du commercial est libérée (les commandes annulées n'y comptent pas).
-- ════════════════════════════════════════════════════════════════════

alter table public.ep_commandes
  add column decision_motif text,
  add column decide_par uuid references auth.users (id) on delete set null,
  add column decide_le timestamptz;

create function public.ep_valider_commande(p_commande uuid, p_valider boolean, p_motif text default null)
returns public.ep_commandes
language plpgsql security definer set search_path = '' as $$
declare
  moi public.ep_profils := public.ep_profil_courant();
  c public.ep_commandes;
  l record;
begin
  if moi.role is null or moi.role not in ('admin', 'chef_marche') then
    raise exception 'Seuls l’administrateur et les chefs de marché valident les commandes' using errcode = '42501';
  end if;
  select * into c from public.ep_commandes where id = p_commande for update;
  if c.id is null then raise exception 'Commande introuvable'; end if;
  if c.statut <> 'a_valider' then raise exception 'Cette commande n’est plus en attente de validation'; end if;
  if not p_valider and coalesce(trim(p_motif), '') = '' then raise exception 'Indiquez le motif du refus'; end if;

  if p_valider then
    update public.ep_commandes
       set statut = 'validee', decision_motif = nullif(trim(p_motif), ''), decide_par = auth.uid(), decide_le = now()
     where id = p_commande returning * into c;
  else
    update public.ep_commandes
       set statut = 'annulee', decision_motif = trim(p_motif), decide_par = auth.uid(), decide_le = now()
     where id = p_commande returning * into c;
    -- Remise en stock
    for l in select produit_id, quantite from public.ep_commande_lignes where commande_id = p_commande loop
      update public.ep_produits set stock = stock + l.quantite where id = l.produit_id;
    end loop;
    -- Points rendus
    if c.points_utilises > 0 and c.compte_id is not null then
      insert into public.ep_points (compte_id, points, motif) values (c.compte_id, c.points_utilises, 'Commande ' || c.reference || ' refusée : points rendus');
    end if;
  end if;
  return c;
end $$;

revoke execute on function public.ep_valider_commande(uuid, boolean, text) from public, anon;
grant execute on function public.ep_valider_commande(uuid, boolean, text) to authenticated;
