import type { NiveauIAP, RoleId } from "@/lib/roles";

export type LeadStatutDb = "a_valider" | "attribue" | "accepte" | "contacte" | "rdv" | "devis" | "signe" | "pose" | "perdu";
export type Temperature = "froid" | "tiede" | "chaud";

export type ProfilReel = {
  id: string;
  role: RoleId;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  compteId: string | null;
  commercialId: string | null;
};

export type Candidat = { id: string; nom: string; niveau: NiveauIAP | null; ville: string | null };

export type LeadReel = {
  id: string;
  reference: string;
  recuLe: string;
  source: string;
  contact: string;
  cp: string;
  ville: string | null;
  departement: string | null;
  projet: string;
  grosProjet: boolean;
  demo: boolean;
  statut: LeadStatutDb;
  configurationMaPorte: Record<string, unknown> | null;
  suggestion:
    | { type: "compte"; id: string; nom: string; niveau: NiveauIAP | null; ville: string | null }
    | { type: "commercial"; id: string; nom: string }
    | null;
  candidats: Candidat[];
};

export type StatsLeads = {
  recus: number;
  a_valider: number;
  sans_pro: number;
  en_attente_pro: number;
  delai_moyen_min: number | null;
  acceptes_24h_pct: number | null;
  transformation_pct: number | null;
  statut_renseigne_pct: number | null;
  par_statut: Partial<Record<LeadStatutDb, number>>;
};

/* ── Gestion des leads (lead manager) ─────────────────────────────── */

export type Entonnoir = {
  recus: number;
  attribues: number;
  acceptes: number;
  contactes: number;
  rdv: number;
  devis: number;
  signes: number;
  poses: number;
  perdus: number;
};

export type Attribution = { type: "compte" | "commercial"; nom: string; niveau: NiveauIAP | null };

export type LeadGestion = {
  id: string;
  reference: string;
  recuLe: string;
  attribueLe: string | null;
  accepteLe: string | null;
  delaiMin: number;
  source: string;
  contact: string;
  telephone: string | null;
  email: string | null;
  cp: string;
  ville: string | null;
  departement: string | null;
  projet: string;
  grosProjet: boolean;
  demo: boolean;
  statut: LeadStatutDb;
  configurationMaPorte: Record<string, unknown> | null;
  suggestion: Attribution | null;
  attribueA: Attribution | null;
  commercialNom: string | null;
  /** Coordonnées masquées tant que l'installateur n'a pas accepté */
  masque: boolean;
  adresse: string | null;
  message: string | null;
  contactPrefere: "telephone" | "email" | "sms" | null;
  temperature: Temperature | null;
  natureProjet: string | null;
  echeance: string | null;
  budget: string | null;
  typeBien: string | null;
  qualifieLe: string | null;
  motifPerte: string | null;
  referenceCommande: string | null;
  referenceValideeLe: string | null;
  creeParPro: boolean;
};

export type CandidatZone = {
  type: "compte" | "commercial";
  id: string;
  nom: string;
  niveau: NiveauIAP | null;
  ville: string | null;
  departement: string | null;
  leads30j: number;
  ecart: number;
  groupe: string;
  suggere: boolean;
};

export type EvenementLead = {
  id: number;
  type: string;
  statut: LeadStatutDb | null;
  compteNom: string | null;
  details: Record<string, unknown> | null;
  creeLe: string;
};

export type NoteLead = { id: number; auteur: string | null; contenu: string; creeLe: string; interne: boolean };

export type FicheLead = {
  lead: LeadGestion;
  evenements: EvenementLead[];
  notes: NoteLead[];
  candidats: CandidatZone[];
  enquetes: EnqueteLead[];
  facturation: FacturationLead | null;
};

export type EnqueteLead = { cible: "client" | "installateur"; envoyeeLe: string; relances: number; reponduLe: string | null; note: number | null; commentaire: string | null };
export type FacturationLead = { montant: number; prix: number; remisePct: number; statut: "facture" | "offert" | "rembourse"; motif: string | null; mois: string };

export type Nps = { reponses: number; envoyees: number; promoteurs: number; passifs: number; detracteurs: number; score: number | null };

export type StatsLeadManager = {
  recus: number; qualifies: number; attribues: number; acceptes: number; refus: number; expires: number; annules_installateur: number;
  signes: number; poses: number; perdus: number; en_retard: number; a_qualifier: number;
  delai_qualification_min: number | null; delai_attribution_min: number | null; delai_acceptation_min: number | null; reattribues_pct: number | null;
  par_temperature: Record<string, { total: number; signes: number }>;
  motifs_refus: Record<string, number>;
  motifs_perte: Record<string, number>;
  activite: { jour: string; qualifies: number; attribues: number }[];
  par_auteur: { nom: string; actions: number }[];
  installateurs: { nom: string; niveau: NiveauIAP | null; recus: number; acceptes: number; refus: number; expires: number; signes: number; nps: string | null }[];
  nps_client: Nps;
  nps_installateur: Nps;
  facturation: { facture: number; rembourse: number; offerts: number };
  notifications_en_attente: number;
  notifications_echec: number;
};

export type StatsPro = { recus: number; acceptes: number; refus: number; expires: number; temps_reponse_min: number | null; termines: number; nps: number | null };

export type Notification = {
  id: number; canal: "email" | "sms"; destinataire: string; destinataireNom: string | null; sujet: string | null; motif: string;
  statut: "a_envoyer" | "envoye" | "echec"; erreur: string | null; creeLe: string; envoyeLe: string | null; leadReference: string | null;
};
