-- Espace Pro : rôles du SAV.
-- Seule dans sa migration : une valeur ajoutée à un type énuméré
-- ne peut pas être utilisée dans la même transaction.
alter type public.ep_role add value if not exists 'sav';
alter type public.ep_role add value if not exists 'bureau_etudes';
alter type public.ep_role add value if not exists 'qualite';
