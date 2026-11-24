import type { Seuils } from "@/lib/data/pilotage";

export type Etat = { tone: "success" | "accent" | "warning" | "danger"; label: string };

/**
 * Code couleur repris de l'outil Picard ATC (réglages) : au-dessus du seuil vert, dans l'objectif ;
 * entre jaune et vert, proche ; entre orange et jaune, en retard ; en dessous, alerte.
 */
export function etatAvancement(pct: number | null, s: Seuils): Etat {
  if (pct === null) return { tone: "accent", label: "Sans budget" };
  if (pct >= s.vert) return { tone: "success", label: "Dans l’objectif" };
  if (pct >= s.jaune) return { tone: "accent", label: "Proche" };
  if (pct >= s.orange) return { tone: "warning", label: "En retard" };
  return { tone: "danger", label: "Alerte" };
}

export const NOMS_ZONES: Record<string, string> = {
  IDF: "Île-de-France",
  NORD: "Nord",
  OUEST: "Ouest",
  RA: "Rhône-Alpes",
  PACA: "PACA",
  DOM: "DOM-TOM",
  DIR: "Direction",
};

export const nomZone = (z: string) => NOMS_ZONES[z] ?? z;
export const nomPropre = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
