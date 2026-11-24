import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";

export type TypeRessource = "photo" | "video" | "doc_commerciale" | "doc_technique";
export type MarqueRessource = "picard" | "eliot" | "commune";

export type Ressource = {
  id: string;
  titre: string;
  description: string | null;
  type: TypeRessource;
  gamme: string | null;
  marque: MarqueRessource;
  fichierChemin: string | null;
  tailleOctets: number | null;
  format: string | null;
  version: number;
  rolesAutorises: string[];
  niveauxAutorises: string[];
  kit: string | null;
  nouveau: boolean;
  demo: boolean;
  creeLe: string;
  misAJourLe: string;
  telechargements: number;
};

export type StatsMediatheque = {
  ressources: number;
  nouveautes: number;
  mises_a_jour: number;
  telechargements: number;
  par_ressource: Record<string, number>;
};

type Ligne = {
  id: string;
  titre: string;
  description: string | null;
  type: TypeRessource;
  gamme: string | null;
  marque: MarqueRessource;
  fichier_chemin: string | null;
  taille_octets: number | null;
  format: string | null;
  version: number;
  roles_autorises: string[] | null;
  niveaux_autorises: string[] | null;
  kit: string | null;
  nouveau: boolean;
  demo: boolean;
  cree_le: string;
  mis_a_jour_le: string;
};

/** Ressources visibles par l'utilisateur connecté : la base filtre selon son rôle et son niveau IAP. */
export async function ressourcesVisibles(): Promise<{ ressources: Ressource[]; stats: StatsMediatheque | null }> {
  const supabase = supabaseServeur();
  const [{ data, error }, { data: stats }] = await Promise.all([
    supabase
      .from("ep_ressources")
      .select(
        "id, titre, description, type, gamme, marque, fichier_chemin, taille_octets, format, version, roles_autorises, niveaux_autorises, kit, nouveau, demo, cree_le, mis_a_jour_le",
      )
      .order("mis_a_jour_le", { ascending: false }),
    supabase.rpc("ep_stats_mediatheque", { p_jours: 30 }),
  ]);
  if (error) throw new Error(`Lecture de la médiathèque impossible : ${error.message}`);
  const s = (stats ?? null) as StatsMediatheque | null;

  const ressources = ((data ?? []) as Ligne[]).map((r) => ({
    id: r.id,
    titre: r.titre,
    description: r.description,
    type: r.type,
    gamme: r.gamme,
    marque: r.marque,
    fichierChemin: r.fichier_chemin,
    tailleOctets: r.taille_octets,
    format: r.format,
    version: r.version,
    rolesAutorises: r.roles_autorises ?? [],
    niveauxAutorises: r.niveaux_autorises ?? [],
    kit: r.kit,
    nouveau: r.nouveau,
    demo: r.demo,
    creeLe: r.cree_le,
    misAJourLe: r.mis_a_jour_le,
    telechargements: s?.par_ressource?.[r.id] ?? 0,
  }));
  return { ressources, stats: s };
}
