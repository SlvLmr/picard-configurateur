-- ════════════════════════════════════════════════════════════════════
-- Inscriptions : en plus des deux adresses déjà autorisées (outil Commerce),
-- accepter les adresses invitées depuis l'Espace Pro (invitation non utilisée).
-- Aucune autre adresse ne peut créer de compte.
-- ════════════════════════════════════════════════════════════════════
create or replace function public.inscriptions_reservees()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.email not in ('gdaillere@picard-serrures.com', 'slamour@picard-serrures.com')
     and not exists (
       select 1 from public.ep_invitations i
       where i.email = lower(new.email) and i.utilisee_le is null
     ) then
    raise exception 'Inscriptions fermées';
  end if;
  return new;
end $function$;
