-- Zoning : départements de chaque secteur commercial, par force de vente.
-- Les secteurs et leurs commerciaux viennent de la table affectations (outil Commerce, non modifiée).
create table if not exists public.ep_secteurs (
  force text not null,
  code text not null,
  nom text not null,
  departements text[] not null default '{}',
  maj_le timestamptz not null default now(),
  maj_par uuid references auth.users (id) on delete set null,
  primary key (force, code)
);
alter table public.ep_secteurs enable row level security;
create policy ep_secteurs_lecture on public.ep_secteurs for select to authenticated using (true);
revoke insert, update, delete on public.ep_secteurs from anon, authenticated;

insert into public.ep_secteurs (force, code, nom)
select distinct a.force, a.secteur,
  case a.secteur
    when 'nord' then 'Nord' when 'est' then 'Est' when 'ouest' then 'Ouest' when 'grandouest' then 'Grand Ouest'
    when 'centre' then 'Centre' when 'idf' then 'Île-de-France' when 'idfe' then 'Île-de-France Est' when 'idfo' then 'Île-de-France Ouest'
    when 'med' then 'Méditerranée' when 'paca' then 'PACA' when 'ra' then 'Rhône-Alpes' when 'so' then 'Sud-Ouest'
    when 'dom' then 'DOM' when 'benelux' then 'Benelux' else initcap(a.secteur) end
from public.affectations a
on conflict (force, code) do nothing;

-- Enregistre le découpage d'une force : { "code secteur": ["75", "92", …] } ; un département n'appartient qu'à un secteur
create or replace function public.ep_admin_zoning(p_force text, p_zoning jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare k text;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  for k in select jsonb_object_keys(p_zoning) loop
    update public.ep_secteurs
       set departements = coalesce((select array_agg(distinct v order by v) from jsonb_array_elements_text(p_zoning -> k) v), '{}'),
           maj_le = now(), maj_par = auth.uid()
     where force = p_force and code = k;
  end loop;
  if exists (
    select d from public.ep_secteurs s, unnest(s.departements) d where s.force = p_force group by d having count(*) > 1
  ) then raise exception 'Un département ne peut appartenir qu’à un seul secteur'; end if;
end $$;
revoke all on function public.ep_admin_zoning(text, jsonb) from public, anon;
grant execute on function public.ep_admin_zoning(text, jsonb) to authenticated;

-- Secteur et commercial d'un département pour une force donnée (sert aux suggestions d'attribution)
create or replace function public.ep_secteur_du_departement(p_departement text, p_force text default 'serruriers')
returns table (code text, nom text, commercial_id uuid)
language sql stable security definer set search_path = '' as $$
  select s.code, s.nom,
    (select a.commercial_id from public.affectations a where a.force = s.force and a.secteur = s.code order by a.ordre limit 1)
  from public.ep_secteurs s
  where s.force = p_force and p_departement = any (s.departements)
  limit 1
$$;
revoke all on function public.ep_secteur_du_departement(text, text) from public, anon;
grant execute on function public.ep_secteur_du_departement(text, text) to authenticated;
