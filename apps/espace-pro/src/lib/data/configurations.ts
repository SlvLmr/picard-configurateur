import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";

export type StatutConfiguration = "brouillon" | "devis" | "commande";
export type StatutCommandePorte = "transmise_adv" | "en_fabrication" | "expediee";

export type ConfigurationEnregistree = {
  id: string;
  reference: string;
  modele: string;
  chantier: string | null;
  clientFinal: string | null;
  donnees: unknown;
  prixAchat: number;
  prixVente: number | null;
  statut: StatutConfiguration;
  devisLe: string | null;
  creeLe: string;
  majLe: string;
  leadId: string | null;
  compte: { raisonSociale: string; cp: string | null; ville: string | null; numeroClient: string | null } | null;
  commande: { reference: string; statut: StatutCommandePorte; creeLe: string } | null;
};

type CommandeLigne = { reference: string; statut: StatutCommandePorte; cree_le: string };
type Ligne = {
  id: string;
  reference: string;
  modele: string;
  chantier: string | null;
  client_final: string | null;
  donnees: unknown;
  prix_achat: number;
  prix_vente: number | null;
  statut: StatutConfiguration;
  devis_le: string | null;
  cree_le: string;
  maj_le: string;
  lead_id: string | null;
  compte: { raison_sociale: string; cp: string | null; ville: string | null; numero_client: string | null } | null;
  commande: CommandeLigne[] | CommandeLigne | null;
};

const COLONNES = `id, reference, modele, chantier, client_final, donnees, prix_achat, prix_vente, statut, devis_le, cree_le, maj_le, lead_id,
  compte:ep_comptes (raison_sociale, cp, ville, numero_client),
  commande:ep_commandes_portes (reference, statut, cree_le)`;

function convertir(l: Ligne): ConfigurationEnregistree {
  const cmd = Array.isArray(l.commande) ? (l.commande[0] ?? null) : l.commande;
  return {
    id: l.id,
    reference: l.reference,
    modele: l.modele,
    chantier: l.chantier,
    clientFinal: l.client_final,
    donnees: l.donnees,
    prixAchat: Number(l.prix_achat),
    prixVente: l.prix_vente === null ? null : Number(l.prix_vente),
    statut: l.statut,
    devisLe: l.devis_le,
    creeLe: l.cree_le,
    majLe: l.maj_le,
    leadId: l.lead_id,
    compte: l.compte
      ? { raisonSociale: l.compte.raison_sociale, cp: l.compte.cp, ville: l.compte.ville, numeroClient: l.compte.numero_client }
      : null,
    commande: cmd ? { reference: cmd.reference, statut: cmd.statut, creeLe: cmd.cree_le } : null,
  };
}

/** Configurations visibles par l'utilisateur (règles par ligne), les plus récentes d'abord. */
export async function mesConfigurations(limite = 100): Promise<ConfigurationEnregistree[]> {
  const { data, error } = await supabaseServeur().from("ep_configurations").select(COLONNES).order("maj_le", { ascending: false }).limit(limite);
  if (error) throw new Error(`Lecture des configurations impossible : ${error.message}`);
  return ((data ?? []) as unknown as Ligne[]).map(convertir);
}

export async function configurationParId(id: string): Promise<ConfigurationEnregistree | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabaseServeur().from("ep_configurations").select(COLONNES).eq("id", id).maybeSingle();
  return data ? convertir(data as unknown as Ligne) : null;
}
