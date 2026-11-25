"use server";

import { revalidatePath } from "next/cache";
import { entonnoirLeads } from "@/lib/data/leads";
import type { Entonnoir } from "@/lib/data/types";
import { envoyerNotifications } from "@/lib/notifications";
import { supabaseServeur } from "@/lib/supabase/server";

export type ResultatAction = { ok: true; message: string } | { ok: false; message: string };

/** Expédie les e-mails et SMS en file, sans jamais faire échouer l'action. */
async function expedier() {
  try {
    await envoyerNotifications();
  } catch {
    /* les messages restent en file et repartiront au prochain envoi */
  }
}

const rafraichir = (leadId?: string) => {
  revalidatePath("/leads");
  revalidatePath("/lead-management");
  revalidatePath("/accueil");
  if (leadId) revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/lead-management/${leadId}`);
};

export async function attribuerLead(leadId: string, compteId: string | null, commercialId: string | null = null): Promise<ResultatAction> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase.rpc("ep_attribuer_lead", {
    p_lead: leadId,
    ...(compteId ? { p_compte: compteId } : {}),
    ...(commercialId ? { p_commercial: commercialId } : {}),
  });
  if (error) return { ok: false, message: error.message };
  await expedier();
  rafraichir(leadId);
  return { ok: true, message: `Lead ${(data as { reference: string }).reference} attribué, installateur et commercial prévenus` };
}

export async function reattribuerLead(leadId: string, compteId: string | null, commercialId: string | null): Promise<ResultatAction> {
  const { data, error } = await supabaseServeur().rpc("ep_reattribuer_lead", {
    p_lead: leadId,
    ...(compteId ? { p_compte: compteId } : {}),
    ...(commercialId ? { p_commercial: commercialId } : {}),
  });
  if (error) return { ok: false, message: error.message };
  await expedier();
  rafraichir(leadId);
  return { ok: true, message: `Lead ${(data as { reference: string }).reference} réattribué` };
}

export async function attribuerLeads(leadIds: string[]): Promise<ResultatAction> {
  const { data, error } = await supabaseServeur().rpc("ep_attribuer_leads", { p_leads: leadIds });
  if (error) return { ok: false, message: error.message };
  await expedier();
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
  await expedier();
  rafraichir(leadId);
  return { ok: true, message: "Installateur relancé" };
}

export type ChampsLead = {
  contact: string; telephone: string; email: string; adresse: string; cp: string; ville: string; projet: string; message: string;
  contactPrefere: "" | "telephone" | "email" | "sms"; grosProjet: boolean;
};

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
    p_adresse: c.adresse,
    p_message: c.message,
    p_contact_prefere: c.contactPrefere || null,
  });
  if (error) return { ok: false, message: error.message };
  rafraichir(leadId);
  return { ok: true, message: "Lead modifié" };
}

export async function ajouterNote(leadId: string, contenu: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_ajouter_note_lead", { p_lead: leadId, p_contenu: contenu });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/lead-management/${leadId}`);
  return { ok: true, message: "Note ajoutée" };
}

export async function chargerEntonnoir(jours: number, source: string | null): Promise<Entonnoir> {
  return entonnoirLeads(jours, source);
}

export async function accepterLead(leadId: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_accepter_lead", { p_lead: leadId });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/leads");
  revalidatePath("/lead-management");
  revalidatePath("/accueil");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/lead-management/${leadId}`);
  return { ok: true, message: "Lead accepté : les coordonnées du client sont visibles. +20 points" };
}

export async function refuserLead(leadId: string, motif: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_refuser_lead", { p_lead: leadId, p_motif: motif });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/leads");
  revalidatePath("/lead-management");
  revalidatePath("/accueil");
  return { ok: true, message: "Lead refusé. Il retourne au Lead Manager." };
}

export type StatutAvancement = "contacte" | "rdv" | "devis" | "signe" | "pose" | "perdu";

export async function changerStatutLead(leadId: string, statut: StatutAvancement, motif?: string, reference?: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_changer_statut_lead", {
    p_lead: leadId,
    p_statut: statut,
    ...(motif ? { p_motif: motif } : {}),
    ...(reference ? { p_reference: reference } : {}),
  });
  if (error) return { ok: false, message: error.message };
  await expedier();
  rafraichir(leadId);
  return { ok: true, message: "Avancement enregistré" };
}

export type Qualification = { temperature: "froid" | "tiede" | "chaud"; nature: string; echeance: string; budget: string; typeBien: string };

export async function qualifierLead(leadId: string, q: Qualification): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_qualifier_lead", {
    p_lead: leadId, p_temperature: q.temperature, p_nature: q.nature, p_echeance: q.echeance, p_budget: q.budget, p_type_bien: q.typeBien,
  });
  if (error) return { ok: false, message: error.message };
  rafraichir(leadId);
  return { ok: true, message: "Qualification enregistrée" };
}

export async function annulerLead(leadId: string, fauteInstallateur: boolean, motif: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_annuler_lead", { p_lead: leadId, p_faute_installateur: fauteInstallateur, p_motif: motif });
  if (error) return { ok: false, message: error.message };
  rafraichir(leadId);
  return { ok: true, message: fauteInstallateur ? "Lead annulé et remis dans la file pour réattribution" : "Lead classé perdu" };
}

export async function validerCommande(leadId: string, reference: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_valider_commande_lead", { p_lead: leadId, p_reference: reference });
  if (error) return { ok: false, message: error.message };
  rafraichir(leadId);
  return { ok: true, message: "Commande rattachée au lead" };
}

export type NouveauLead = {
  source: string; contact: string; telephone: string; email: string; adresse: string; cp: string; ville: string; projet: string; message: string;
  contactPrefere: "" | "telephone" | "email" | "sms";
};

export async function creerLead(l: NouveauLead): Promise<ResultatAction & { id?: string }> {
  const { data, error } = await supabaseServeur().rpc("ep_creer_lead", {
    p_source: l.source || "Téléphone", p_contact: l.contact, p_telephone: l.telephone, p_email: l.email, p_adresse: l.adresse,
    p_cp: l.cp, p_ville: l.ville, p_projet: l.projet, p_message: l.message, p_contact_prefere: l.contactPrefere || null,
  });
  if (error) return { ok: false, message: error.message };
  rafraichir();
  const r = data as { id: string; reference: string };
  return { ok: true, message: `Lead ${r.reference} créé`, id: r.id };
}

export async function commenterLead(leadId: string, contenu: string): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_commenter_lead", { p_lead: leadId, p_contenu: contenu });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/lead-management/${leadId}`);
  return { ok: true, message: "Commentaire publié" };
}

export async function envoyerEnquete(leadId: string, cible: "client" | "installateur"): Promise<ResultatAction> {
  const { error } = await supabaseServeur().rpc("ep_envoyer_enquete", { p_lead: leadId, p_cible: cible });
  if (error) return { ok: false, message: error.message };
  const r = await envoyerNotifications().catch(() => null);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/lead-management/${leadId}`);
  return { ok: true, message: r ? "Enquête envoyée" : "Enquête prête : elle partira dès que l’envoi d’e-mails sera configuré" };
}

export async function relancerEnvois(): Promise<ResultatAction> {
  const r = await envoyerNotifications(100).catch(() => null);
  revalidatePath("/leads");
  revalidatePath("/lead-management");
  if (!r) return { ok: false, message: "L’envoi d’e-mails et de SMS n’est pas encore configuré" };
  return { ok: true, message: `${r.envoyes} message${r.envoyes > 1 ? "s" : ""} envoyé${r.envoyes > 1 ? "s" : ""}${r.echecs ? `, ${r.echecs} en échec` : ""}` };
}
