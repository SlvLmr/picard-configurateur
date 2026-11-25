import "server-only";
import { cache } from "react";
import { supabaseServeur } from "@/lib/supabase/server";

/** Textes de l'interface modifiés par l'administrateur, par clé. */
export const textesPersonnalises = cache(async (): Promise<Record<string, string>> => {
  const { data, error } = await supabaseServeur().from("ep_textes").select("cle, valeur");
  if (error || !data) return {};
  return Object.fromEntries((data as { cle: string; valeur: string }[]).map((t) => [t.cle, t.valeur]));
});
