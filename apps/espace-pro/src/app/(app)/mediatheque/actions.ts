"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

export type Resultat<T = undefined> = { ok: true; message: string; donnee?: T } | { ok: false; message: string };

/** Prépare une URL de téléchargement temporaire (2 minutes) et enregistre le téléchargement. */
export async function lienTelechargement(ressourceId: string): Promise<Resultat<string>> {
  const supabase = supabaseServeur();
  const { data: r, error } = await supabase.from("ep_ressources").select("id, titre, fichier_chemin").eq("id", ressourceId).maybeSingle();
  if (error || !r) return { ok: false, message: "Ressource introuvable ou non autorisée." };
  if (!r.fichier_chemin) return { ok: false, message: "Le fichier de cette ressource n’a pas encore été déposé." };

  const { data: lien, error: e2 } = await supabase.storage.from("ep-ressources").createSignedUrl(r.fichier_chemin, 120, { download: true });
  if (e2 || !lien) return { ok: false, message: "Impossible de préparer le téléchargement. Réessayez dans un instant." };

  await supabase.rpc("ep_enregistrer_telechargement", { p_ressource: ressourceId });
  revalidatePath("/mediatheque");
  return { ok: true, message: `Téléchargement de « ${r.titre} » lancé`, donnee: lien.signedUrl };
}

export type NouvelleRessource = {
  titre: string;
  description: string;
  type: "photo" | "video" | "doc_commerciale" | "doc_technique";
  gamme: string;
  marque: "picard" | "eliot" | "commune";
  acces: "tous" | "internes" | "elite" | "elite_premium";
  kit: string;
  fichierChemin: string;
  tailleOctets: number;
  format: string;
};

const ROLES_INTERNES = ["admin", "codir", "chef_service", "chef_marche", "atc", "repartiteur"];

/** Enregistre une ressource dont le fichier vient d'être déposé (réservé à l'administrateur, contrôlé par la base). */
export async function creerRessource(n: NouvelleRessource): Promise<Resultat> {
  const supabase = supabaseServeur();
  const { error } = await supabase.rpc("ep_creer_ressource", {
    p_titre: n.titre,
    p_type: n.type,
    p_description: n.description,
    p_gamme: n.gamme,
    p_marque: n.marque,
    p_fichier_chemin: n.fichierChemin,
    p_taille_octets: n.tailleOctets,
    p_format: n.format,
    p_roles: n.acces === "internes" ? ROLES_INTERNES : [],
    p_niveaux: n.acces === "elite" ? ["Elite"] : n.acces === "elite_premium" ? ["Elite", "Premium"] : [],
    p_kit: n.kit,
  });
  if (error) {
    // Le fichier déposé ne doit pas rester orphelin dans le stockage
    await supabase.storage.from("ep-ressources").remove([n.fichierChemin]);
    return { ok: false, message: error.message };
  }
  revalidatePath("/mediatheque");
  return { ok: true, message: `« ${n.titre} » est publiée dans la médiathèque` };
}
