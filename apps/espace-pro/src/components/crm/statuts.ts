import type { LeadStatutDb } from "@/lib/data/types";

export const LIBELLE_STATUT: Record<LeadStatutDb, string> = {
  a_valider: "À valider",
  attribue: "En attente",
  accepte: "Accepté",
  contacte: "Contacté",
  devis: "Devis envoyé",
  signe: "Signé",
  perdu: "Perdu",
};

export const VARIANTE_STATUT: Record<LeadStatutDb, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  a_valider: "neutral",
  attribue: "warning",
  accepte: "accent",
  contacte: "accent",
  devis: "accent",
  signe: "success",
  perdu: "danger",
};

export const LIBELLE_EVENEMENT: Record<string, string> = {
  recu: "Lead reçu",
  attribution: "Lead attribué",
  acceptation: "Lead accepté",
  refus: "Lead refusé",
  statut: "Statut mis à jour",
  reattribution_auto: "Réattribué automatiquement",
};

const dateCourte = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
export const formatJour = (iso: string) => dateCourte.format(new Date(iso));
