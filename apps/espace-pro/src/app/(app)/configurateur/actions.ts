"use server";

import { revalidatePath } from "next/cache";
import type { Configuration } from "@/lib/configurateur/catalogue";
import { supabaseServeur } from "@/lib/supabase/server";

export type EtapeConfiguration = "enregistrer" | "devis" | "commander";

export type ResultatConfiguration =
  | { ok: true; id: string; reference: string; message: string }
  | { ok: false; message: string; id?: string };

/**
 * Enregistre la configuration (création ou mise à jour), puis, selon l'étape,
 * génère le devis ou passe la commande. Toutes les vérifications sont faites en base.
 */
export async function traiterConfiguration(
  etape: EtapeConfiguration,
  saisie: { id: string | null; configuration: Configuration; prixAchat: number; prixVente: number | null; leadId: string | null },
): Promise<ResultatConfiguration> {
  const supabase = supabaseServeur();
  const c = saisie.configuration;
  const { data, error } = await supabase.rpc("ep_enregistrer_configuration", {
    p_donnees: c,
    p_modele: c.modele,
    p_prix_achat: saisie.prixAchat,
    ...(saisie.prixVente !== null ? { p_prix_vente: saisie.prixVente } : {}),
    p_chantier: c.reference,
    p_client_final: c.clientFinal,
    ...(saisie.id ? { p_id: saisie.id } : {}),
    ...(saisie.leadId ? { p_lead: saisie.leadId } : {}),
  });
  if (error) return { ok: false, message: error.message, id: saisie.id ?? undefined };
  const enregistree = data as { id: string; reference: string };
  revalidatePath("/configurateur/mes-configurations");

  if (etape === "devis") {
    const r = await supabase.rpc("ep_generer_devis", { p_id: enregistree.id });
    if (r.error) return { ok: false, message: r.error.message, id: enregistree.id };
    return { ok: true, id: enregistree.id, reference: enregistree.reference, message: `Devis ${enregistree.reference} généré` };
  }
  if (etape === "commander") {
    const r = await supabase.rpc("ep_commander_configuration", { p_id: enregistree.id });
    if (r.error) return { ok: false, message: r.error.message, id: enregistree.id };
    return {
      ok: true,
      id: enregistree.id,
      reference: enregistree.reference,
      message: `Commande ${(r.data as { reference: string }).reference} transmise à l’ADV`,
    };
  }
  return { ok: true, id: enregistree.id, reference: enregistree.reference, message: `Configuration ${enregistree.reference} enregistrée` };
}
