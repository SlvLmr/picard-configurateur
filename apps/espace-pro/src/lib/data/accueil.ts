import "server-only";
import type { NiveauIAP, RoleId } from "@/lib/roles";
import { supabaseServeur } from "@/lib/supabase/server";

export type Recap = {
  leads_a_valider: number;
  leads_a_accepter: number;
  leads_en_suivi: number;
  sav_ouverts: number;
  sav_reponse_attendue: number;
  sav_nouveaux: number;
  commandes_a_valider: number;
  configurations_devis: number;
  visites_aujourdhui: number;
  actions_en_retard: number;
  points: number;
};

export type Annonce = {
  id: string;
  titre: string;
  contenu: string;
  ton: "info" | "operation" | "important";
  lienLibelle: string | null;
  lienUrl: string | null;
  epinglee: boolean;
  debut: string;
  fin: string | null;
  roles: RoleId[];
  niveaux: NiveauIAP[];
  archivee: boolean;
  /** Photos jointes, avec un lien signé valable une heure */
  photos: { chemin: string; url: string }[];
  /** Date et heure d'envoi */
  creeLe: string;
};

export type TypeAgenda =
  | "salon" | "campagne" | "digital" | "ressource" | "pos" | "reseau"
  | "formation" | "operation" | "webinaire" | "reunion" | "visite" | "echeance";

export type ElementAgenda = {
  id: string;
  type: TypeAgenda;
  titre: string;
  debut: string;
  fin: string | null;
  lieu: string | null;
  description: string | null;
  href: string | null;
};

export const RECAP_VIDE: Recap = {
  leads_a_valider: 0, leads_a_accepter: 0, leads_en_suivi: 0, sav_ouverts: 0, sav_reponse_attendue: 0, sav_nouveaux: 0,
  commandes_a_valider: 0, configurations_devis: 0, visites_aujourdhui: 0, actions_en_retard: 0, points: 0,
};

export async function recapAccueil(): Promise<Recap> {
  const { data, error } = await supabaseServeur().rpc("ep_accueil_recap");
  if (error || !data) return RECAP_VIDE;
  return { ...RECAP_VIDE, ...(data as Partial<Recap>) };
}

type LigneAnnonce = {
  id: string; titre: string; contenu: string; ton: Annonce["ton"]; lien_libelle: string | null; lien_url: string | null;
  epinglee: boolean; debut: string; fin: string | null; roles: RoleId[]; niveaux: NiveauIAP[]; archivee: boolean; photos?: string[] | null; cree_le?: string;
};
const versAnnonce = (a: LigneAnnonce): Annonce => ({
  id: a.id, titre: a.titre, contenu: a.contenu, ton: a.ton, lienLibelle: a.lien_libelle, lienUrl: a.lien_url,
  epinglee: a.epinglee, debut: a.debut, fin: a.fin, roles: a.roles, niveaux: a.niveaux, archivee: a.archivee, photos: [], creeLe: a.cree_le ?? a.debut,
});

/** Ajoute aux annonces les liens signés de leurs photos (un seul appel au stockage). */
async function avecPhotos(lignes: LigneAnnonce[]): Promise<Annonce[]> {
  const chemins = lignes.flatMap((a) => a.photos ?? []);
  const liens = new Map<string, string>();
  if (chemins.length) {
    const { data } = await supabaseServeur().storage.from("ep-annonces").createSignedUrls(chemins, 3600);
    (data ?? []).forEach((d) => {
      if (d.path && d.signedUrl) liens.set(d.path, d.signedUrl);
    });
  }
  return lignes.map((a) => ({
    ...versAnnonce(a),
    photos: (a.photos ?? []).filter((c) => liens.has(c)).map((c) => ({ chemin: c, url: liens.get(c)! })),
  }));
}

/** Annonces actives visibles par l'utilisateur, épinglées d'abord (3 au plus). */
export async function annoncesAccueil(): Promise<Annonce[]> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseServeur()
    .from("ep_annonces")
    .select("*")
    .eq("archivee", false)
    .lte("debut", aujourdhui)
    .or(`fin.is.null,fin.gte.${aujourdhui}`)
    .order("epinglee", { ascending: false })
    .order("debut", { ascending: false })
    .limit(3);
  return ((data ?? []) as LigneAnnonce[]).map(versAnnonce);
}

/** Toutes les annonces, pour l'écran de publication (administrateur). */
export async function toutesAnnonces(): Promise<Annonce[]> {
  const { data } = await supabaseServeur().from("ep_annonces").select("*").order("cree_le", { ascending: false }).limit(50);
  return ((data ?? []) as LigneAnnonce[]).map(versAnnonce);
}

/**
 * Agenda de l'utilisateur sur une fenêtre de dates : événements du réseau,
 * visites planifiées et échéances d'actions (selon ses droits).
 */
export async function agenda(debut: Date, fin: Date): Promise<ElementAgenda[]> {
  const supabase = supabaseServeur();
  const d = debut.toISOString();
  const f = fin.toISOString();
  const [ev, act, ech] = await Promise.all([
    supabase.from("ep_evenements").select("id, titre, type, description, lieu, debut, fin, lien_url").eq("archive", false).gte("debut", d).lte("debut", f).order("debut"),
    supabase
      .from("ep_activites")
      .select("id, objet, type, date_prevue, compte_id, compte:ep_comptes!ep_activites_compte_id_fkey (raison_sociale)")
      .eq("statut", "planifiee")
      .gte("date_prevue", d)
      .lte("date_prevue", f)
      .order("date_prevue")
      .limit(200),
    supabase
      .from("ep_actions")
      .select("id, titre, echeance, compte_id, compte:ep_comptes!ep_actions_compte_id_fkey (raison_sociale)")
      .eq("statut", "a_faire")
      .gte("echeance", d.slice(0, 10))
      .lte("echeance", f.slice(0, 10))
      .order("echeance")
      .limit(200),
  ]);
  type Ev = { id: string; titre: string; type: TypeAgenda; description: string | null; lieu: string | null; debut: string; fin: string | null; lien_url: string | null };
  type Act = { id: string; objet: string; date_prevue: string; compte_id: string; compte: { raison_sociale: string } | null };
  type Ech = { id: string; titre: string; echeance: string; compte_id: string; compte: { raison_sociale: string } | null };
  return [
    ...((ev.data ?? []) as Ev[]).map((e) => ({ id: e.id, type: e.type, titre: e.titre, debut: e.debut, fin: e.fin, lieu: e.lieu, description: e.description, href: e.lien_url })),
    ...((act.data ?? []) as unknown as Act[]).map((a) => ({
      id: a.id, type: "visite" as const, titre: a.compte?.raison_sociale ?? "Visite", debut: a.date_prevue, fin: null, lieu: null, description: a.objet, href: `/crm/${a.compte_id}`,
    })),
    ...((ech.data ?? []) as unknown as Ech[]).map((a) => ({
      id: a.id, type: "echeance" as const, titre: a.titre, debut: `${a.echeance}T09:00:00`, fin: null, lieu: null, description: a.compte?.raison_sociale ?? null, href: `/crm/${a.compte_id}`,
    })),
  ].sort((x, y) => x.debut.localeCompare(y.debut));
}

export async function tousEvenements(): Promise<ElementAgenda[]> {
  const { data } = await supabaseServeur().from("ep_evenements").select("id, titre, type, description, lieu, debut, fin, lien_url, archive").eq("archive", false).order("debut").limit(100);
  return ((data ?? []) as { id: string; titre: string; type: TypeAgenda; description: string | null; lieu: string | null; debut: string; fin: string | null; lien_url: string | null }[]).map((e) => ({
    id: e.id, type: e.type, titre: e.titre, debut: e.debut, fin: e.fin, lieu: e.lieu, description: e.description, href: e.lien_url,
  }));
}

/** Toutes les annonces en cours visibles par l'utilisateur (page Messages). */
export async function annoncesActives(): Promise<Annonce[]> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseServeur()
    .from("ep_annonces")
    .select("*")
    .eq("archivee", false)
    .lte("debut", aujourdhui)
    .or(`fin.is.null,fin.gte.${aujourdhui}`)
    .order("epinglee", { ascending: false })
    .order("debut", { ascending: false })
    .limit(50);
  return avecPhotos((data ?? []) as LigneAnnonce[]);
}
