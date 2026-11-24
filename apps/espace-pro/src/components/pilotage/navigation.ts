import type { Dimension } from "@/lib/data/pilotage";

export type Periode = "cumul" | "mois";
export type EtatVue = { vue: Dimension; periode: Periode; mois: number | null; cle: string | null };

/** Adresse de la page de pilotage pour un état donné (vue, période, mois, élément sélectionné). */
export function lienPilotage(etat: EtatVue, changement: Partial<EtatVue> = {}) {
  const e = { ...etat, ...changement };
  const p = new URLSearchParams();
  if (e.vue !== "societe") p.set("vue", e.vue);
  if (e.periode === "mois") p.set("periode", "mois");
  if (e.periode === "mois" && e.mois) p.set("mois", String(e.mois));
  if (e.cle) p.set("cle", e.cle);
  const q = p.toString();
  return q ? `/pilotage?${q}` : "/pilotage";
}

export function lireEtat(sp: Record<string, string | string[] | undefined>): EtatVue {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : null);
  const vue = s("vue");
  const mois = Number(s("mois"));
  return {
    vue: vue === "zone" || vue === "atc" || vue === "gamme" ? vue : "societe",
    periode: s("periode") === "mois" ? "mois" : "cumul",
    mois: mois >= 1 && mois <= 12 ? mois : null,
    cle: s("cle"),
  };
}
