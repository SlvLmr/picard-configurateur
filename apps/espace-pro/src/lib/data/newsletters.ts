import "server-only";
import type { Bloc } from "@/lib/newsletter";
import { supabaseServeur } from "@/lib/supabase/server";

export type Newsletter = {
  id: string; objet: string; preheader: string; blocs: Bloc[]; cible: string; statut: "brouillon" | "envoyee";
  nbDestinataires: number | null; envoyeeLe: string | null; majLe: string;
};

export async function listeNewsletters(): Promise<Newsletter[]> {
  const { data } = await supabaseServeur().from("ep_newsletters").select("id, objet, preheader, blocs, cible, statut, nb_destinataires, envoyee_le, maj_le").order("maj_le", { ascending: false }).limit(100);
  type L = { id: string; objet: string; preheader: string; blocs: Bloc[]; cible: string; statut: Newsletter["statut"]; nb_destinataires: number | null; envoyee_le: string | null; maj_le: string };
  return ((data ?? []) as L[]).map((n) => ({ id: n.id, objet: n.objet, preheader: n.preheader, blocs: n.blocs ?? [], cible: n.cible, statut: n.statut, nbDestinataires: n.nb_destinataires, envoyeeLe: n.envoyee_le, majLe: n.maj_le }));
}
