import "server-only";
import type { NiveauIAP } from "@/lib/roles";
import { supabaseServeur } from "@/lib/supabase/server";
import type { ProfilReel } from "./types";

export type TypeEtape = "appel" | "email" | "information" | "visite" | "relance" | "presentation" | "commande";
export type Etape = { code: string; type: TypeEtape; libelle: string };
export type StatutAction = "a_faire" | "fait" | "sans_objet";
export type StatutCampagne = "brouillon" | "active" | "terminee";

export const ROLES_GESTION_CAMPAGNE = ["admin", "codir", "chef_service", "chef_marche"] as const;
export const peutGererCampagnes = (p: ProfilReel | null) => !!p && (ROLES_GESTION_CAMPAGNE as readonly string[]).includes(p.role);

export type CampagneResume = {
  id: string;
  titre: string;
  objectif: string | null;
  debut: string;
  fin: string | null;
  statut: StatutCampagne;
  etapes: number;
  demo: boolean;
  clients: number;
  actions: number;
  faites: number;
};

export type Campagne = {
  id: string;
  titre: string;
  objectif: string | null;
  description: string | null;
  debut: string;
  fin: string | null;
  statut: StatutCampagne;
  etapes: Etape[];
  demo: boolean;
  cibleNiveaux: NiveauIAP[];
  cibleZones: string[];
};

export type LigneAvancement = {
  commercial_id: string | null;
  nom: string;
  zone: string;
  clients: number;
  clients_termines: number;
  actions: number;
  faites: number;
  sans_objet: number;
  montant: number;
  derniere_action: string | null;
};

export type ZoneAvancement = {
  zone: string;
  commerciaux: number;
  clients: number;
  clients_termines: number;
  actions: number;
  faites: number;
  sans_objet: number;
  montant: number;
};

export type Avancement = {
  clients: number;
  clients_termines: number;
  actions: number;
  faites: number;
  sans_objet: number;
  montant: number;
  rappels_depasses: number;
  par_etape: (Etape & { faites: number; sans_objet: number; total: number })[];
  par_atc: LigneAvancement[];
  par_zone: ZoneAvancement[];
};

export type ActionCible = { statut: StatutAction; faitLe: string | null; commentaire: string | null; montant: number | null };

export type CibleCampagne = {
  id: string;
  compteId: string;
  compteNom: string;
  ville: string | null;
  departement: string | null;
  niveau: NiveauIAP | null;
  commercialId: string | null;
  commercialNom: string | null;
  zone: string | null;
  rappel: string | null;
  actions: Record<string, ActionCible>;
};

export async function campagnesResume(): Promise<CampagneResume[]> {
  const { data, error } = await supabaseServeur().rpc("ep_campagnes_resume");
  if (error || !data) return [];
  return data as CampagneResume[];
}

export async function campagne(id: string): Promise<Campagne | null> {
  const { data } = await supabaseServeur()
    .from("ep_campagnes")
    .select("id, titre, objectif, description, debut, fin, statut, etapes, demo, cible_niveaux, cible_zones")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    titre: data.titre,
    objectif: data.objectif,
    description: data.description,
    debut: data.debut,
    fin: data.fin,
    statut: data.statut as StatutCampagne,
    etapes: data.etapes as Etape[],
    demo: data.demo,
    cibleNiveaux: (data.cible_niveaux ?? []) as NiveauIAP[],
    cibleZones: (data.cible_zones ?? []) as string[],
  };
}

export async function avancementCampagne(id: string): Promise<Avancement | null> {
  const { data, error } = await supabaseServeur().rpc("ep_campagne_avancement", { p_campagne: id });
  if (error || !data) return null;
  const a = data as Avancement;
  return {
    ...a,
    montant: Number(a.montant),
    par_atc: a.par_atc.map((l) => ({ ...l, montant: Number(l.montant) })),
    par_zone: a.par_zone.map((z) => ({ ...z, montant: Number(z.montant) })),
  };
}

const nomPropre = (prenom: string, nom: string) => `${prenom} ${nom.charAt(0)}${nom.slice(1).toLowerCase()}`;

/** Clients ciblés visibles par l'utilisateur (son portefeuille pour un commercial), avec leurs étapes. */
export async function ciblesCampagne(id: string): Promise<CibleCampagne[]> {
  const supabase = supabaseServeur();
  const [{ data: cibles }, { data: comm }] = await Promise.all([
    supabase
      .from("ep_campagne_cibles")
      .select(
        "id, compte_id, commercial_id, rappel, compte:ep_comptes!ep_campagne_cibles_compte_id_fkey (raison_sociale, ville, departement, niveau_iap), actions:ep_campagne_actions (etape, statut, fait_le, commentaire, montant)",
      )
      .eq("campagne_id", id)
      .limit(2000),
    supabase.rpc("ep_crm_commerciaux"),
  ]);
  const commerciaux = new Map(((comm ?? []) as { id: string; prenom: string; nom: string; equipe: string | null }[]).map((c) => [c.id, c]));
  type Ligne = {
    id: string;
    compte_id: string;
    commercial_id: string | null;
    rappel: string | null;
    compte: { raison_sociale: string; ville: string | null; departement: string | null; niveau_iap: NiveauIAP | null } | null;
    actions: { etape: string; statut: StatutAction; fait_le: string | null; commentaire: string | null; montant: number | null }[];
  };
  return ((cibles ?? []) as unknown as Ligne[])
    .map((c) => {
      const m = c.commercial_id ? commerciaux.get(c.commercial_id) : undefined;
      return {
        id: c.id,
        compteId: c.compte_id,
        compteNom: c.compte?.raison_sociale ?? "Compte",
        ville: c.compte?.ville ?? null,
        departement: c.compte?.departement ?? null,
        niveau: c.compte?.niveau_iap ?? null,
        commercialId: c.commercial_id,
        commercialNom: m ? nomPropre(m.prenom, m.nom) : null,
        zone: m?.equipe ?? null,
        rappel: c.rappel,
        actions: Object.fromEntries(
          (c.actions ?? []).map((a) => [
            a.etape,
            { statut: a.statut, faitLe: a.fait_le, commentaire: a.commentaire, montant: a.montant === null ? null : Number(a.montant) },
          ]),
        ),
      };
    })
    .sort((a, b) => a.compteNom.localeCompare(b.compteNom, "fr"));
}

/** Zones (équipes commerciales) proposées au ciblage. */
export async function zonesCampagne(): Promise<string[]> {
  const { data } = await supabaseServeur().rpc("ep_campagne_zones");
  return ((data ?? []) as string[]).filter((z) => z !== "DIR");
}
