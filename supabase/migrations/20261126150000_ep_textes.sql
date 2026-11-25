-- Textes de l'interface personnalisés par l'administrateur (titres, sous-titres…)
create table if not exists public.ep_textes (
  cle text primary key check (char_length(cle) between 1 and 200),
  valeur text not null check (char_length(valeur) between 1 and 500),
  maj_le timestamptz not null default now(),
  maj_par uuid references auth.users (id) on delete set null
);
alter table public.ep_textes enable row level security;
create policy ep_textes_lecture on public.ep_textes for select to authenticated using (true);
revoke insert, update, delete on public.ep_textes from anon, authenticated;

-- Écriture réservée à l'administrateur ; une valeur vide rétablit le texte d'origine
create or replace function public.ep_admin_texte(p_cle text, p_valeur text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_valeur), '') = '' then
    delete from public.ep_textes where cle = p_cle;
  else
    insert into public.ep_textes (cle, valeur, maj_par) values (p_cle, trim(p_valeur), auth.uid())
    on conflict (cle) do update set valeur = excluded.valeur, maj_le = now(), maj_par = excluded.maj_par;
  end if;
end $$;
revoke all on function public.ep_admin_texte(text, text) from public, anon;
grant execute on function public.ep_admin_texte(text, text) to authenticated;
