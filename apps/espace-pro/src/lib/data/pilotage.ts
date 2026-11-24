import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";
import type { ProfilReel } from "./types";

export const ROLES_PILOTAGE = ["admin", "codir", "chef_service", "chef_marche"] as const;
export const peutPiloter = (p: ProfilReel | null) => !!p && (ROLES_PILOTAGE as readonly string[]).includes(p.role);

export type CumulCA = { budget_annuel: number; budget_cumul: number; realise_cumul: number; n1_cumul: number };
export type MoisCA = { mois: number; budget: number; realise: number | null; n1: number };
export type GammeCA = CumulCA & { gamme: string };
export type CommercialCA = CumulCA & {
  id: string;
  prenom: string;
  nom: string;
  equipe: string;
  fonction: string | null;
  comptes: number;
  iap_objectif: number;
  iap_nouveaux: number;
};

export type SynthesePilotage = {
  annee: number;
  dernier_mois: number;
  societe: CumulCA & { n1_annuel: number };
  mois: MoisCA[];
  gammes: GammeCA[];
  commerciaux: CommercialCA[];
};

export type Signal = { niveau: "danger" | "warning"; type: "commercial" | "gamme" | "lead"; titre: string; detail: string; valeur: number };

/** Synthèse commerciale de l'année (agrégats calculés en base, réservés au pilotage). */
export async function synthesePilotage(annee?: number): Promise<SynthesePilotage | null> {
  const { data, error } = await supabaseServeur().rpc("ep_pilotage_synthese", annee ? { p_annee: annee } : {});
  if (error) return null;
  return data as SynthesePilotage;
}

export async function signauxPilotage(annee?: number): Promise<Signal[]> {
  const { data, error } = await supabaseServeur().rpc("ep_pilotage_signaux", annee ? { p_annee: annee } : {});
  if (error) return [];
  return (data ?? []) as Signal[];
}

/* ═══════════ Pilotage commercial : société, zone, ATC, gamme ═══════════ */

export type Dimension = "societe" | "zone" | "atc" | "gamme";

/** Chiffres d'une ligne (société, zone, ATC ou gamme), en euros. */
export type LigneCA = {
  budget_annuel: number;
  budget_cumul: number;
  /** Budget à date : mois clos + mois en cours au prorata des jours ouvrés */
  budget_prorata: number;
  realise_cumul: number;
  n1_cumul: number;
  /** N-1 à la même date */
  n1_prorata: number;
  mois_budget: number;
  mois_budget_prorata: number;
  mois_realise: number;
  mois_n1: number;
};

export type ZoneCA = LigneCA & { zone: string; atc: number; iap_objectif: number; iap_nouveaux: number };
export type AtcCA = LigneCA & {
  id: string;
  prenom: string;
  nom: string;
  zone: string;
  fonction: string | null;
  couleur: string | null;
  iap_objectif: number;
  iap_nouveaux: number;
  comptes: number;
};
export type GammeLigneCA = LigneCA & { gamme: string };
export type Seuils = { vert: number; jaune: number; orange: number };

export type TableauPilotage = {
  annee: number;
  dernier_mois: number;
  mois: number;
  jours: { ecoules: number; ouvres: number; ratio: number };
  seuils: Seuils;
  societe: LigneCA;
  zones: ZoneCA[];
  atc: AtcCA[];
  gammes: GammeLigneCA[];
};

type Ventilation = { budget_prorata: number; realise_cumul: number; n1_prorata: number };
export type DetailPilotage = {
  dimension: Dimension;
  cle: string | null;
  annee: number;
  dernier_mois: number;
  mois: MoisCA[];
  gammes: (Ventilation & { gamme: string; budget_annuel: number })[] | null;
  atc: (Ventilation & { id: string; prenom: string; nom: string; couleur: string | null; zone: string })[] | null;
  iap: { objectif: number; nouveaux: number };
};

/** Tableau de bord du pilotage commercial (réservé aux rôles de pilotage). */
export async function tableauPilotage(mois?: number): Promise<TableauPilotage | null> {
  const { data, error } = await supabaseServeur().rpc("ep_pilotage_tableau", mois ? { p_mois: mois } : {});
  if (error || !data) return null;
  return data as TableauPilotage;
}

/** Détail d'une zone, d'un ATC, d'une gamme ou de la société. */
export async function detailPilotage(dimension: Dimension, cle: string | null): Promise<DetailPilotage | null> {
  const { data, error } = await supabaseServeur().rpc("ep_pilotage_detail", { p_dimension: dimension, ...(cle ? { p_cle: cle } : {}) });
  if (error || !data) return null;
  return data as DetailPilotage;
}
