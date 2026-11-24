import "server-only";
import type { SavDecision, SavResolution, SavStatut, SavType } from "@/components/sav/libelles";
import { supabaseServeur } from "@/lib/supabase/server";

export type DemandeSav = {
  id: string;
  reference: string;
  creeLe: string;
  misAJourLe: string;
  compteId: string;
  compteNom: string | null;
  declarantNom: string | null;
  type: SavType;
  gamme: string | null;
  produit: string | null;
  referenceProduit: string | null;
  numeroCommande: string | null;
  numeroSerie: string | null;
  description: string;
  adresseChantier: string | null;
  statut: SavStatut;
  affecteA: string | null;
  decision: SavDecision | null;
  decisionMotif: string | null;
  resolution: SavResolution | null;
  avoirReference: string | null;
  avoirMontant: number | null;
  bonRetour: string | null;
  resoluLe: string | null;
  nonConformite: boolean | null;
  cause: string | null;
  actionCorrective: string | null;
  demo: boolean;
};

export type MessageSav = { id: number; auteurNom: string; auteurRole: string | null; contenu: string; interne: boolean; creeLe: string; deMoi: boolean };
export type FichierSav = { id: number; nom: string; typeMime: string | null; tailleOctets: number | null; url: string | null; creeLe: string };
export type EvenementSav = { id: number; type: string; statut: SavStatut | null; creeLe: string };
export type Intervenant = { id: string; nom: string; role: string };
export type CompteChoix = { id: string; nom: string; ville: string | null };

export type StatsSav = {
  total: number;
  ouvertes: number;
  nouvelles: number;
  infos_demandees: number;
  avis_technique: number;
  non_affectees: number;
  delai_resolution_jours: number | null;
  taux_garantie_pct: number | null;
  non_conformites: number;
  par_type: Partial<Record<SavType, number>>;
  par_statut: Partial<Record<SavStatut, number>>;
  nc_par_gamme: Record<string, number>;
  nc_par_cause: Record<string, number>;
};

const COLONNES =
  "id, reference, cree_le, mis_a_jour_le, compte_id, declarant_nom, type, gamme, produit, reference_produit, numero_commande, numero_serie, description, adresse_chantier, statut, affecte_a, decision, decision_motif, resolution, avoir_reference, avoir_montant, bon_retour, resolu_le, non_conformite, cause, action_corrective, demo, compte:ep_comptes!ep_sav_demandes_compte_id_fkey (raison_sociale)";

type Ligne = {
  id: string;
  reference: string;
  cree_le: string;
  mis_a_jour_le: string;
  compte_id: string;
  declarant_nom: string | null;
  type: SavType;
  gamme: string | null;
  produit: string | null;
  reference_produit: string | null;
  numero_commande: string | null;
  numero_serie: string | null;
  description: string;
  adresse_chantier: string | null;
  statut: SavStatut;
  affecte_a: string | null;
  decision: SavDecision | null;
  decision_motif: string | null;
  resolution: SavResolution | null;
  avoir_reference: string | null;
  avoir_montant: number | string | null;
  bon_retour: string | null;
  resolu_le: string | null;
  non_conformite: boolean | null;
  cause: string | null;
  action_corrective: string | null;
  demo: boolean;
  compte: { raison_sociale: string } | null;
};

const versDemande = (l: Ligne): DemandeSav => ({
  id: l.id,
  reference: l.reference,
  creeLe: l.cree_le,
  misAJourLe: l.mis_a_jour_le,
  compteId: l.compte_id,
  compteNom: l.compte?.raison_sociale ?? null,
  declarantNom: l.declarant_nom,
  type: l.type,
  gamme: l.gamme,
  produit: l.produit,
  referenceProduit: l.reference_produit,
  numeroCommande: l.numero_commande,
  numeroSerie: l.numero_serie,
  description: l.description,
  adresseChantier: l.adresse_chantier,
  statut: l.statut,
  affecteA: l.affecte_a,
  decision: l.decision,
  decisionMotif: l.decision_motif,
  resolution: l.resolution,
  avoirReference: l.avoir_reference,
  avoirMontant: l.avoir_montant === null ? null : Number(l.avoir_montant),
  bonRetour: l.bon_retour,
  resoluLe: l.resolu_le,
  nonConformite: l.non_conformite,
  cause: l.cause,
  actionCorrective: l.action_corrective,
  demo: l.demo,
});

/** Demandes visibles par l'utilisateur : la base filtre selon son rôle. */
export async function demandesSav(): Promise<DemandeSav[]> {
  const { data, error } = await supabaseServeur().from("ep_sav_demandes").select(COLONNES).order("mis_a_jour_le", { ascending: false }).limit(300);
  if (error) throw new Error(`Lecture des demandes SAV impossible : ${error.message}`);
  return ((data ?? []) as unknown as Ligne[]).map(versDemande);
}

export async function statsSav(): Promise<StatsSav | null> {
  const { data, error } = await supabaseServeur().rpc("ep_sav_stats");
  if (error) return null;
  return data as StatsSav;
}

export async function intervenantsSav(): Promise<Intervenant[]> {
  const { data } = await supabaseServeur().rpc("ep_sav_intervenants");
  return (data ?? []) as Intervenant[];
}

/** Comptes pour lesquels l'utilisateur peut déclarer (commercial : son portefeuille, SAV : tous). */
export async function comptesDeclarables(): Promise<CompteChoix[]> {
  const { data } = await supabaseServeur().from("ep_comptes").select("id, raison_sociale, ville").eq("actif", true).order("raison_sociale").limit(500);
  return (data ?? []).map((c) => ({ id: c.id, nom: c.raison_sociale, ville: c.ville }));
}

/** Une demande avec son fil d'échanges, ses fichiers (liens temporaires de 10 minutes) et son historique. */
export async function demandeSav(
  id: string,
  moi: string,
): Promise<{ demande: DemandeSav; messages: MessageSav[]; fichiers: FichierSav[]; evenements: EvenementSav[] } | null> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase.from("ep_sav_demandes").select(COLONNES).eq("id", id).maybeSingle();
  if (error || !data) return null;

  const [{ data: msgs }, { data: fics }, { data: evts }] = await Promise.all([
    supabase.from("ep_sav_messages").select("id, auteur, auteur_nom, auteur_role, contenu, interne, cree_le").eq("demande_id", id).order("cree_le"),
    supabase.from("ep_sav_fichiers").select("id, chemin, nom, type_mime, taille_octets, cree_le").eq("demande_id", id).order("cree_le"),
    supabase.from("ep_sav_evenements").select("id, type, statut, cree_le").eq("demande_id", id).order("cree_le"),
  ]);

  const fichiers: FichierSav[] = await Promise.all(
    (fics ?? []).map(async (f) => {
      const { data: lien } = await supabase.storage.from("ep-sav").createSignedUrl(f.chemin, 600);
      return { id: f.id, nom: f.nom, typeMime: f.type_mime, tailleOctets: f.taille_octets, url: lien?.signedUrl ?? null, creeLe: f.cree_le };
    }),
  );

  return {
    demande: versDemande(data as unknown as Ligne),
    messages: (msgs ?? []).map((m) => ({
      id: m.id,
      auteurNom: m.auteur_nom,
      auteurRole: m.auteur_role,
      contenu: m.contenu,
      interne: m.interne,
      creeLe: m.cree_le,
      deMoi: m.auteur === moi,
    })),
    fichiers,
    evenements: (evts ?? []).map((e) => ({ id: e.id, type: e.type, statut: e.statut, creeLe: e.cree_le })),
  };
}
