import type { LeadStatutDb } from "@/lib/data/types";

/** Libellés et teintes des statuts de lead, partagés par la liste, la fiche et l'entonnoir. */
export const STATUTS_LEAD: Record<LeadStatutDb, { label: string; badge: "neutral" | "accent" | "warning" | "success" | "danger" | "officiel" }> = {
  a_valider: { label: "À valider", badge: "warning" },
  attribue: { label: "En attente du pro", badge: "officiel" },
  accepte: { label: "Accepté", badge: "accent" },
  contacte: { label: "Contacté", badge: "accent" },
  devis: { label: "Devis envoyé", badge: "accent" },
  signe: { label: "Signé", badge: "success" },
  perdu: { label: "Perdu", badge: "danger" },
};

export const SOURCES_LEAD = ["Ma Porte", "Site web", "Téléphone", "Salon"] as const;

/** Libellés de la chronologie d'un lead. */
export const EVENEMENTS_LEAD: Record<string, string> = {
  recu: "Lead reçu",
  attribution: "Attribué",
  reattribution: "Réattribué",
  reattribution_auto: "Réattribué automatiquement",
  acceptation: "Accepté par le professionnel",
  refus: "Refusé par le professionnel",
  statut: "Statut mis à jour",
  relance: "Professionnel relancé",
  note: "Note ajoutée",
  modification: "Coordonnées modifiées",
};
