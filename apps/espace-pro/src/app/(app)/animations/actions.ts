"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

type Resultat = { ok: boolean; message: string };
const fini = (message: string): Resultat => {
  revalidatePath("/animations");
  revalidatePath("/accueil");
  return { ok: true, message };
};

export async function participer(animationId: string, dossier?: { reference: string; client: string; montant: string }): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_participer_animation", {
    p_animation: animationId,
    ...(dossier ? { p_reference: dossier.reference, p_client: dossier.client, p_montant: dossier.montant ? Number(dossier.montant.replace(",", ".")) : null } : {}),
  });
  if (error) return { ok: false, message: error.message };
  return fini(dossier ? "Dossier déposé, vous suivez son avancement ici" : "Inscription enregistrée");
}

export async function inviterFilleul(animationId: string, f: { nom: string; email: string; telephone: string }): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_inviter_filleul", { p_animation: animationId, p_nom: f.nom, p_email: f.email, p_telephone: f.telephone });
  if (error) return { ok: false, message: error.message };
  return fini(`${f.nom} est invité`);
}

export async function traiterParticipation(id: string, statut: string, motif?: string): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_traiter_participation", { p_id: id, p_statut: statut, ...(motif ? { p_motif: motif } : {}) });
  if (error) return { ok: false, message: error.message };
  return fini("Dossier mis à jour");
}

export async function traiterParrainage(id: string, statut: string): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_traiter_parrainage", { p_id: id, p_statut: statut });
  if (error) return { ok: false, message: error.message };
  return fini("Parrainage mis à jour");
}

export type FormAnimation = {
  id: string | null; type: string; titre: string; accroche: string; description: string; conditions: string; debut: string; fin: string;
  montant: string; points: string; produits: string; lienKit: string; niveaux: string[]; publie: boolean;
};

export async function enregistrerAnimation(a: FormAnimation): Promise<Resultat> {
  const nombre = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : null);
  const { error } = await supabaseServeur().rpc("ep_admin_enregistrer_animation", {
    p_id: a.id, p_type: a.type, p_titre: a.titre, p_accroche: a.accroche, p_description: a.description, p_conditions: a.conditions,
    p_debut: a.debut, p_fin: a.fin || null, p_montant: nombre(a.montant), p_points: nombre(a.points), p_produits: a.produits, p_lien_kit: a.lienKit,
    p_niveaux: a.niveaux, p_publie: a.publie,
  });
  if (error) return { ok: false, message: error.message };
  return fini(a.id ? "Animation enregistrée" : "Animation créée");
}
