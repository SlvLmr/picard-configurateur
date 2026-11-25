/** Questionnaires : types de questions et calcul des résultats. */
export type TypeQuestion = "note" | "nps" | "choix" | "choix_multiple" | "texte";
export type Question = { id: string; type: TypeQuestion; libelle: string; options: string[]; obligatoire: boolean };
export type Reponses = Record<string, number | string | string[]>;

export const TYPES_QUESTION: Record<TypeQuestion, { label: string; aide: string }> = {
  note: { label: "Note de 1 à 5", aide: "Une note en étoiles" },
  nps: { label: "Recommandation de 0 à 10", aide: "Calcule un score de recommandation (NPS)" },
  choix: { label: "Choix unique", aide: "Une seule réponse parmi des options" },
  choix_multiple: { label: "Choix multiple", aide: "Plusieurs réponses possibles" },
  texte: { label: "Réponse libre", aide: "Un commentaire écrit" },
};

/** Score NPS : part des promoteurs (9-10) moins part des détracteurs (0-6). */
export function scoreNps(notes: number[]) {
  if (!notes.length) return null;
  const promoteurs = notes.filter((n) => n >= 9).length;
  const detracteurs = notes.filter((n) => n <= 6).length;
  return Math.round(((promoteurs - detracteurs) / notes.length) * 100);
}
