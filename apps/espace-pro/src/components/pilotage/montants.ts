const nf1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 22 477 938 → « 22,48 » (à afficher avec l'unité M€) */
export const enMillions = (n: number) => nf1.format(n / 1_000_000);

/** Montant lisible : « 22,48 M€ », « 412 k€ », « 850 € » */
export function montantCourt(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${nf1.format(n / 1_000_000)} M€`;
  if (a >= 1_000) return `${nf0.format(n / 1_000)} k€`;
  return `${nf0.format(n)} €`;
}

/** Pourcentage arrondi, ou null si la base est nulle */
export const ratio = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

/** Évolution en % de a par rapport à b */
export const evolution = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);

export const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export const NOMS_GAMMES: Record<string, string> = {
  serrures: "Serrures",
  diamant: "Diamant",
  hall: "Hall",
  eliot: "Eliot",
  technica: "Technica",
};
