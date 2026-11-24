"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

export type ResultatAction = { ok: true; message: string } | { ok: false; message: string };

export async function attribuerLead(leadId: string, compteId: string | null): Promise<ResultatAction> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase.rpc("ep_attribuer_lead", {
    p_lead: leadId,
    ...(compteId ? { p_compte: compteId } : {}),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/leads");
  revalidatePath("/accueil");
  return { ok: true, message: `Lead ${(data as { reference: string }).reference} attribué` };
}
