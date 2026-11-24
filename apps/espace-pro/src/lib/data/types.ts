import type { NiveauIAP, RoleId } from "@/lib/roles";

export type LeadStatutDb = "a_valider" | "attribue" | "accepte" | "contacte" | "devis" | "signe" | "perdu";

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
  devis: number;
  signes: number;
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

export type NoteLead = { id: number; auteur: string | null; contenu: string; creeLe: string };

export type FicheLead = {
  lead: LeadGestion;
  evenements: EvenementLead[];
  notes: NoteLead[];
  candidats: CandidatZone[];
};
