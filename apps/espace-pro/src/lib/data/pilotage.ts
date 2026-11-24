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
