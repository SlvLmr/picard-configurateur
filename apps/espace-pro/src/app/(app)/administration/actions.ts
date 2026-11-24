"use server";

import { revalidatePath } from "next/cache";
import type { RoleId } from "@/lib/roles";
import { supabaseServeur } from "@/lib/supabase/server";

export type Resultat = { ok: boolean; message: string };

type Profil = { role: RoleId; prenom: string; nom: string; compteId: string | null; commercialId: string | null };

const vide = (s: string) => (s.trim() ? s.trim() : null);

export async function definirProfil(utilisateurId: string, p: Profil & { actif: boolean }): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_definir_profil", {
    p_utilisateur: utilisateurId,
    p_role: p.role,
    p_prenom: vide(p.prenom),
    p_nom: vide(p.nom),
    p_compte: p.compteId,
    p_commercial: p.commercialId,
    p_actif: p.actif,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration");
  return { ok: true, message: p.actif ? "Profil enregistré" : "Accès désactivé" };
}

export async function inviter(email: string, p: Profil): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_inviter", {
    p_email: email,
    p_role: p.role,
    p_prenom: vide(p.prenom),
    p_nom: vide(p.nom),
    p_compte: p.compteId,
    p_commercial: p.commercialId,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration");
  return { ok: true, message: `Invitation enregistrée pour ${email}` };
}

export async function annulerInvitation(id: string): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_annuler_invitation", { p_id: id });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration");
  return { ok: true, message: "Invitation annulée" };
}

export async function enregistrerCommercial(id: string | null, c: {
  prenom: string; nom: string; equipe: string; fonction: string; email: string; telephone: string; iapObjectif: number; actif: boolean;
}): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_enregistrer_commercial", {
    p_id: id, p_prenom: c.prenom, p_nom: c.nom, p_equipe: c.equipe, p_fonction: c.fonction, p_email: c.email,
    p_telephone: c.telephone, p_iap_objectif: c.iapObjectif, p_actif: c.actif,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration/commerciaux");
  return { ok: true, message: id ? "Commercial enregistré" : "Commercial ajouté" };
}

export async function enregistrerCompte(id: string | null, c: {
  raisonSociale: string; type: string; niveau: string | null; numero: string; cp: string; ville: string; commercialId: string | null; actif: boolean;
}): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_enregistrer_compte", {
    p_id: id, p_raison_sociale: c.raisonSociale, p_type: c.type, p_niveau: c.type === "IAP" ? c.niveau : null,
    p_numero: c.numero, p_cp: c.cp, p_ville: c.ville, p_commercial: c.commercialId, p_actif: c.actif,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration/clients");
  return { ok: true, message: id ? "Client enregistré" : "Client ajouté" };
}

export async function majParametre(cle: string, valeur: number): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_maj_parametre", { p_cle: cle, p_valeur: valeur });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration/parametres");
  return { ok: true, message: "Paramètre enregistré" };
}

export async function majDroit(module: string, role: RoleId, autorise: boolean, niveaux: string[]): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_maj_droit", { p_module: module, p_role: role, p_autorise: autorise, p_niveaux: niveaux });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration/droits");
  revalidatePath("/", "layout");
  return { ok: true, message: "Droit enregistré" };
}
