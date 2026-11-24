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
  produitId: string | null;
  gammeCode: string | null;
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
  produit_id: string | null;
  gamme_code: string | null;
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
        "id, titre, description, type, gamme, produit_id, gamme_code, marque, fichier_chemin, taille_octets, format, version, roles_autorises, niveaux_autorises, kit, nouveau, demo, cree_le, mis_a_jour_le",
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
    produitId: r.produit_id,
    gammeCode: r.gamme_code,
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

export type Gamme = { code: string; nom: string; description: string | null };
export type ProduitMedia = { id: string; gammeCode: string; nom: string; description: string | null; marque: MarqueRessource; actif: boolean; demo: boolean };

/** Gammes et produits de la médiathèque (les produits inactifs ne sont visibles que de l'administrateur). */
export async function catalogueMedia(): Promise<{ gammes: Gamme[]; produits: ProduitMedia[] }> {
  const supabase = supabaseServeur();
  const [{ data: g }, { data: p }] = await Promise.all([
    supabase.from("ep_gammes").select("code, nom, description").order("ordre"),
    supabase.from("ep_media_produits").select("id, gamme_code, nom, description, marque, actif, demo").order("ordre"),
  ]);
  return {
    gammes: (g ?? []) as Gamme[],
    produits: ((p ?? []) as { id: string; gamme_code: string; nom: string; description: string | null; marque: MarqueRessource; actif: boolean; demo: boolean }[]).map((x) => ({
      id: x.id, gammeCode: x.gamme_code, nom: x.nom, description: x.description, marque: x.marque, actif: x.actif, demo: x.demo,
    })),
  };
}
