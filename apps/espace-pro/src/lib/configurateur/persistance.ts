/**
 * Passage entre la configuration de l'interface et sa forme enregistrée (jsonb),
 * et désignation lisible pour le devis.
 */
import {
  CONFIGURATION_INITIALE,
  FINITIONS,
  MODELES,
  OPTIONS,
  POSES,
  SECURITES,
  finition,
  modele,
  type Configuration,
} from "./catalogue";

const dans = <T extends string>(valeur: unknown, valides: readonly T[], defaut: T): T =>
  typeof valeur === "string" && (valides as readonly string[]).includes(valeur) ? (valeur as T) : defaut;

/** Reconstruit une configuration valide à partir des données enregistrées (valeurs inconnues ignorées). */
export function depuisDonnees(donnees: unknown): Configuration {
  const d = (donnees && typeof donnees === "object" ? donnees : {}) as Record<string, unknown>;
  const base = CONFIGURATION_INITIALE;
  const nombre = (v: unknown, defaut: number) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : defaut);
  return {
    reference: typeof d.reference === "string" ? d.reference : base.reference,
    clientFinal: typeof d.clientFinal === "string" ? d.clientFinal : base.clientFinal,
    modele: dans(d.modele, MODELES.map((m) => m.id), base.modele),
    pose: dans(d.pose, POSES.map((p) => p.id), base.pose),
    largeur: nombre(d.largeur, base.largeur),
    hauteur: nombre(d.hauteur, base.hauteur),
    sens: dans(d.sens, ["poussant", "tirant"] as const, base.sens),
    main: dans(d.main, ["gauche", "droite"] as const, base.main),
    securite: dans(d.securite, SECURITES.map((s) => s.id), base.securite),
    finitionExterieure: dans(d.finitionExterieure, FINITIONS.map((f) => f.id), base.finitionExterieure),
    finitionInterieure: dans(d.finitionInterieure, FINITIONS.map((f) => f.id), base.finitionInterieure),
    options: Array.isArray(d.options) ? d.options.filter((o): o is Configuration["options"][number] => OPTIONS.some((x) => x.id === o)) : [],
  };
}

/** Lignes de désignation du devis client (sans aucun prix d'achat). */
export function designation(c: Configuration): { titre: string; details: string[] } {
  const m = modele(c.modele);
  const pose = POSES.find((p) => p.id === c.pose)!;
  const securite = SECURITES.find((s) => s.id === c.securite)!;
  const options = c.options.map((id) => OPTIONS.find((o) => o.id === id)!.nom);
  return {
    titre: `Fourniture et pose d’une porte blindée ${m.nom}, certifiée ${securite.nom}`,
    details: [
      m.usage,
      `Pose : ${pose.nom.toLowerCase()} (${pose.detail.toLowerCase()})`,
      `Dimensions du tableau : ${c.largeur} × ${c.hauteur} mm`,
      `Ouverture : ${c.sens} ${c.main}`,
      `Sécurité : ${securite.nom}, ${securite.detail.toLowerCase()}, serrure multipoints 5 points et cylindre certifié`,
      `Finition côté palier : ${finition(c.finitionExterieure).nom}`,
      `Finition côté intérieur : ${finition(c.finitionInterieure).nom}`,
      ...(options.length ? [`Équipements : ${options.join(", ")}`] : []),
    ],
  };
}
