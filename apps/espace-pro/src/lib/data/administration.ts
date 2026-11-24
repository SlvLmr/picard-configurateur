import "server-only";
import type { RoleId } from "@/lib/roles";
import { supabaseServeur } from "@/lib/supabase/server";

export type Utilisateur = {
  id: string;
  email: string;
  derniereConnexion: string | null;
  role: RoleId | null;
  prenom: string | null;
  nom: string | null;
  actif: boolean | null;
  compteId: string | null;
  compteNom: string | null;
  commercialId: string | null;
  commercialNom: string | null;
};

export type Invitation = { id: string; email: string; role: RoleId; prenom: string | null; nom: string | null; creeLe: string };
export type Option = { id: string; nom: string; detail?: string | null };
export type DemandeAcces = {
  id: string; prenom: string; nom: string; email: string; telephone: string | null; entreprise: string | null;
  profil: "iap" | "serrurier" | "fenetrier" | "interne" | "autre"; message: string | null; creeLe: string;
};

export type DonneesAdministration =
  | { etat: "ok"; utilisateurs: Utilisateur[]; invitations: Invitation[]; demandes: DemandeAcces[]; commerciaux: Option[]; comptes: Option[] }
  | { etat: "migration_manquante" }
  | { etat: "erreur"; message: string };

export async function donneesAdministration(): Promise<DonneesAdministration> {
  const supabase = supabaseServeur();
  const [u, i, c, comptes, dem] = await Promise.all([
    supabase.rpc("ep_admin_utilisateurs"),
    supabase.rpc("ep_admin_invitations"),
    supabase.rpc("ep_admin_commerciaux"),
    supabase.from("ep_comptes").select("id, raison_sociale, ville, niveau_iap").eq("actif", true).order("raison_sociale"),
    supabase.rpc("ep_admin_demandes_acces"),
  ]);
  const err = u.error ?? i.error ?? c.error;
  if (err) {
    // PGRST202 : fonction introuvable (migration non appliquée)
    if (err.code === "PGRST202" || /could not find the function/i.test(err.message)) return { etat: "migration_manquante" };
    return { etat: "erreur", message: err.message };
  }
  type LigneU = { id: string; email: string; derniere_connexion: string | null; role: RoleId | null; prenom: string | null; nom: string | null; actif: boolean | null; compte_id: string | null; compte_nom: string | null; commercial_id: string | null; commercial_nom: string | null };
  type LigneI = { id: string; email: string; role: RoleId; prenom: string | null; nom: string | null; cree_le: string };
  return {
    etat: "ok",
    utilisateurs: ((u.data ?? []) as LigneU[]).map((x) => ({
      id: x.id,
      email: x.email,
      derniereConnexion: x.derniere_connexion,
      role: x.role,
      prenom: x.prenom,
      nom: x.nom,
      actif: x.actif,
      compteId: x.compte_id,
      compteNom: x.compte_nom,
      commercialId: x.commercial_id,
      commercialNom: x.commercial_nom,
    })),
    invitations: ((i.data ?? []) as LigneI[]).map((x) => ({ id: x.id, email: x.email, role: x.role, prenom: x.prenom, nom: x.nom, creeLe: x.cree_le })),
    // Demandes d'accès : liste vide si la migration n'est pas encore appliquée
    demandes: ((dem.data ?? []) as (Omit<DemandeAcces, "creeLe"> & { cree_le: string })[]).map(({ cree_le, ...x }) => ({ ...x, creeLe: cree_le })),
    commerciaux: ((c.data ?? []) as { id: string; nom: string; equipe: string }[]).map((x) => ({ id: x.id, nom: x.nom, detail: x.equipe })),
    comptes: (comptes.data ?? []).map((x) => ({ id: x.id, nom: x.raison_sociale, detail: [x.niveau_iap, x.ville].filter(Boolean).join(", ") })),
  };
}

export type CommercialAdmin = {
  id: string; prenom: string; nom: string; equipe: string; fonction: string | null; email: string | null;
  telephone: string | null; iapObjectif: number; actif: boolean; comptes: number; iap: number;
};

export async function commerciauxAdmin(): Promise<CommercialAdmin[]> {
  const { data } = await supabaseServeur().rpc("ep_admin_commerciaux_detail");
  type L = { id: string; prenom: string; nom: string; equipe: string; fonction: string | null; email: string | null; telephone: string | null; iap_objectif: number | null; actif: boolean; comptes: number; iap: number };
  return ((data ?? []) as L[]).map((c) => ({
    id: c.id, prenom: c.prenom, nom: c.nom, equipe: c.equipe, fonction: c.fonction, email: c.email, telephone: c.telephone,
    iapObjectif: c.iap_objectif ?? 0, actif: c.actif, comptes: Number(c.comptes), iap: Number(c.iap),
  }));
}

export type CompteAdmin = {
  id: string; raisonSociale: string; type: "IAP" | "Serrurier" | "Fenêtrier" | "Autre"; niveau: "Elite" | "Premium" | "Officiel" | null;
  numero: string | null; cp: string | null; ville: string | null; departement: string | null; commercialId: string | null; actif: boolean;
};

export async function comptesAdmin(): Promise<CompteAdmin[]> {
  const { data } = await supabaseServeur()
    .from("ep_comptes")
    .select("id, raison_sociale, type, niveau_iap, numero_client, cp, ville, departement, commercial_id, actif")
    .order("raison_sociale")
    .limit(2000);
  type L = { id: string; raison_sociale: string; type: CompteAdmin["type"]; niveau_iap: CompteAdmin["niveau"]; numero_client: string | null; cp: string | null; ville: string | null; departement: string | null; commercial_id: string | null; actif: boolean };
  return ((data ?? []) as L[]).map((c) => ({
    id: c.id, raisonSociale: c.raison_sociale, type: c.type, niveau: c.niveau_iap, numero: c.numero_client, cp: c.cp,
    ville: c.ville, departement: c.departement, commercialId: c.commercial_id, actif: c.actif,
  }));
}

export type Parametre = { cle: string; valeur: number; libelle: string; aide: string | null; unite: string | null; groupe: string };

export async function parametres(): Promise<Parametre[]> {
  const { data } = await supabaseServeur().from("ep_parametres").select("cle, valeur, libelle, aide, unite, groupe, ordre").order("groupe").order("ordre");
  return ((data ?? []) as (Parametre & { ordre: number })[]).map((p) => ({ ...p, valeur: Number(p.valeur) }));
}

export type Droit = { module: string; role: RoleId; autorise: boolean; niveaux: ("Elite" | "Premium" | "Officiel")[] };

export async function droits(): Promise<Droit[]> {
  const { data } = await supabaseServeur().from("ep_droits").select("module, role, autorise, niveaux");
  return (data ?? []) as Droit[];
}
