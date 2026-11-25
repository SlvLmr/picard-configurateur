"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

/** Enregistre les indicateurs d'un mois (administrateur). Une valeur vide efface l'indicateur. */
export async function enregistrerMois(mois: string, mesures: Record<string, Record<string, number | null>>): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabaseServeur().rpc("ep_admin_digital", { p_mois: mois, p_mesures: mesures });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/digital");
  return { ok: true, message: "Indicateurs enregistrés" };
}
