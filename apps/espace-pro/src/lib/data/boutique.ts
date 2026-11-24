import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";
import type { ProfilReel } from "./types";

export type Categorie = "Goodies" | "Tenues" | "PLV" | "Outillage";

export type Produit = {
  id: string;
  reference: string;
  nom: string;
  description: string | null;
  categorie: Categorie;
  prixPoints: number;
  prixEuros: number;
  stock: number;
  variantes: string[];
  visuel: string | null;
};

export type StatutCommande = "a_valider" | "paiement_en_attente" | "validee" | "expediee" | "livree" | "annulee";
export type ModePaiement = "points" | "cb" | "mixte" | "enveloppe";

export type Commande = {
  id: string;
  reference: string;
  creeLe: string;
  mode: ModePaiement;
  statut: StatutCommande;
  totalEuros: number;
  pointsUtilises: number;
  montantCb: number;
  montantEnveloppe: number;
  client: string | null;
  lignes: { nom: string; variante: string | null; quantite: number }[];
};

export type ClientPortefeuille = { id: string; nom: string; niveau: string | null; ville: string | null };

export type DonneesBoutique = {
  produits: Produit[];
  commandes: Commande[];
  /** Solde réel du client connecté, null si l'utilisateur n'a pas de compte client */
  solde: number | null;
  /** Enveloppe du commercial connecté pour l'année en cours */
  enveloppe: { montant: number; consomme: number } | null;
  clients: ClientPortefeuille[];
};

type LigneCommande = {
  id: string;
  reference: string;
  cree_le: string;
  mode: ModePaiement;
  statut: StatutCommande;
  total_euros: number;
  points_utilises: number;
  montant_cb: number;
  montant_enveloppe: number;
  compte: { raison_sociale: string } | null;
  lignes: { variante: string | null; quantite: number; produit: { nom: string } | null }[];
};

export async function donneesBoutique(profil: ProfilReel): Promise<DonneesBoutique> {
  const supabase = supabaseServeur();
  const annee = new Date().getFullYear();

  const [produits, commandes, solde, enveloppe, clients] = await Promise.all([
    supabase
      .from("ep_produits")
      .select("id, reference, nom, description, categorie, prix_points, prix_euros, stock, variantes, visuel")
      .eq("actif", true)
      .order("categorie")
      .order("ordre"),
    supabase
      .from("ep_commandes")
      .select(
        `id, reference, cree_le, mode, statut, total_euros, points_utilises, montant_cb, montant_enveloppe,
         compte:ep_comptes (raison_sociale),
         lignes:ep_commande_lignes (variante, quantite, produit:ep_produits (nom))`,
      )
      .order("cree_le", { ascending: false })
      .limit(20),
    profil.compteId ? supabase.rpc("ep_solde_points", { p_compte: profil.compteId }) : Promise.resolve({ data: null }),
    profil.role === "atc" && profil.commercialId
      ? supabase.from("ep_enveloppes").select("montant").eq("commercial_id", profil.commercialId).eq("annee", annee).maybeSingle()
      : Promise.resolve({ data: null }),
    profil.role === "atc" && profil.commercialId
      ? supabase.from("ep_comptes").select("id, raison_sociale, niveau_iap, ville").eq("commercial_id", profil.commercialId).eq("actif", true).order("raison_sociale")
      : Promise.resolve({ data: [] }),
  ]);

  if (produits.error) throw new Error(`Lecture du catalogue impossible : ${produits.error.message}`);

  const lignesCommandes = (commandes.data ?? []) as unknown as LigneCommande[];
  const consomme = lignesCommandes
    .filter((c) => c.mode === "enveloppe" && c.statut !== "annulee" && new Date(c.cree_le).getFullYear() === annee)
    .reduce((s, c) => s + Number(c.montant_enveloppe), 0);

  return {
    produits: (produits.data ?? []).map((p) => ({
      id: p.id,
      reference: p.reference,
      nom: p.nom,
      description: p.description,
      categorie: p.categorie as Categorie,
      prixPoints: p.prix_points,
      prixEuros: Number(p.prix_euros),
      stock: p.stock,
      variantes: Array.isArray(p.variantes) ? (p.variantes as string[]) : [],
      visuel: p.visuel,
    })),
    commandes: lignesCommandes.map((c) => ({
      id: c.id,
      reference: c.reference,
      creeLe: c.cree_le,
      mode: c.mode,
      statut: c.statut,
      totalEuros: Number(c.total_euros),
      pointsUtilises: c.points_utilises,
      montantCb: Number(c.montant_cb),
      montantEnveloppe: Number(c.montant_enveloppe),
      client: c.compte?.raison_sociale ?? null,
      lignes: (c.lignes ?? []).map((l) => ({ nom: l.produit?.nom ?? "Produit", variante: l.variante, quantite: l.quantite })),
    })),
    solde: typeof solde.data === "number" ? solde.data : null,
    enveloppe: enveloppe.data ? { montant: Number((enveloppe.data as { montant: number }).montant), consomme } : null,
    clients: ((clients.data ?? []) as { id: string; raison_sociale: string; niveau_iap: string | null; ville: string | null }[]).map((c) => ({
      id: c.id,
      nom: c.raison_sociale,
      niveau: c.niveau_iap,
      ville: c.ville,
    })),
  };
}
