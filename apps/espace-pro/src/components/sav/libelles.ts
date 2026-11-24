/** Libellés et correspondances du module SAV (partagés serveur et navigateur). */

export type SavType = "reclamation_garantie" | "pieces_detachees" | "assistance_technique" | "livraison_litige";
export type SavStatut = "nouvelle" | "en_analyse" | "infos_demandees" | "avis_technique" | "decision" | "en_resolution" | "resolue" | "cloturee";
export type SavDecision = "garantie_acceptee" | "garantie_refusee" | "geste_commercial";
export type SavResolution = "piece_envoyee" | "retour_produit" | "remplacement" | "avoir";

export const TYPES: Record<SavType, { label: string; aide: string }> = {
  reclamation_garantie: { label: "Réclamation ou garantie", aide: "Défaut, casse ou dysfonctionnement d’un produit posé ou livré" },
  pieces_detachees: { label: "Pièces détachées", aide: "Cylindre, gâche, joint, paumelle ou autre pièce à remplacer" },
  assistance_technique: { label: "Assistance technique", aide: "Aide à la pose, au réglage, question au bureau d’études" },
  livraison_litige: { label: "Livraison ou litige", aide: "Colis abîmé, erreur de référence, produit manquant" },
};

export const STATUTS: Record<SavStatut, { label: string; variant: "neutral" | "accent" | "success" | "warning" | "danger"; client: string }> = {
  nouvelle: { label: "Nouvelle", variant: "accent", client: "Votre demande a été transmise au service SAV." },
  en_analyse: { label: "En analyse", variant: "accent", client: "Le service SAV analyse votre demande." },
  infos_demandees: { label: "Informations demandées", variant: "warning", client: "Le service SAV attend une réponse de votre part." },
  avis_technique: { label: "Avis technique", variant: "neutral", client: "Votre demande est étudiée par nos équipes techniques." },
  decision: { label: "Décision", variant: "accent", client: "Une décision est en cours." },
  en_resolution: { label: "En cours de résolution", variant: "accent", client: "La solution est en cours de mise en œuvre." },
  resolue: { label: "Résolue", variant: "success", client: "Votre demande est résolue." },
  cloturee: { label: "Clôturée", variant: "neutral", client: "Votre demande est clôturée." },
};

/** Étapes de la frise de suivi. */
export const ETAPES: { cle: SavStatut[]; label: string }[] = [
  { cle: ["nouvelle"], label: "Déposée" },
  { cle: ["en_analyse", "infos_demandees", "avis_technique"], label: "Analyse" },
  { cle: ["decision", "en_resolution"], label: "Prise en charge" },
  { cle: ["resolue", "cloturee"], label: "Résolue" },
];

export const DECISIONS: Record<SavDecision, string> = {
  garantie_acceptee: "Garantie acceptée",
  garantie_refusee: "Garantie refusée",
  geste_commercial: "Geste commercial",
};

export const RESOLUTIONS: Record<SavResolution, string> = {
  piece_envoyee: "Pièce envoyée",
  retour_produit: "Retour produit",
  remplacement: "Remplacement",
  avoir: "Avoir",
};

export const CAUSES = ["Défaut de fabrication", "Défaut fournisseur", "Transport", "Erreur de préparation", "Pose non conforme", "Usure normale"];

export const GAMMES = ["Altitude", "Horizon", "Quartz", "Cylindres", "Serrures multipoints", "Autre"];

export const ROLES_TRAITEMENT = ["admin", "sav"];
export const ROLES_LECTURE_GLOBALE = ["admin", "codir", "chef_service", "chef_marche", "sav", "qualite"];
export const ROLES_DECLARATION = ["admin", "sav", "atc", "client_gerant", "client_equipe"];
