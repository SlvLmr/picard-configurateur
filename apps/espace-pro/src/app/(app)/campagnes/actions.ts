"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";
import type { NiveauIAP } from "@/lib/roles";

export type Resultat = { ok: boolean; message: string; id?: string };

export async function majActionCampagne(
  campagneId: string,
  cibleId: string,
  etape: string,
  statut: "a_faire" | "fait" | "sans_objet",
  details?: { commentaire?: string; montant?: number | null },
): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_maj_action_campagne", {
    p_cible: cibleId,
    p_etape: etape,
    p_statut: statut,
    p_commentaire: details?.commentaire?.trim() || null,
    p_montant: details?.montant ?? null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/campagnes/${campagneId}`);
  revalidatePath("/campagnes");
  return { ok: true, message: statut === "fait" ? "Étape marquée comme faite" : statut === "sans_objet" ? "Étape sans objet" : "Étape remise à faire" };
}

export async function planifierRappel(campagneId: string, cibleId: string, date: string | null): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_planifier_rappel_campagne", { p_cible: cibleId, p_date: date || null });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/campagnes/${campagneId}`);
  return { ok: true, message: date ? "Rappel planifié" : "Rappel supprimé" };
}

export async function changerStatutCampagne(campagneId: string, statut: "brouillon" | "active" | "terminee"): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_changer_statut_campagne", { p_campagne: campagneId, p_statut: statut });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/campagnes/${campagneId}`);
  revalidatePath("/campagnes");
  return { ok: true, message: statut === "terminee" ? "Campagne terminée" : statut === "active" ? "Campagne activée" : "Campagne repassée en brouillon" };
}

export async function apercuCiblage(niveaux: NiveauIAP[], zones: string[]): Promise<{ comptes: number; commerciaux: number } | null> {
  const { data, error } = await supabaseServeur().rpc("ep_apercu_ciblage", { p_niveaux: niveaux, p_zones: zones });
  if (error) return null;
  return data as { comptes: number; commerciaux: number };
}

export async function creerCampagne(f: {
  titre: string;
  objectif: string;
  description: string;
  debut: string;
  fin: string;
  etapes: { type: string; libelle: string }[];
  niveaux: NiveauIAP[];
  zones: string[];
  activer: boolean;
}): Promise<Resultat> {
  const { data, error } = await supabaseServeur().rpc("ep_creer_campagne", {
    p_titre: f.titre,
    p_etapes: f.etapes,
    p_objectif: f.objectif || null,
    p_description: f.description || null,
    p_debut: f.debut || null,
    p_fin: f.fin || null,
    p_niveaux: f.niveaux,
    p_zones: f.zones,
    p_activer: f.activer,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/campagnes");
  return { ok: true, message: "Campagne créée", id: (data as { id: string }).id };
}
