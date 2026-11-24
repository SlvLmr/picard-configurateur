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
