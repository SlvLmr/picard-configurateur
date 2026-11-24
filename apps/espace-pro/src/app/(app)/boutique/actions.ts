"use server";

import { revalidatePath } from "next/cache";
import { supabaseServeur } from "@/lib/supabase/server";

export type LignePanier = { produitId: string; variante: string | null; quantite: number };
export type ResultatCommande = { ok: true; message: string } | { ok: false; message: string };

/** Passe une commande via ep_commander (contrôle du rôle, du solde de points ou de l'enveloppe). */
export async function commander(lignes: LignePanier[], points: number | null, compteId: string | null): Promise<ResultatCommande> {
  if (!lignes.length) return { ok: false, message: "Le panier est vide." };
  const supabase = supabaseServeur();
  const { data, error } = await supabase.rpc("ep_commander", {
    p_lignes: lignes.map((l) => ({ produit_id: l.produitId, variante: l.variante, quantite: l.quantite })),
    ...(points !== null ? { p_points: points } : {}),
    ...(compteId ? { p_compte: compteId } : {}),
  });
  if (error) return { ok: false, message: error.message };
  const c = data as { reference: string; statut: string };
  revalidatePath("/boutique");
  const suite =
    c.statut === "a_valider"
      ? "Elle part en validation chez votre chef de marché."
      : c.statut === "paiement_en_attente"
        ? "Le paiement par carte sera demandé à l’expédition."
        : "Elle est validée.";
  return { ok: true, message: `Commande ${c.reference} passée. ${suite}` };
}
