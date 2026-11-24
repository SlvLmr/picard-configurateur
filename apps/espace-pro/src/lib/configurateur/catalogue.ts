/**
 * Catalogue de la gamme pilote « portes blindées ».
 * Données déclaratives : elles seront remplacées par les fichiers du bureau d'études
 * (puis par une table), sans toucher au moteur de règles ni à l'interface.
 * Prix publics HT en euros, dimensions en millimètres (tableau de maçonnerie).
 */

export type ModeleId = "altitude" | "horizon" | "quartz";
export type PoseId = "renovation" | "neuf" | "applique" | "feuillure";
export type SecuriteId = "BP1" | "BP2" | "BP3";
export type FinitionId = "chene" | "noyer" | "anthracite" | "blanc" | "ral";
export type OptionId = "judas" | "seuil_pmr" | "ferme_porte" | "acoustique" | "ei30" | "anti_pince";

export type Modele = {
  id: ModeleId;
  nom: string;
  usage: string;
  prixBase: number;
  largeur: { min: number; max: number };
  hauteur: { min: number; max: number };
  securites: SecuriteId[];
};

export const MODELES: Modele[] = [
  { id: "altitude", nom: "Altitude", usage: "Porte palière d’appartement", prixBase: 2180, largeur: { min: 730, max: 1000 }, hauteur: { min: 1950, max: 2350 }, securites: ["BP1", "BP2", "BP3"] },
  { id: "horizon", nom: "Horizon", usage: "Pavillon et grandes largeurs", prixBase: 2650, largeur: { min: 800, max: 1200 }, hauteur: { min: 2000, max: 2400 }, securites: ["BP1", "BP2"] },
  { id: "quartz", nom: "Quartz", usage: "Contemporaine, haute sécurité", prixBase: 2950, largeur: { min: 730, max: 950 }, hauteur: { min: 1950, max: 2250 }, securites: ["BP2", "BP3"] },
];

export const POSES: { id: PoseId; nom: string; detail: string; prix: number }[] = [
  { id: "renovation", nom: "Rénovation", detail: "Sur le bâti existant", prix: 0 },
  { id: "neuf", nom: "Construction neuve", detail: "Bloc-porte complet", prix: 260 },
  { id: "applique", nom: "En applique", detail: "Fixée côté intérieur", prix: 180 },
  { id: "feuillure", nom: "En feuillure", detail: "Dans la maçonnerie", prix: 120 },
];

export const SECURITES: { id: SecuriteId; nom: string; detail: string; prix: number }[] = [
  { id: "BP1", nom: "A2P BP1", detail: "Résiste 5 minutes à l’effraction", prix: 0 },
  { id: "BP2", nom: "A2P BP2", detail: "Résiste 10 minutes à l’effraction", prix: 340 },
  { id: "BP3", nom: "A2P BP3", detail: "Résiste 15 minutes à l’effraction", prix: 720 },
];

export const FINITIONS: { id: FinitionId; nom: string; teinte: string; prix: number }[] = [
  { id: "chene", nom: "Chêne clair", teinte: "#d9bf94", prix: 0 },
  { id: "noyer", nom: "Noyer", teinte: "#7a5536", prix: 0 },
  { id: "anthracite", nom: "Gris anthracite", teinte: "#3d4247", prix: 0 },
  { id: "blanc", nom: "Blanc", teinte: "#f2f0ea", prix: 0 },
  { id: "ral", nom: "Laque teinte RAL", teinte: "#2563a6", prix: 190 },
];

export const OPTIONS: { id: OptionId; nom: string; detail: string; prix: number }[] = [
  { id: "judas", nom: "Judas numérique", detail: "Écran intérieur 3,5 pouces", prix: 145 },
  { id: "seuil_pmr", nom: "Seuil PMR", detail: "Seuil plat de 20 mm", prix: 90 },
  { id: "ferme_porte", nom: "Ferme-porte", detail: "À bras compas, réglable", prix: 160 },
  { id: "acoustique", nom: "Isolation acoustique", detail: "Affaiblissement de 39 dB", prix: 280 },
  { id: "ei30", nom: "Pare-flamme EI30", detail: "Résiste 30 minutes au feu", prix: 420 },
  { id: "anti_pince", nom: "Barre anti-pince", detail: "Protection côté paumelles", prix: 75 },
];

export type Configuration = {
  reference: string;
  clientFinal: string;
  modele: ModeleId;
  pose: PoseId;
  largeur: number;
  hauteur: number;
  sens: "poussant" | "tirant";
  main: "gauche" | "droite";
  securite: SecuriteId;
  finitionExterieure: FinitionId;
  finitionInterieure: FinitionId;
  options: OptionId[];
};

export const CONFIGURATION_INITIALE: Configuration = {
  reference: "",
  clientFinal: "",
  modele: "altitude",
  pose: "renovation",
  largeur: 930,
  hauteur: 2150,
  sens: "poussant",
  main: "droite",
  securite: "BP2",
  finitionExterieure: "chene",
  finitionInterieure: "blanc",
  options: [],
};

/** Remise sur le tarif public selon le niveau IAP du client. */
export const REMISES: Record<"Elite" | "Premium" | "Officiel" | "base", number> = {
  Elite: 0.32,
  Premium: 0.28,
  Officiel: 0.25,
  base: 0.2,
};

export const DELAI_BASE_SEMAINES = 5;

export const modele = (id: ModeleId) => MODELES.find((m) => m.id === id) ?? MODELES[0];
export const finition = (id: FinitionId) => FINITIONS.find((f) => f.id === id) ?? FINITIONS[0];

/** Convertit la configuration Ma Porte d'un lead (modèle, finition, cm) en configuration technique. */
export function depuisMaPorte(source: Record<string, unknown> | null, base: Configuration = CONFIGURATION_INITIALE): Configuration {
  if (!source) return base;
  const texte = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : "");
  const m = MODELES.find((x) => x.nom.toLowerCase() === texte(source.modele));
  const f = FINITIONS.find((x) => x.nom.toLowerCase() === texte(source.finition));
  const cm = (v: unknown) => (typeof v === "number" && v > 0 ? Math.round(v * 10) : null);
  return {
    ...base,
    modele: m?.id ?? base.modele,
    finitionExterieure: f?.id ?? base.finitionExterieure,
    largeur: cm(source.largeur_cm) ?? base.largeur,
    hauteur: cm(source.hauteur_cm) ?? base.hauteur,
  };
}
