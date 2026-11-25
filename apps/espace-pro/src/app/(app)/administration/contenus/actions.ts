"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";
import { CIBLES, type Cible } from "@/lib/cibles";

export type Resultat = { ok: boolean; message: string };

const vide = (s: string) => (s.trim() ? s.trim() : null);

export async function publierAnnonce(f: {
  titre: string; contenu: string; ton: string; lienLibelle: string; lienUrl: string; cible: Cible; debut: string; fin: string; epinglee: boolean; photos?: string[];
}): Promise<Resultat> {
  const c = CIBLES[f.cible];
  const { error } = await supabaseServeur().rpc("ep_publier_annonce", {
    p_titre: f.titre, p_contenu: f.contenu, p_ton: f.ton, p_lien_libelle: vide(f.lienLibelle), p_lien_url: vide(f.lienUrl),
    p_roles: c.roles, p_niveaux: c.niveaux, p_debut: f.debut || null, p_fin: f.fin || null, p_epinglee: f.epinglee, p_photos: f.photos ?? [],
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration/contenus");
  revalidatePath("/accueil");
  revalidatePath("/news");
  return { ok: true, message: "Message envoyé" };
}

export async function archiverAnnonce(id: string): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_archiver_annonce", { p_id: id });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration/contenus");
  revalidatePath("/accueil");
  return { ok: true, message: "Annonce retirée" };
}

export async function creerEvenement(f: {
  titre: string; type: string; debut: string; fin: string; lieu: string; description: string; lienUrl: string; cible: Cible;
}): Promise<Resultat> {
  if (!f.debut) return { ok: false, message: "Indiquez la date de début" };
  const c = CIBLES[f.cible];
  const { error } = await supabaseServeur().rpc("ep_creer_evenement", {
    p_titre: f.titre, p_type: f.type, p_debut: new Date(f.debut).toISOString(), p_fin: f.fin ? new Date(f.fin).toISOString() : null,
    p_lieu: vide(f.lieu), p_description: vide(f.description), p_lien_url: vide(f.lienUrl), p_roles: c.roles, p_niveaux: c.niveaux,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration/contenus");
  revalidatePath("/accueil");
  return { ok: true, message: "Événement ajouté au calendrier" };
}

export async function archiverEvenement(id: string): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_archiver_evenement", { p_id: id });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/administration/contenus");
  revalidatePath("/accueil");
  return { ok: true, message: "Événement retiré" };
}
