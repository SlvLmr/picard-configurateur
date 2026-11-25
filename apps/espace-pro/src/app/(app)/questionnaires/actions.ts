"use server";

import { revalidatePath } from "next/cache";
import { CIBLES, type Cible } from "@/lib/cibles";
import type { Question, Reponses } from "@/lib/questionnaires";
import { supabaseServeur } from "@/lib/supabase/server";

export type Resultat = { ok: boolean; message: string; id?: string };
const fini = (message: string, id?: string): Resultat => {
  revalidatePath("/questionnaires");
  revalidatePath("/", "layout");
  return { ok: true, message, id };
};

export async function enregistrerQuestionnaire(f: { id: string | null; titre: string; description: string; questions: Question[]; cible: Cible }): Promise<Resultat> {
  const c = CIBLES[f.cible];
  const { data, error } = await supabaseServeur().rpc("ep_admin_enregistrer_questionnaire", {
    p_id: f.id, p_titre: f.titre, p_description: f.description, p_questions: f.questions, p_cible: f.cible, p_roles: c.roles, p_niveaux: c.niveaux,
  });
  if (error) return { ok: false, message: error.message };
  return fini("Questionnaire enregistré", data as string);
}

export async function changerStatutQuestionnaire(id: string, statut: "brouillon" | "ouvert" | "clos"): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_statut_questionnaire", { p_id: id, p_statut: statut });
  if (error) return { ok: false, message: error.message };
  return fini(statut === "ouvert" ? "Questionnaire ouvert : il est proposé à son public" : statut === "clos" ? "Questionnaire clos" : "Questionnaire repassé en brouillon");
}

export async function supprimerQuestionnaire(id: string): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_supprimer_questionnaire", { p_id: id });
  if (error) return { ok: false, message: error.message };
  return fini("Brouillon supprimé");
}

export async function repondreQuestionnaire(id: string, reponses: Reponses): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_repondre_questionnaire", { p_id: id, p_reponses: reponses });
  if (error) return { ok: false, message: error.message };
  return fini("Merci, vos réponses sont enregistrées");
}
