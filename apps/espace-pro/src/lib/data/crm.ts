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
      .select("id, reference, recu_le, projet, source, statut")
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

  const { data: coords } = await supabase.rpc("ep_leads_coordonnees", { p_ids: (leads ?? []).map((l) => l.id) });
  const noms = new Map(((coords ?? []) as { id: string; contact_nom: string | null }[]).map((x) => [x.id, x.contact_nom]));
  const listeLeads: LeadCompte[] = (leads ?? []).map((l) => ({
    id: l.id,
    reference: l.reference,
    recuLe: l.recu_le,
    projet: l.projet,
    source: l.source,
    statut: l.statut as LeadStatutDb,
    contact: noms.get(l.id) ?? "Client",
  }));
  const listePoints: PointsCompte[] = (points ?? []).map((p) => ({ id: p.id, points: p.points, motif: p.motif, creeLe: p.cree_le }));

  return {
    compte: versCompte(c as LigneCompte, {
      compte_id: id,
      leads: listeLeads.length,
      signes: listeLeads.filter((l) => l.statut === "signe" || l.statut === "pose").length,
      en_cours: listeLeads.filter((l) => ["attribue", "accepte", "contacte", "rdv", "devis"].includes(l.statut)).length,
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

/* ════════════════════════════════════════════════════════════════════
   Activités commerciales : visites, comptes rendus, actions, plans
   ════════════════════════════════════════════════════════════════════ */

export type TypeActivite = "visite" | "appel" | "email" | "formation" | "demo" | "salon";
export type StatutActivite = "planifiee" | "realisee" | "annulee";
export type TypePlan = "passage_niveau" | "developpement_ca" | "recrutement_iap" | "fidelisation" | "autre";
export type StatutPlan = "en_cours" | "atteint" | "abandonne";

export type ActiviteCrm = {
  id: string;
  compteId: string;
  compteNom: string | null;
  type: TypeActivite;
  datePrevue: string | null;
  dateRealisee: string | null;
  objet: string;
  compteRendu: string | null;
  prochainesEtapes: string | null;
  statut: StatutActivite;
};

export type ActionCrm = {
  id: string;
  compteId: string;
  compteNom: string | null;
  titre: string;
  echeance: string | null;
  statut: "a_faire" | "fait";
  planId: string | null;
};

export type PlanCrm = { id: string; objectif: string; type: TypePlan; echeance: string | null; statut: StatutPlan };

const COLONNES_ACTIVITE =
  "id, compte_id, type, date_prevue, date_realisee, objet, compte_rendu, prochaines_etapes, statut, compte:ep_comptes!ep_activites_compte_id_fkey (raison_sociale)";
const COLONNES_ACTION = "id, compte_id, titre, echeance, statut, plan_id, compte:ep_comptes!ep_actions_compte_id_fkey (raison_sociale)";

type LigneActiviteCrm = {
  id: string;
  compte_id: string;
  type: TypeActivite;
  date_prevue: string | null;
  date_realisee: string | null;
  objet: string;
  compte_rendu: string | null;
  prochaines_etapes: string | null;
  statut: StatutActivite;
  compte: { raison_sociale: string } | null;
};
type LigneActionCrm = {
  id: string;
  compte_id: string;
  titre: string;
  echeance: string | null;
  statut: "a_faire" | "fait";
  plan_id: string | null;
  compte: { raison_sociale: string } | null;
};

const versActivite = (a: LigneActiviteCrm): ActiviteCrm => ({
  id: a.id,
  compteId: a.compte_id,
  compteNom: a.compte?.raison_sociale ?? null,
  type: a.type,
  datePrevue: a.date_prevue,
  dateRealisee: a.date_realisee,
  objet: a.objet,
  compteRendu: a.compte_rendu,
  prochainesEtapes: a.prochaines_etapes,
  statut: a.statut,
});
const versAction = (a: LigneActionCrm): ActionCrm => ({
  id: a.id,
  compteId: a.compte_id,
  compteNom: a.compte?.raison_sociale ?? null,
  titre: a.titre,
  echeance: a.echeance,
  statut: a.statut,
  planId: a.plan_id,
});

/** Date au format AAAA-MM-JJ, à l'heure de Paris. */
export const jourParis = (d: Date = new Date()) =>
  new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export type ActivitesCompte = { activites: ActiviteCrm[]; actions: ActionCrm[]; plans: PlanCrm[]; peutEcrire: boolean };

/** Activités, actions et plans d'un compte (vides si l'utilisateur n'y a pas accès). */
export async function activitesCompte(compteId: string): Promise<ActivitesCompte> {
  const supabase = supabaseServeur();
  const [{ data: activites }, { data: actions }, { data: plans }, { data: peutEcrire }] = await Promise.all([
    supabase.from("ep_activites").select(COLONNES_ACTIVITE).eq("compte_id", compteId).neq("statut", "annulee").limit(60),
    supabase.from("ep_actions").select(COLONNES_ACTION).eq("compte_id", compteId).order("echeance", { ascending: true, nullsFirst: false }).limit(60),
    supabase.from("ep_plans_action").select("id, objectif, type, echeance, statut").eq("compte_id", compteId).order("cree_le", { ascending: false }),
    supabase.rpc("ep_crm_peut_ecrire", { p_compte: compteId }),
  ]);
  const liste = ((activites ?? []) as unknown as LigneActiviteCrm[]).map(versActivite);
  // Planifiées d'abord (la plus proche en tête), puis réalisées (la plus récente en tête)
  liste.sort((a, b) => {
    if (a.statut !== b.statut) return a.statut === "planifiee" ? -1 : 1;
    return a.statut === "planifiee"
      ? (a.datePrevue ?? "").localeCompare(b.datePrevue ?? "")
      : (b.dateRealisee ?? "").localeCompare(a.dateRealisee ?? "");
  });
  return {
    activites: liste,
    actions: ((actions ?? []) as unknown as LigneActionCrm[]).map(versAction),
    plans: (plans ?? []) as PlanCrm[],
    peutEcrire: Boolean(peutEcrire),
  };
}

export type CompteARevoir = { id: string; raisonSociale: string; niveau: NiveauIAP | null; ville: string | null; derniereVisite: string | null };

export type Tournee = {
  semaine: { jour: string; activites: ActiviteCrm[] }[];
  aujourdhui: ActiviteCrm[];
  actionsEnRetard: ActionCrm[];
  comptesARevoir: CompteARevoir[];
};

/** Semaine en cours (lundi à dimanche, heure de Paris) du portefeuille visible. */
export async function tournee(): Promise<Tournee> {
  const supabase = supabaseServeur();
  const auj = jourParis();
  const base = new Date(`${auj}T12:00:00Z`);
  const decalage = (base.getUTCDay() + 6) % 7; // 0 = lundi
  const jours = Array.from({ length: 7 }, (_, i) => jourParis(new Date(base.getTime() + (i - decalage) * 86400000)));
  const debut = new Date(base.getTime() - (decalage + 1) * 86400000).toISOString();
  const fin = new Date(base.getTime() + (8 - decalage) * 86400000).toISOString();
  const il90 = new Date(Date.now() - 90 * 86400000).toISOString();

  const [{ data: planifiees }, { data: retard }, { data: comptes }, { data: realisees }] = await Promise.all([
    supabase.from("ep_activites").select(COLONNES_ACTIVITE).eq("statut", "planifiee").gte("date_prevue", debut).lte("date_prevue", fin).order("date_prevue"),
    supabase.from("ep_actions").select(COLONNES_ACTION).eq("statut", "a_faire").lt("echeance", auj).order("echeance").limit(30),
    supabase.from("ep_comptes").select("id, raison_sociale, niveau_iap, ville").eq("actif", true),
    supabase.from("ep_activites").select("compte_id, date_realisee").eq("statut", "realisee").not("date_realisee", "is", null),
  ]);

  const activites = ((planifiees ?? []) as unknown as LigneActiviteCrm[]).map(versActivite);
  const parJour = (j: string) => activites.filter((a) => a.datePrevue && jourParis(new Date(a.datePrevue)) === j);

  const derniere = new Map<string, string>();
  for (const r of (realisees ?? []) as { compte_id: string; date_realisee: string }[]) {
    const prec = derniere.get(r.compte_id);
    if (!prec || r.date_realisee > prec) derniere.set(r.compte_id, r.date_realisee);
  }
  const ordreNiveau = { Elite: 1, Premium: 2, Officiel: 3 } as const;
  const comptesARevoir = ((comptes ?? []) as { id: string; raison_sociale: string; niveau_iap: NiveauIAP | null; ville: string | null }[])
    .filter((c) => !derniere.get(c.id) || derniere.get(c.id)! < il90)
    .map((c) => ({ id: c.id, raisonSociale: c.raison_sociale, niveau: c.niveau_iap, ville: c.ville, derniereVisite: derniere.get(c.id) ?? null }))
    .sort((a, b) => (ordreNiveau[a.niveau ?? "Officiel"] ?? 4) - (ordreNiveau[b.niveau ?? "Officiel"] ?? 4) || a.raisonSociale.localeCompare(b.raisonSociale));

  return {
    semaine: jours.map((jour) => ({ jour, activites: parJour(jour) })),
    aujourdhui: parJour(auj),
    actionsEnRetard: ((retard ?? []) as unknown as LigneActionCrm[]).map(versAction),
    comptesARevoir,
  };
}

export type ObjectifCommercial = { annee: number; budget: number; realise: number; realiseN1: number; dernierMois: number | null };

export type JourneeCommercial = {
  visitesDuJour: ActiviteCrm[];
  actionsEnRetard: ActionCrm[];
  objectif: ObjectifCommercial | null;
};

/**
 * Journée de l'utilisateur connecté, pour l'accueil du commercial.
 * Commercial : son portefeuille et son objectif annuel.
 * Vue complète (admin, CODIR, chefs) : tout le réseau et l'objectif société.
 * Autres rôles : listes vides et objectif null.
 */
export async function journeeCommercial(): Promise<JourneeCommercial> {
  const supabase = supabaseServeur();
  const [t, { data: obj }] = await Promise.all([tournee(), supabase.rpc("ep_crm_objectif", { p_annee: Number(jourParis().slice(0, 4)) })]);
  const o = obj as { annee: number; budget: number; realise: number; realise_n1: number; dernier_mois: number | null } | null;
  return {
    visitesDuJour: t.aujourdhui,
    actionsEnRetard: t.actionsEnRetard,
    objectif: o
      ? { annee: o.annee, budget: Number(o.budget), realise: Number(o.realise), realiseN1: Number(o.realise_n1), dernierMois: o.dernier_mois }
      : null,
  };
}
