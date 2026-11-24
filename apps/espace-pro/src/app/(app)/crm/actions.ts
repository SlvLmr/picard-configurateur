"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

export type ResultatCrm = { ok: true; message: string } | { ok: false; message: string };

const rafraichir = (compteId?: string) => {
  if (compteId) revalidatePath(`/crm/${compteId}`);
  revalidatePath("/crm/tournee");
  revalidatePath("/accueil");
};

async function appeler(fn: string, args: Record<string, unknown>, succes: string, compteId?: string): Promise<ResultatCrm> {
  const { error } = await supabaseServeur().rpc(fn, args);
  if (error) return { ok: false, message: error.message };
  rafraichir(compteId);
  return { ok: true, message: succes };
}

export async function planifierActivite(compteId: string, type: string, dateIso: string, objet: string) {
  return appeler("ep_planifier_activite", { p_compte: compteId, p_type: type, p_date: dateIso, p_objet: objet }, "Visite planifiée", compteId);
}

export async function enregistrerCompteRendu(params: {
  compteId: string;
  activiteId?: string | null;
  type?: string;
  objet: string;
  compteRendu: string;
  prochainesEtapes?: string;
  actionDeSuivi?: { titre: string; echeance: string | null } | null;
}): Promise<ResultatCrm> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase.rpc("ep_realiser_activite", {
    p_compte_rendu: params.compteRendu,
    p_activite: params.activiteId ?? null,
    p_compte: params.activiteId ? null : params.compteId,
    p_type: params.type ?? "visite",
    p_objet: params.objet,
    p_prochaines_etapes: params.prochainesEtapes ?? null,
  });
  if (error) return { ok: false, message: error.message };
  if (params.actionDeSuivi?.titre) {
    const { error: e2 } = await supabase.rpc("ep_creer_action", {
      p_compte: params.compteId,
      p_titre: params.actionDeSuivi.titre,
      p_echeance: params.actionDeSuivi.echeance,
      p_activite: (data as { id: string }).id,
    });
    if (e2) return { ok: false, message: `Compte rendu enregistré, mais l’action n’a pas pu être créée : ${e2.message}` };
  }
  rafraichir(params.compteId);
  return { ok: true, message: params.actionDeSuivi?.titre ? "Compte rendu enregistré, action de suivi créée" : "Compte rendu enregistré" };
}

export async function annulerActivite(activiteId: string, compteId: string) {
  return appeler("ep_annuler_activite", { p_activite: activiteId }, "Visite annulée", compteId);
}

export async function creerAction(compteId: string, titre: string, echeance: string | null, planId?: string | null) {
  return appeler("ep_creer_action", { p_compte: compteId, p_titre: titre, p_echeance: echeance, p_plan: planId ?? null }, "Action créée", compteId);
}

export async function basculerAction(actionId: string, fait: boolean, compteId: string) {
  return appeler("ep_terminer_action", { p_action: actionId, p_fait: fait }, fait ? "Action terminée" : "Action rouverte", compteId);
}

export async function creerPlan(compteId: string, objectif: string, type: string, echeance: string | null) {
  return appeler("ep_creer_plan", { p_compte: compteId, p_objectif: objectif, p_type: type, p_echeance: echeance }, "Plan d’action créé", compteId);
}

export async function changerStatutPlan(planId: string, statut: string, compteId: string) {
  const libelle = statut === "atteint" ? "Objectif marqué comme atteint" : statut === "abandonne" ? "Plan abandonné" : "Plan rouvert";
  return appeler("ep_changer_statut_plan", { p_plan: planId, p_statut: statut }, libelle, compteId);
}
