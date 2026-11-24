"use server";

import { supabaseServeur } from "@/lib/supabase/server";

export async function repondre(jeton: string, note: number, commentaire: string): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabaseServeur().rpc("ep_repondre_enquete", { p_jeton: jeton, p_note: note, p_commentaire: commentaire });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Merci ! Votre avis nous aide à améliorer le service." };
}
