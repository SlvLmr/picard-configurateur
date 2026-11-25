import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";

export type Secteur = { force: string; code: string; nom: string; departements: string[]; commercial: string | null };

/** Secteurs commerciaux par force de vente, avec leurs départements et le commercial affecté. */
export async function secteursZoning(): Promise<Secteur[]> {
  const supabase = supabaseServeur();
  const [{ data: secteurs }, { data: affectations }, { data: commerciaux }] = await Promise.all([
    supabase.from("ep_secteurs").select("force, code, nom, departements").order("force").order("nom"),
    supabase.from("affectations").select("force, secteur, ordre, commercial_id").order("ordre"),
    supabase.rpc("ep_crm_commerciaux"),
  ]);
  const parId = new Map(((commerciaux ?? []) as { id: string; prenom: string | null; nom: string | null }[]).map((c) => [c.id, [c.prenom, c.nom].filter(Boolean).join(" ")]));
  const noms = new Map<string, string>();
  ((affectations ?? []) as { force: string; secteur: string; commercial_id: string }[]).forEach((a) => {
    const k = `${a.force}:${a.secteur}`;
    if (!noms.has(k) && parId.get(a.commercial_id)) noms.set(k, parId.get(a.commercial_id)!);
  });
  return ((secteurs ?? []) as Omit<Secteur, "commercial">[]).map((s) => ({ ...s, commercial: noms.get(`${s.force}:${s.code}`) ?? null }));
}
