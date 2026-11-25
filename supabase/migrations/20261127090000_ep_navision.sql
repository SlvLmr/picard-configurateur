-- Rapprochement des leads avec les commandes Navision (export mensuel importé par l'administrateur)
create table if not exists public.ep_navision_imports (
  id uuid primary key default gen_random_uuid(),
  fichier text not null,
  nb_lignes integer not null,
  nb_rapprochees integer not null,
  importe_par uuid references auth.users (id) on delete set null,
  importe_le timestamptz not null default now()
);
create table if not exists public.ep_navision_commandes (
  numero text primary key,
  date_commande date,
  code_client text,
  client text,
  code_lead text,
  montant_ht numeric,
  lead_id uuid references public.ep_leads (id) on delete set null,
  import_id uuid references public.ep_navision_imports (id) on delete set null,
  importe_le timestamptz not null default now()
);
create index if not exists ep_navision_commandes_lead_idx on public.ep_navision_commandes (lead_id);
alter table public.ep_navision_imports enable row level security;
alter table public.ep_navision_commandes enable row level security;
create policy ep_navision_imports_lecture on public.ep_navision_imports for select to authenticated using (public.ep_est_interne());
create policy ep_navision_commandes_lecture on public.ep_navision_commandes for select to authenticated using (public.ep_est_interne());
revoke insert, update, delete on public.ep_navision_imports, public.ep_navision_commandes from anon, authenticated;

-- Code lead lu dans l'export : « L-2400 », « l2400 » ou « 2400 » désignent le même lead
create or replace function public.ep_normaliser_code_lead(p text) returns text
language sql immutable set search_path = '' as $$
  select case when p is null or trim(p) = '' then null
              when upper(regexp_replace(trim(p), '\s', '', 'g')) ~ '^L-?[0-9]+$' then 'L-' || regexp_replace(upper(trim(p)), '[^0-9]', '', 'g')
              when trim(p) ~ '^[0-9]+$' then 'L-' || trim(p)
              else upper(trim(p)) end
$$;

-- Import : les commandes sont ajoutées ou mises à jour, puis rapprochées des leads par leur code.
-- Un lead rapproché reçoit la référence de commande et passe à « signé » s'il n'en était pas encore là.
create or replace function public.ep_admin_import_navision(p_fichier text, p_lignes jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_import uuid; v_lignes integer; v_rapprochees integer;
begin
  if not public.ep_est_admin() then raise exception 'Réservé à l’administrateur' using errcode = '42501'; end if;
  if jsonb_typeof(p_lignes) <> 'array' or jsonb_array_length(p_lignes) = 0 then raise exception 'Le fichier ne contient aucune commande'; end if;
  insert into public.ep_navision_imports (fichier, nb_lignes, nb_rapprochees, importe_par) values (coalesce(p_fichier, 'export'), 0, 0, auth.uid()) returning id into v_import;

  insert into public.ep_navision_commandes (numero, date_commande, code_client, client, code_lead, montant_ht, import_id)
  select trim(l ->> 'numero'),
         nullif(l ->> 'date', '')::date,
         nullif(trim(l ->> 'code_client'), ''),
         nullif(trim(l ->> 'client'), ''),
         public.ep_normaliser_code_lead(l ->> 'code_lead'),
         nullif(replace(replace(l ->> 'montant', ' ', ''), ',', '.'), '')::numeric,
         v_import
  from jsonb_array_elements(p_lignes) l
  where coalesce(trim(l ->> 'numero'), '') <> ''
  on conflict (numero) do update set date_commande = excluded.date_commande, code_client = excluded.code_client, client = excluded.client,
    code_lead = excluded.code_lead, montant_ht = excluded.montant_ht, import_id = excluded.import_id, importe_le = now();
  get diagnostics v_lignes = row_count;

  update public.ep_navision_commandes c set lead_id = l.id
  from public.ep_leads l
  where c.import_id = v_import and (l.reference = c.code_lead or l.reference_commande = c.numero);

  update public.ep_leads l
     set reference_commande = coalesce(l.reference_commande, c.numero),
         reference_validee_le = coalesce(l.reference_validee_le, now()),
         statut = case when l.statut in ('attribue', 'accepte', 'contacte', 'rdv', 'devis') then 'signe'::public.ep_lead_statut else l.statut end
    from public.ep_navision_commandes c
   where c.import_id = v_import and c.lead_id = l.id;

  select count(*) into v_rapprochees from public.ep_navision_commandes where import_id = v_import and lead_id is not null;
  update public.ep_navision_imports set nb_lignes = v_lignes, nb_rapprochees = v_rapprochees where id = v_import;
  return jsonb_build_object('lignes', v_lignes, 'rapprochees', v_rapprochees);
end $$;
revoke all on function public.ep_admin_import_navision(text, jsonb) from public, anon;
grant execute on function public.ep_admin_import_navision(text, jsonb) to authenticated;
