-- Messages : photos jointes aux annonces, ouvertes en visionneuse
alter table public.ep_annonces add column if not exists photos text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ep-annonces', 'ep-annonces', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'])
on conflict (id) do nothing;

-- Dépôt et gestion réservés à l'administrateur
create policy ep_annonces_photos_depot on storage.objects for insert to authenticated
  with check (bucket_id = 'ep-annonces' and public.ep_est_admin());
create policy ep_annonces_photos_suppression on storage.objects for delete to authenticated
  using (bucket_id = 'ep-annonces' and public.ep_est_admin());
-- Lecture : l'administrateur, ou quiconque voit l'annonce (les règles d'accès de ep_annonces s'appliquent à la sous-requête)
create policy ep_annonces_photos_lecture on storage.objects for select to authenticated
  using (bucket_id = 'ep-annonces' and (public.ep_est_admin() or exists (select 1 from public.ep_annonces a where objects.name = any (a.photos) and not a.archivee)));

drop function if exists public.ep_publier_annonce(text, text, text, text, text, public.ep_role[], public.ep_niveau_iap[], date, date, boolean);
create function public.ep_publier_annonce(
  p_titre text, p_contenu text, p_ton text default 'info', p_lien_libelle text default null, p_lien_url text default null,
  p_roles public.ep_role[] default '{}', p_niveaux public.ep_niveau_iap[] default '{}', p_debut date default current_date,
  p_fin date default null, p_epinglee boolean default false, p_photos text[] default '{}')
returns public.ep_annonces
language plpgsql security definer set search_path to ''
as $function$
declare r public.ep_annonces;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if coalesce(trim(p_titre), '') = '' or coalesce(trim(p_contenu), '') = '' then raise exception 'Le titre et le message sont obligatoires'; end if;
  if p_fin is not null and p_fin < p_debut then raise exception 'La date de fin précède la date de début'; end if;
  if coalesce(array_length(p_photos, 1), 0) > 10 then raise exception 'Dix photos au plus par message'; end if;
  insert into public.ep_annonces (titre, contenu, ton, lien_libelle, lien_url, roles, niveaux, debut, fin, epinglee, cree_par, photos)
  values (trim(p_titre), trim(p_contenu), p_ton, nullif(trim(p_lien_libelle), ''), nullif(trim(p_lien_url), ''),
          coalesce(p_roles, '{}'), coalesce(p_niveaux, '{}'), coalesce(p_debut, current_date), p_fin, p_epinglee, auth.uid(), coalesce(p_photos, '{}'))
  returning * into r;
  return r;
end $function$;
revoke all on function public.ep_publier_annonce(text, text, text, text, text, public.ep_role[], public.ep_niveau_iap[], date, date, boolean, text[]) from public, anon;
grant execute on function public.ep_publier_annonce(text, text, text, text, text, public.ep_role[], public.ep_niveau_iap[], date, date, boolean, text[]) to authenticated;
