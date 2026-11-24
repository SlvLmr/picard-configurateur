-- Correctif : conversion explicite du statut lors de l'attribution
create or replace function public.ep_attribuer_lead(p_lead uuid, p_compte uuid default null, p_commercial uuid default null)
returns public.ep_leads
language plpgsql security definer set search_path = '' as $$
declare
  moi public.ep_profils := public.ep_profil_courant();
  l public.ep_leads;
  v_compte uuid;
  v_commercial uuid;
begin
  if moi.role is null or moi.role not in ('admin', 'repartiteur') then
    raise exception 'Seuls les répartiteurs peuvent attribuer un lead' using errcode = '42501';
  end if;
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
  if v_compte is null and v_commercial is null then
    raise exception 'Choisissez un professionnel ou un commercial';
  end if;

  update public.ep_leads
     set statut = (case when v_compte is null then 'accepte' else 'attribue' end)::public.ep_lead_statut,
         compte_id = v_compte, commercial_id = v_commercial,
         attribue_le = now(), attribue_par = auth.uid(),
         accepte_le = case when v_compte is null then now() end
   where id = p_lead
  returning * into l;

  insert into public.ep_lead_evenements (lead_id, type, statut, compte_id, auteur, details)
  values (p_lead, 'attribution', l.statut, v_compte, auth.uid(), jsonb_build_object('commercial_id', v_commercial));
  return l;
end $$;

