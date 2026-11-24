"use server";

import { revalidatePath } from "next/cache";
import { entonnoirLeads } from "@/lib/data/leads";
import type { Entonnoir } from "@/lib/data/types";
import { supabaseServeur } from "@/lib/supabase/server";

export type ResultatAction = { ok: true; message: string } | { ok: false; message: string };

const rafraichir = (leadId?: string) => {
  revalidatePath("/leads");
  revalidatePath("/accueil");
  if (leadId) revalidatePath(`/leads/${leadId}`);
};

export async function attribuerLead(leadId: string, compteId: string | null, commercialId: string | null = null): Promise<ResultatAction> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase.rpc("ep_attribuer_lead", {
    p_lead: leadId,
    ...(compteId ? { p_compte: compteId } : {}),
    ...(commercialId ? { p_commercial: commercialId } : {}),
  });
  if (error) return { ok: false, message: error.message };
  rafraichir(leadId);
  return { ok: true, message: `Lead ${(data as { reference: string }).reference} attribué` };
}

export async function reattribuerLead(leadId: string, compteId: string | null, commercialId: string | null): Promise<ResultatAction> {
  const { data, error } = await supabaseServeur().rpc("ep_reattribuer_lead", {
    p_lead: leadId,
    ...(compteId ? { p_compte: compteId } : {}),
    ...(commercialId ? { p_commercial: commercialId } : {}),
  });
  if (error) return { ok: false, message: error.message };
  rafraichir(leadId);
  return { ok: true, message: `Lead ${(data as { reference: string }).reference} réattribué` };
}

export async function attribuerLeads(leadIds: string[]): Promise<ResultatAction> {
  const { data, error } = await supabaseServeur().rpc("ep_attribuer_leads", { p_leads: leadIds });
  if (error) return { ok: false, message: error.message };
  rafraichir();
  const r = data as { attribues: number; ignores: number };
  return {
    ok: true,
    message: `${r.attribues} lead${r.attribues > 1 ? "s" : ""} attribué${r.attribues > 1 ? "s" : ""}${r.ignores ? `, ${r.ignores} à traiter un par un` : ""}`,
  };
}

export async function relancerPro(leadId: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_relancer_pro", { p_lead: leadId });
  if (error) return { ok: false, message: error.message };
  rafraichir(leadId);
  return { ok: true, message: "Relance enregistrée" };
}

export type ChampsLead = { contact: string; telephone: string; email: string; cp: string; ville: string; projet: string; grosProjet: boolean };

export async function modifierLead(leadId: string, c: ChampsLead): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_modifier_lead", {
    p_lead: leadId,
    p_contact: c.contact,
    p_telephone: c.telephone,
    p_email: c.email,
    p_cp: c.cp,
    p_ville: c.ville,
    p_projet: c.projet,
    p_gros_projet: c.grosProjet,
  });
  if (error) return { ok: false, message: error.message };
  rafraichir(leadId);
  return { ok: true, message: "Lead modifié" };
}

export async function ajouterNote(leadId: string, contenu: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_ajouter_note_lead", { p_lead: leadId, p_contenu: contenu });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, message: "Note ajoutée" };
}

export async function chargerEntonnoir(jours: number, source: string | null): Promise<Entonnoir> {
  return entonnoirLeads(jours, source);
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
