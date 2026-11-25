import "server-only";
import type { Canal } from "@/lib/digital";
import { supabaseServeur } from "@/lib/supabase/server";

/** Mesures par mois (AAAA-MM-01), canal et indicateur, sur les 24 derniers mois. */
export type Mesures = Record<string, Partial<Record<Canal, Record<string, number>>>>;

export async function mesuresDigital(): Promise<Mesures> {
  const depuis = new Date();
  depuis.setMonth(depuis.getMonth() - 24, 1);
  const { data } = await supabaseServeur().from("ep_digital_mesures").select("mois, canal, indicateur, valeur").gte("mois", depuis.toISOString().slice(0, 10)).order("mois");
  const r: Mesures = {};
  ((data ?? []) as { mois: string; canal: Canal; indicateur: string; valeur: number }[]).forEach((m) => {
    r[m.mois] ??= {};
    r[m.mois][m.canal] ??= {};
    r[m.mois][m.canal]![m.indicateur] = Number(m.valeur);
  });
  return r;
}
