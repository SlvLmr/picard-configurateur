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
