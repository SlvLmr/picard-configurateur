"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

export type LigneNavision = { numero: string; date: string; code_client: string; client: string; code_lead: string; montant: string };

/** Importe l'export Navision (administrateur) et rapproche les commandes des leads. */
export async function importerNavision(fichier: string, lignes: LigneNavision[]): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await supabaseServeur().rpc("ep_admin_import_navision", { p_fichier: fichier, p_lignes: lignes });
  if (error) return { ok: false, message: error.message };
  const r = data as { lignes: number; rapprochees: number };
  revalidatePath("/lead-management/navision");
  revalidatePath("/lead-management");
  return { ok: true, message: `${r.lignes} commande${r.lignes > 1 ? "s" : ""} importée${r.lignes > 1 ? "s" : ""}, dont ${r.rapprochees} rapprochée${r.rapprochees > 1 ? "s" : ""} d’un lead` };
}
