"use server";

import { revalidatePath } from "next/cache";
import type { SavDecision, SavResolution, SavStatut, SavType } from "@/components/sav/libelles";
import { supabaseServeur } from "@/lib/supabase/server";

export type ResultatSav<T = undefined> = { ok: true; message: string; donnee?: T } | { ok: false; message: string };

const echec = (e: { message: string }): ResultatSav => ({ ok: false, message: e.message });

function rafraichir(id?: string) {
  revalidatePath("/sav");
  if (id) revalidatePath(`/sav/${id}`);
}

export type NouvelleDemande = {
  type: SavType;
  compteId: string | null;
  gamme: string;
  produit: string;
  referenceProduit: string;
  numeroCommande: string;
  numeroSerie: string;
  description: string;
  adresse: string;
};

export async function declarerDemande(n: NouvelleDemande): Promise<ResultatSav<{ id: string; reference: string }>> {
  const { data, error } = await supabaseServeur().rpc("ep_sav_declarer", {
    p_type: n.type,
    p_description: n.description,
    ...(n.compteId ? { p_compte: n.compteId } : {}),
    p_gamme: n.gamme,
    p_produit: n.produit,
    p_reference_produit: n.referenceProduit,
    p_numero_commande: n.numeroCommande,
    p_numero_serie: n.numeroSerie,
    p_adresse: n.adresse,
  });
  if (error) return echec(error);
  const d = data as { id: string; reference: string };
  rafraichir();
  return { ok: true, message: `Demande ${d.reference} envoyée au service SAV`, donnee: { id: d.id, reference: d.reference } };
}

/** Enregistre un fichier déjà déposé dans le stockage privé ep-sav. */
export async function enregistrerFichier(demandeId: string, chemin: string, nom: string, typeMime: string, taille: number): Promise<ResultatSav> {
  const { error } = await supabaseServeur().rpc("ep_sav_ajouter_fichier", {
    p_demande: demandeId,
    p_chemin: chemin,
    p_nom: nom,
    p_type_mime: typeMime,
    p_taille: taille,
  });
  if (error) return echec(error);
  rafraichir(demandeId);
  return { ok: true, message: "Fichier ajouté" };
}

export async function envoyerMessage(demandeId: string, contenu: string, interne: boolean): Promise<ResultatSav> {
  const { error } = await supabaseServeur().rpc("ep_sav_ajouter_message", { p_demande: demandeId, p_contenu: contenu, p_interne: interne });
  if (error) return echec(error);
  rafraichir(demandeId);
  return { ok: true, message: interne ? "Note interne ajoutée" : "Message envoyé" };
}

const MESSAGES_STATUT: Partial<Record<SavStatut, string>> = {
  en_analyse: "Demande prise en charge",
  infos_demandees: "Demande d’informations envoyée au client",
  avis_technique: "Demande transmise au bureau d’études",
  cloturee: "Demande clôturée",
};

export async function changerStatut(demandeId: string, statut: SavStatut, message: string): Promise<ResultatSav> {
  const { error } = await supabaseServeur().rpc("ep_sav_changer_statut", {
    p_demande: demandeId,
    p_statut: statut,
    ...(message.trim() ? { p_message: message } : {}),
  });
  if (error) return echec(error);
  rafraichir(demandeId);
  return { ok: true, message: MESSAGES_STATUT[statut] ?? "Statut mis à jour" };
}

export async function affecterDemande(demandeId: string, utilisateur: string | null): Promise<ResultatSav> {
  const { error } = await supabaseServeur().rpc("ep_sav_affecter", { p_demande: demandeId, p_utilisateur: utilisateur as string });
  if (error) return echec(error);
  rafraichir(demandeId);
  return { ok: true, message: utilisateur ? "Demande affectée" : "Affectation retirée" };
}

export async function deciderDemande(demandeId: string, decision: SavDecision, motif: string): Promise<ResultatSav> {
  const { error } = await supabaseServeur().rpc("ep_sav_decider", {
    p_demande: demandeId,
    p_decision: decision,
    ...(motif.trim() ? { p_motif: motif } : {}),
  });
  if (error) return echec(error);
  rafraichir(demandeId);
  return { ok: true, message: "Décision enregistrée et communiquée au client" };
}

export type Resolution = { resolution: SavResolution; commentaire: string; avoirReference: string; avoirMontant: string; bonRetour: string };

export async function resoudreDemande(demandeId: string, r: Resolution): Promise<ResultatSav> {
  const montant = r.avoirMontant.trim() ? Number(r.avoirMontant.replace(",", ".")) : undefined;
  const { error } = await supabaseServeur().rpc("ep_sav_resoudre", {
    p_demande: demandeId,
    p_resolution: r.resolution,
    ...(r.commentaire.trim() ? { p_commentaire: r.commentaire } : {}),
    ...(r.avoirReference.trim() ? { p_avoir_reference: r.avoirReference } : {}),
    ...(montant !== undefined && !Number.isNaN(montant) ? { p_avoir_montant: montant } : {}),
    ...(r.bonRetour.trim() ? { p_bon_retour: r.bonRetour } : {}),
  });
  if (error) return echec(error);
  rafraichir(demandeId);
  return { ok: true, message: "Demande résolue, le client est informé" };
}

export async function qualifierDemande(demandeId: string, nonConformite: boolean, cause: string, action: string): Promise<ResultatSav> {
  const { error } = await supabaseServeur().rpc("ep_sav_qualifier", {
    p_demande: demandeId,
    p_non_conformite: nonConformite,
    ...(cause.trim() ? { p_cause: cause } : {}),
    ...(action.trim() ? { p_action: action } : {}),
  });
  if (error) return echec(error);
  rafraichir(demandeId);
  return { ok: true, message: nonConformite ? "Non-conformité enregistrée" : "Demande qualifiée sans non-conformité" };
}
