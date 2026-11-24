import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";
import type { NiveauIAP } from "@/lib/roles";
import type { LeadStatutDb, ProfilReel } from "./types";

export const ROLES_CRM = ["admin", "codir", "chef_service", "chef_marche", "repartiteur", "atc"] as const;
export const peutVoirCrm = (p: ProfilReel | null) => !!p && (ROLES_CRM as readonly string[]).includes(p.role);

export type CommercialNom = { id: string; prenom: string; nom: string; equipe: string };

export type CompteCrm = {
  id: string;
  numeroClient: string | null;
  raisonSociale: string;
  type: string;
  niveau: NiveauIAP | null;
  cp: string | null;
  ville: string | null;
  departement: string | null;
  commercialId: string | null;
  actif: boolean;
  leads: number;
  signes: number;
  enCours: number;
  points: number;
  dernierLead: string | null;
};

type LigneCompte = {
  id: string;
  numero_client: string | null;
  raison_sociale: string;
  type: string;
  niveau_iap: NiveauIAP | null;
  cp: string | null;
  ville: string | null;
  departement: string | null;
  commercial_id: string | null;
  actif: boolean;
};
type LigneActivite = { compte_id: string; leads: number; signes: number; en_cours: number; points: number; dernier_lead: string | null };

const versCompte = (c: LigneCompte, a?: LigneActivite): CompteCrm => ({
  id: c.id,
  numeroClient: c.numero_client,
  raisonSociale: c.raison_sociale,
  type: c.type,
  niveau: c.niveau_iap,
  cp: c.cp,
  ville: c.ville,
  departement: c.departement,
  commercialId: c.commercial_id,
  actif: c.actif,
  leads: a?.leads ?? 0,
  signes: a?.signes ?? 0,
  enCours: a?.en_cours ?? 0,
  points: a?.points ?? 0,
  dernierLead: a?.dernier_lead ?? null,
});

const COLONNES = "id, numero_client, raison_sociale, type, niveau_iap, cp, ville, departement, commercial_id, actif";

const capitaliser = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Noms des commerciaux (lus via une fonction : la table Commerce est réservée à ses administrateurs). */
export async function commerciaux(): Promise<CommercialNom[]> {
  const { data } = await supabaseServeur().rpc("ep_crm_commerciaux");
  return ((data ?? []) as CommercialNom[]).map((c) => ({ ...c, nom: capitaliser(c.nom) }));
}

/** Portefeuille visible par l'utilisateur (la RLS limite un commercial à ses comptes). */
export async function portefeuille(): Promise<CompteCrm[]> {
  const supabase = supabaseServeur();
  const [{ data: comptes, error }, { data: activite }] = await Promise.all([
    supabase.from("ep_comptes").select(COLONNES).order("raison_sociale"),
    supabase.rpc("ep_crm_activite_comptes", { p_jours: 365 }),
  ]);
  if (error) throw new Error(`Lecture du portefeuille impossible : ${error.message}`);
  const parCompte = new Map(((activite ?? []) as LigneActivite[]).map((a) => [a.compte_id, a]));
  return ((comptes ?? []) as LigneCompte[]).map((c) => versCompte(c, parCompte.get(c.id)));
}

export type LeadCompte = { id: string; reference: string; recuLe: string; projet: string; source: string; statut: LeadStatutDb; contact: string };
export type EvenementCompte = { id: number; type: string; statut: LeadStatutDb | null; creeLe: string; reference: string | null };
export type PointsCompte = { id: number; points: number; motif: string; creeLe: string };

export type FicheCompte = {
  compte: CompteCrm;
  leads: LeadCompte[];
  evenements: EvenementCompte[];
  points: PointsCompte[];
};

type LigneEvenement = { id: number; type: string; statut: LeadStatutDb | null; cree_le: string; lead: { reference: string } | null };

/** Fiche complète d'un compte, ou null s'il n'existe pas ou n'est pas visible par l'utilisateur. */
export async function ficheCompte(id: string): Promise<FicheCompte | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = supabaseServeur();
  const { data: c } = await supabase.from("ep_comptes").select(COLONNES).eq("id", id).maybeSingle();
  if (!c) return null;

  const [{ data: leads }, { data: evenements }, { data: points }] = await Promise.all([
    supabase
      .from("ep_leads")
      .select("id, reference, recu_le, projet, source, statut, contact_nom")
      .eq("compte_id", id)
      .order("recu_le", { ascending: false })
      .limit(50),
    supabase
      .from("ep_lead_evenements")
      .select("id, type, statut, cree_le, lead:ep_leads!ep_lead_evenements_lead_id_fkey (reference)")
      .eq("compte_id", id)
      .order("cree_le", { ascending: false })
      .limit(40),
    supabase.from("ep_points").select("id, points, motif, cree_le").eq("compte_id", id).order("cree_le", { ascending: false }).limit(40),
  ]);

  const listeLeads: LeadCompte[] = (leads ?? []).map((l) => ({
    id: l.id,
    reference: l.reference,
    recuLe: l.recu_le,
    projet: l.projet,
    source: l.source,
    statut: l.statut as LeadStatutDb,
    contact: l.contact_nom,
  }));
  const listePoints: PointsCompte[] = (points ?? []).map((p) => ({ id: p.id, points: p.points, motif: p.motif, creeLe: p.cree_le }));

  return {
    compte: versCompte(c as LigneCompte, {
      compte_id: id,
      leads: listeLeads.length,
      signes: listeLeads.filter((l) => l.statut === "signe").length,
      en_cours: listeLeads.filter((l) => ["attribue", "accepte", "contacte", "devis"].includes(l.statut)).length,
      points: listePoints.reduce((s, p) => s + p.points, 0),
      dernier_lead: listeLeads[0]?.recuLe ?? null,
    }),
    leads: listeLeads,
    evenements: ((evenements ?? []) as unknown as LigneEvenement[]).map((e) => ({
      id: e.id,
      type: e.type,
      statut: e.statut,
      creeLe: e.cree_le,
      reference: e.lead?.reference ?? null,
    })),
    points: listePoints,
  };
}
