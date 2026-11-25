"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

/** Enregistre le découpage d'une force de vente (administrateur). */
export async function enregistrerZoning(force: string, zoning: Record<string, string[]>): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabaseServeur().rpc("ep_admin_zoning", { p_force: force, p_zoning: zoning });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/lead-management/zoning");
  return { ok: true, message: "Zoning enregistré" };
}
