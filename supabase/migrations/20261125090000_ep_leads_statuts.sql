-- ════════════════════════════════════════════════════════════════════
-- Espace Pro : nouveaux statuts et nouvelle source de lead.
-- Migration séparée : une valeur d'énumération ajoutée ne peut être
-- utilisée qu'après validation de la transaction qui l'a créée.
-- ════════════════════════════════════════════════════════════════════

alter type public.ep_lead_statut add value if not exists 'rdv' after 'contacte';
alter type public.ep_lead_statut add value if not exists 'pose' after 'signe';
alter type public.ep_lead_source add value if not exists 'Installateur';
