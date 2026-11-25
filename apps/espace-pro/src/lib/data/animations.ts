import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";

export type TypeAnimation = "offre" | "remboursement" | "parrainage";
export type StatutParticipation = "inscrit" | "depose" | "valide" | "paye" | "refuse";

export type Animation = {
  id: string; type: TypeAnimation; titre: string; accroche: string | null; description: string | null; conditions: string | null;
  debut: string; fin: string | null; montant: number | null; points: number | null; produits: string | null; lienKit: string | null;
  niveaux: string[]; publie: boolean; demo: boolean;
};
export type Participation = {
  id: string; animationId: string; compte: string; statut: StatutParticipation; reference: string | null; clientFinal: string | null;
  montant: number | null; motif: string | null; creeLe: string;
};
export type Parrainage = { id: string; animationId: string; compte: string; filleulNom: string; filleulEmail: string | null; statut: "invite" | "inscrit" | "recompense"; creeLe: string };

/** Animations visibles, participations et parrainages du périmètre de l'utilisateur (la base filtre). */
export async function donneesAnimations(client: boolean) {
  const supabase = supabaseServeur();
  const [{ data: a }, { data: p }, { data: f }, code] = await Promise.all([
    supabase.from("ep_animations").select("*").order("debut"),
    supabase.from("ep_animation_participations").select("id, animation_id, statut, reference, client_final, montant, motif, cree_le, compte:ep_comptes (raison_sociale)").order("cree_le", { ascending: false }).limit(1000),
    supabase.from("ep_parrainages").select("id, animation_id, filleul_nom, filleul_email, statut, cree_le, compte:ep_comptes (raison_sociale)").order("cree_le", { ascending: false }).limit(1000),
    client ? supabase.rpc("ep_mon_code_parrainage") : Promise.resolve({ data: null }),
  ]);
  type LA = { id: string; type: TypeAnimation; titre: string; accroche: string | null; description: string | null; conditions: string | null; debut: string; fin: string | null; montant: number | null; points: number | null; produits: string | null; lien_kit: string | null; niveaux: string[]; publie: boolean; demo: boolean };
  type LP = { id: string; animation_id: string; statut: StatutParticipation; reference: string | null; client_final: string | null; montant: number | null; motif: string | null; cree_le: string; compte: { raison_sociale: string } | null };
  type LF = { id: string; animation_id: string; filleul_nom: string; filleul_email: string | null; statut: Parrainage["statut"]; cree_le: string; compte: { raison_sociale: string } | null };
  return {
    animations: ((a ?? []) as LA[]).map((x) => ({
      id: x.id, type: x.type, titre: x.titre, accroche: x.accroche, description: x.description, conditions: x.conditions, debut: x.debut, fin: x.fin,
      montant: x.montant === null ? null : Number(x.montant), points: x.points, produits: x.produits, lienKit: x.lien_kit, niveaux: x.niveaux ?? [], publie: x.publie, demo: x.demo,
    })) as Animation[],
    participations: ((p ?? []) as unknown as LP[]).map((x) => ({
      id: x.id, animationId: x.animation_id, compte: x.compte?.raison_sociale ?? "", statut: x.statut, reference: x.reference, clientFinal: x.client_final,
      montant: x.montant === null ? null : Number(x.montant), motif: x.motif, creeLe: x.cree_le,
    })) as Participation[],
    parrainages: ((f ?? []) as unknown as LF[]).map((x) => ({
      id: x.id, animationId: x.animation_id, compte: x.compte?.raison_sociale ?? "", filleulNom: x.filleul_nom, filleulEmail: x.filleul_email, statut: x.statut, creeLe: x.cree_le,
    })) as Parrainage[],
    code: (code.data as string | null) ?? null,
  };
}
