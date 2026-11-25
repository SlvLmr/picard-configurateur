import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";

export type CommandeNavision = { numero: string; date: string | null; client: string | null; codeLead: string | null; montant: number | null; lead: { id: string; reference: string; projet: string } | null };
export type ImportNavision = { id: string; fichier: string; lignes: number; rapprochees: number; le: string };

export async function donneesNavision(): Promise<{ commandes: CommandeNavision[]; imports: ImportNavision[]; leadsAttribues: number }> {
  const supabase = supabaseServeur();
  const [{ data: c }, { data: i }, { count }] = await Promise.all([
    supabase.from("ep_navision_commandes").select("numero, date_commande, client, code_lead, montant_ht, lead:ep_leads (id, reference, projet)").order("date_commande", { ascending: false, nullsFirst: false }).limit(1000),
    supabase.from("ep_navision_imports").select("id, fichier, nb_lignes, nb_rapprochees, importe_le").order("importe_le", { ascending: false }).limit(24),
    supabase.from("ep_leads").select("id", { count: "exact", head: true }).not("attribue_le", "is", null),
  ]);
  type LC = { numero: string; date_commande: string | null; client: string | null; code_lead: string | null; montant_ht: number | null; lead: { id: string; reference: string; projet: string } | null };
  type LI = { id: string; fichier: string; nb_lignes: number; nb_rapprochees: number; importe_le: string };
  return {
    commandes: ((c ?? []) as unknown as LC[]).map((x) => ({ numero: x.numero, date: x.date_commande, client: x.client, codeLead: x.code_lead, montant: x.montant_ht === null ? null : Number(x.montant_ht), lead: x.lead })),
    imports: ((i ?? []) as LI[]).map((x) => ({ id: x.id, fichier: x.fichier, lignes: x.nb_lignes, rapprochees: x.nb_rapprochees, le: x.importe_le })),
    leadsAttribues: count ?? 0,
  };
}
