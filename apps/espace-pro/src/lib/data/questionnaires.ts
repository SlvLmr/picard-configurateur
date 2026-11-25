import "server-only";
import type { Question, Reponses } from "@/lib/questionnaires";
import { supabaseServeur } from "@/lib/supabase/server";

export type Questionnaire = {
  id: string; titre: string; description: string | null; questions: Question[]; cible: string;
  statut: "brouillon" | "ouvert" | "clos"; ouvertLe: string | null; closLe: string | null; majLe: string;
};
export type ReponseQuestionnaire = { questionnaireId: string; profilId: string; reponses: Reponses; creeLe: string };

/** Questionnaires visibles (tous pour les équipes internes, ceux qui me visent sinon) et réponses accessibles. */
export async function donneesQuestionnaires(): Promise<{ questionnaires: Questionnaire[]; reponses: ReponseQuestionnaire[] }> {
  const supabase = supabaseServeur();
  const [{ data: q }, { data: r }] = await Promise.all([
    supabase.from("ep_questionnaires").select("id, titre, description, questions, cible, statut, ouvert_le, clos_le, maj_le").order("maj_le", { ascending: false }),
    supabase.from("ep_questionnaire_reponses").select("questionnaire_id, profil_id, reponses, cree_le").limit(5000),
  ]);
  type LQ = { id: string; titre: string; description: string | null; questions: Question[]; cible: string; statut: Questionnaire["statut"]; ouvert_le: string | null; clos_le: string | null; maj_le: string };
  type LR = { questionnaire_id: string; profil_id: string; reponses: Reponses; cree_le: string };
  return {
    questionnaires: ((q ?? []) as LQ[]).map((x) => ({ id: x.id, titre: x.titre, description: x.description, questions: x.questions ?? [], cible: x.cible, statut: x.statut, ouvertLe: x.ouvert_le, closLe: x.clos_le, majLe: x.maj_le })),
    reponses: ((r ?? []) as LR[]).map((x) => ({ questionnaireId: x.questionnaire_id, profilId: x.profil_id, reponses: x.reponses ?? {}, creeLe: x.cree_le })),
  };
}
