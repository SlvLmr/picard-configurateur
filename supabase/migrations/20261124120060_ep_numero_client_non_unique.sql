-- Un même numéro client peut couvrir plusieurs agences : pas d'unicité.
alter table public.ep_comptes drop constraint ep_comptes_numero_client_key;
create index ep_comptes_numero_client_idx on public.ep_comptes (numero_client);
