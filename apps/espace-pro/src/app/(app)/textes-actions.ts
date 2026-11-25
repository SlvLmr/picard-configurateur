"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

/** Modifie un texte de l'interface (administrateur). Une valeur vide rétablit le texte d'origine. */
export async function enregistrerTexte(cle: string, valeur: string): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabaseServeur().rpc("ep_admin_texte", { p_cle: cle, p_valeur: valeur });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: valeur.trim() ? "Texte modifié" : "Texte d’origine rétabli" };
}
