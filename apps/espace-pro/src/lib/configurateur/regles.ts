import {
  DELAI_BASE_SEMAINES,
  FINITIONS,
  MODELES,
  OPTIONS,
  POSES,
  REMISES,
  SECURITES,
  modele,
  type Configuration,
  type ModeleId,
} from "./catalogue";

export type Etape = "projet" | "pose" | "dimensions" | "ouverture" | "securite" | "finitions" | "options";

/**
 * Une règle du bureau d'études, déclarative :
 * - bloquant : la configuration n'est pas fabricable, une alternative est proposée ;
 * - supplement : ajouté automatiquement au prix, avec son explication ;
 * - avertissement : à vérifier sur place, n'empêche pas de commander.
 */
export type Regle = {
  id: string;
  etape: Etape;
  niveau: "bloquant" | "supplement" | "avertissement";
  si: (c: Configuration) => boolean;
  message: (c: Configuration) => string;
  alternative?: (c: Configuration) => { label: string; appliquer: Partial<Configuration> } | null;
  supplement?: { label: string; prix: number };
  delaiSemaines?: number;
};

const modeleAcceptant = (c: Configuration, critere: (m: (typeof MODELES)[number]) => boolean): ModeleId | null =>
  MODELES.find((m) => m.id !== c.modele && critere(m))?.id ?? null;

export const REGLES: Regle[] = [
  {
    id: "largeur-hors-gamme",
    etape: "dimensions",
    niveau: "bloquant",
    si: (c) => c.largeur < modele(c.modele).largeur.min || c.largeur > modele(c.modele).largeur.max,
    message: (c) => {
      const m = modele(c.modele);
      return `Hors gamme : la largeur de ${m.nom} va de ${m.largeur.min} à ${m.largeur.max} mm.`;
    },
    alternative: (c) => {
      const autre = modeleAcceptant(c, (m) => c.largeur >= m.largeur.min && c.largeur <= m.largeur.max);
      if (autre) return { label: `Passer en ${modele(autre).nom}`, appliquer: { modele: autre } };
      const m = modele(c.modele);
      return { label: `Ramener à ${c.largeur > m.largeur.max ? m.largeur.max : m.largeur.min} mm`, appliquer: { largeur: c.largeur > m.largeur.max ? m.largeur.max : m.largeur.min } };
    },
  },
  {
    id: "hauteur-hors-gamme",
    etape: "dimensions",
    niveau: "bloquant",
    si: (c) => c.hauteur < modele(c.modele).hauteur.min || c.hauteur > modele(c.modele).hauteur.max,
    message: (c) => {
      const m = modele(c.modele);
      return `Hors gamme : la hauteur de ${m.nom} va de ${m.hauteur.min} à ${m.hauteur.max} mm.`;
    },
    alternative: (c) => {
      const autre = modeleAcceptant(c, (m) => c.hauteur >= m.hauteur.min && c.hauteur <= m.hauteur.max && c.largeur >= m.largeur.min && c.largeur <= m.largeur.max);
      if (autre) return { label: `Passer en ${modele(autre).nom}`, appliquer: { modele: autre } };
      const m = modele(c.modele);
      return { label: `Ramener à ${c.hauteur > m.hauteur.max ? m.hauteur.max : m.hauteur.min} mm`, appliquer: { hauteur: c.hauteur > m.hauteur.max ? m.hauteur.max : m.hauteur.min } };
    },
  },
  {
    id: "securite-indisponible",
    etape: "securite",
    niveau: "bloquant",
    si: (c) => !modele(c.modele).securites.includes(c.securite),
    message: (c) => `${modele(c.modele).nom} n’existe pas en ${c.securite}.`,
    alternative: (c) => {
      const autre = modeleAcceptant(c, (m) => m.securites.includes(c.securite) && c.largeur >= m.largeur.min && c.largeur <= m.largeur.max);
      if (autre) return { label: `Passer en ${modele(autre).nom}`, appliquer: { modele: autre } };
      const dispo = modele(c.modele).securites;
      return { label: `Choisir ${dispo[dispo.length - 1]}`, appliquer: { securite: dispo[dispo.length - 1] } };
    },
  },
  {
    id: "ei30-judas",
    etape: "options",
    niveau: "bloquant",
    si: (c) => c.options.includes("ei30") && c.options.includes("judas"),
    message: () => "Le judas numérique n’est pas certifié pare-flamme : il est incompatible avec l’option EI30.",
    alternative: (c) => ({ label: "Retirer le judas numérique", appliquer: { options: c.options.filter((o) => o !== "judas") } }),
  },
  {
    id: "bp3-renovation",
    etape: "securite",
    niveau: "supplement",
    si: (c) => c.securite === "BP3" && c.pose === "renovation",
    message: () => "En rénovation, le niveau BP3 impose un renfort du bâti existant.",
    supplement: { label: "Renfort de bâti", prix: 210 },
  },
  {
    id: "grande-hauteur",
    etape: "dimensions",
    niveau: "supplement",
    si: (c) => c.hauteur > 2200,
    message: () => "Au-delà de 2 200 mm, une quatrième paumelle est ajoutée.",
    supplement: { label: "Paumelle supplémentaire", prix: 95 },
  },
  {
    id: "pmr-largeur",
    etape: "options",
    niveau: "avertissement",
    si: (c) => c.options.includes("seuil_pmr") && c.largeur < 930,
    message: () => "Avec ce tableau, le passage libre sera inférieur à 83 cm : la porte ne sera pas conforme à l’accessibilité PMR.",
  },
  {
    id: "feuillure-tirant",
    etape: "ouverture",
    niveau: "avertissement",
    si: (c) => c.pose === "feuillure" && c.sens === "tirant",
    message: () => "Pose en feuillure avec ouverture tirante : vérifiez le dégagement côté palier.",
  },
  {
    id: "laque-ral",
    etape: "finitions",
    niveau: "avertissement",
    si: (c) => c.finitionExterieure === "ral" || c.finitionInterieure === "ral",
    message: () => "La laque RAL ajoute 2 semaines de fabrication.",
    delaiSemaines: 2,
  },
];

export type Evaluation = {
  bloquants: { regle: Regle; message: string; alternative: { label: string; appliquer: Partial<Configuration> } | null }[];
  supplements: { regle: Regle; message: string; label: string; prix: number }[];
  avertissements: { regle: Regle; message: string }[];
  parEtape: Partial<Record<Etape, number>>;
};

export function evaluer(c: Configuration): Evaluation {
  const e: Evaluation = { bloquants: [], supplements: [], avertissements: [], parEtape: {} };
  for (const r of REGLES) {
    if (!r.si(c)) continue;
    const message = r.message(c);
    if (r.niveau === "bloquant") {
      e.bloquants.push({ regle: r, message, alternative: r.alternative?.(c) ?? null });
      e.parEtape[r.etape] = (e.parEtape[r.etape] ?? 0) + 1;
    } else if (r.niveau === "supplement" && r.supplement) e.supplements.push({ regle: r, message, ...r.supplement });
    else e.avertissements.push({ regle: r, message });
  }
  return e;
}

export type LignePrix = { label: string; prix: number };
export type Chiffrage = {
  lignes: LignePrix[];
  prixPublic: number;
  remise: number;
  prixAchat: number;
  delaiSemaines: number;
};

export function chiffrer(c: Configuration, niveau: keyof typeof REMISES | null, evaluation = evaluer(c)): Chiffrage {
  const m = modele(c.modele);
  const pose = POSES.find((p) => p.id === c.pose)!;
  const securite = SECURITES.find((s) => s.id === c.securite)!;
  const finitions = [c.finitionExterieure, c.finitionInterieure].map((id) => FINITIONS.find((f) => f.id === id)!);
  const lignes: LignePrix[] = [
    { label: `Porte ${m.nom}`, prix: m.prixBase },
    ...(pose.prix ? [{ label: `Pose ${pose.nom.toLowerCase()}`, prix: pose.prix }] : []),
    ...(securite.prix ? [{ label: securite.nom, prix: securite.prix }] : []),
    ...finitions.filter((f) => f.prix).map((f) => ({ label: f.nom, prix: f.prix })),
    ...c.options.map((id) => OPTIONS.find((o) => o.id === id)!).map((o) => ({ label: o.nom, prix: o.prix })),
    ...evaluation.supplements.map((s) => ({ label: s.label, prix: s.prix })),
  ];
  const prixPublic = lignes.reduce((s, l) => s + l.prix, 0);
  const remise = REMISES[niveau ?? "base"];
  const delaiSemaines =
    DELAI_BASE_SEMAINES +
    (c.securite === "BP3" ? 1 : 0) +
    (c.options.includes("ei30") ? 1 : 0) +
    evaluation.avertissements.reduce((s, a) => s + (a.regle.delaiSemaines ?? 0), 0);
  return { lignes, prixPublic, remise, prixAchat: Math.round(prixPublic * (1 - remise)), delaiSemaines };
}
