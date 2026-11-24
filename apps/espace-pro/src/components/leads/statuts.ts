import type { LeadStatutDb } from "@/lib/data/types";

/** Libellés et teintes des statuts de lead, partagés par la liste, la fiche et l'entonnoir. */
export const STATUTS_LEAD: Record<LeadStatutDb, { label: string; badge: "neutral" | "accent" | "warning" | "success" | "danger" | "officiel" }> = {
  a_valider: { label: "À valider", badge: "warning" },
  attribue: { label: "En attente de l’installateur", badge: "accent" },
  accepte: { label: "Accepté", badge: "accent" },
  contacte: { label: "Contacté", badge: "accent" },
  rdv: { label: "Rendez-vous", badge: "accent" },
  devis: { label: "Devis envoyé", badge: "accent" },
  signe: { label: "Signé", badge: "success" },
  pose: { label: "Posé", badge: "success" },
  perdu: { label: "Perdu", badge: "danger" },
};

export const TEMPERATURES = {
  froid: { label: "Froid", badge: "accent" },
  tiede: { label: "Tiède", badge: "warning" },
  chaud: { label: "Chaud", badge: "danger" },
} as const;

export const MOTIFS_REFUS = [
  "Hors de ma zone d’intervention",
  "Planning complet",
  "Projet hors de mon activité",
  "Mauvais lead (coordonnées fausses, demande non sérieuse)",
  "Autre",
];

export const MOTIFS_PERTE = [
  "Prix trop élevé",
  "Parti chez un concurrent",
  "Projet abandonné ou reporté",
  "Client injoignable",
  "Besoin non couvert par nos produits",
  "Autre",
];

/** Options de qualification proposées au Lead Manager */
export const QUALIFICATION = {
  nature: ["Remplacement", "Construction neuve", "Rénovation", "Dépannage", "Sécurisation après effraction"],
  echeance: ["Urgent (sous 15 jours)", "Moins de 3 mois", "3 à 6 mois", "Plus de 6 mois", "Non défini"],
  budget: ["Moins de 2 000 €", "2 000 à 4 000 €", "4 000 à 6 000 €", "Plus de 6 000 €", "Non communiqué"],
  typeBien: ["Maison", "Appartement", "Local professionnel", "Copropriété (parties communes)"],
};

/** Température suggérée à partir de la qualification (le Lead Manager garde la main). */
export function temperatureSuggeree(echeance: string, budget: string, nature: string): "froid" | "tiede" | "chaud" {
  let score = 0;
  if (echeance.startsWith("Urgent")) score += 3;
  else if (echeance.startsWith("Moins de 3")) score += 2;
  else if (echeance.startsWith("3 à 6")) score += 1;
  if (budget.startsWith("4 000") || budget.startsWith("Plus de")) score += 2;
  else if (budget.startsWith("2 000")) score += 1;
  if (nature === "Dépannage" || nature.startsWith("Sécurisation")) score += 2;
  return score >= 4 ? "chaud" : score >= 2 ? "tiede" : "froid";
}

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
  qualification: "Lead qualifié",
  annulation: "Lead annulé",
  creation_pro: "Créé par l’installateur",
  commentaire: "Commentaire",
  commande: "Commande rattachée",
  enquete: "Enquête de satisfaction envoyée",
};
