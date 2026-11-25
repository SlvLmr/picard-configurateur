-- Pilotage du marketing digital : indicateurs mensuels par canal (Google Ads, site, SEO, GEO)
create table if not exists public.ep_digital_mesures (
  mois date not null check (extract(day from mois) = 1),
  canal text not null check (canal in ('ads', 'site', 'seo', 'geo')),
  indicateur text not null check (char_length(indicateur) between 1 and 60),
  valeur numeric not null,
  maj_le timestamptz not null default now(),
  maj_par uuid references auth.users (id) on delete set null,
  primary key (mois, canal, indicateur)
);
alter table public.ep_digital_mesures enable row level security;
create policy ep_digital_lecture on public.ep_digital_mesures for select to authenticated using (public.ep_est_interne());
revoke insert, update, delete on public.ep_digital_mesures from anon, authenticated;

-- Saisie d'un mois : { "ads": { "budget": 1200, … }, … } ; une valeur nulle efface l'indicateur
create or replace function public.ep_admin_digital(p_mois date, p_mesures jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare c text; i text; v jsonb;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  for c in select jsonb_object_keys(p_mesures) loop
    for i, v in select * from jsonb_each(p_mesures -> c) loop
      if v is null or jsonb_typeof(v) = 'null' then
        delete from public.ep_digital_mesures where mois = date_trunc('month', p_mois)::date and canal = c and indicateur = i;
      else
        insert into public.ep_digital_mesures (mois, canal, indicateur, valeur, maj_par)
        values (date_trunc('month', p_mois)::date, c, i, (v #>> '{}')::numeric, auth.uid())
        on conflict (mois, canal, indicateur) do update set valeur = excluded.valeur, maj_le = now(), maj_par = excluded.maj_par;
      end if;
    end loop;
  end loop;
end $$;
revoke all on function public.ep_admin_digital(date, jsonb) from public, anon;
grant execute on function public.ep_admin_digital(date, jsonb) to authenticated;

insert into public.ep_droits (module, role, autorise, niveaux)
select 'digital', r::public.ep_role, r in ('admin', 'codir', 'chef_marche'), '{}'
from unnest(array['admin', 'codir', 'chef_service', 'chef_marche', 'atc', 'repartiteur', 'client_gerant', 'client_equipe', 'sav', 'bureau_etudes', 'qualite']) as r
on conflict (module, role) do nothing;
