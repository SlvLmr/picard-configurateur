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

export async function accepterLead(leadId: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_accepter_lead", { p_lead: leadId });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/leads");
  revalidatePath("/accueil");
  return { ok: true, message: "Lead accepté. Le client est prévenu de votre appel. +20 points" };
}

export async function refuserLead(leadId: string, motif: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_refuser_lead", { p_lead: leadId, p_motif: motif });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/leads");
  revalidatePath("/accueil");
  return { ok: true, message: "Lead refusé. Il est proposé au professionnel suivant." };
}

export async function changerStatutLead(leadId: string, statut: "contacte" | "devis" | "signe" | "perdu"): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_changer_statut_lead", { p_lead: leadId, p_statut: statut });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/leads");
  return { ok: true, message: "Statut enregistré. +10 points la première fois" };
}
