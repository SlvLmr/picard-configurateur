import type { NiveauIAP, RoleId } from "@/lib/roles";

/** Publics ciblables pour les annonces et les événements. */
const INTERNES: RoleId[] = ["admin", "codir", "chef_service", "chef_marche", "atc", "repartiteur", "sav", "bureau_etudes", "qualite"];
const CLIENTS: RoleId[] = ["client_gerant", "client_equipe"];

export const CIBLES = {
  tous: { label: "Tout le monde", roles: [] as RoleId[], niveaux: [] as NiveauIAP[] },
  internes: { label: "Équipes Picard", roles: INTERNES, niveaux: [] as NiveauIAP[] },
  commerciaux: { label: "Commerciaux et encadrement", roles: ["admin", "codir", "chef_service", "chef_marche", "atc"] as RoleId[], niveaux: [] as NiveauIAP[] },
  clients: { label: "Tous les clients", roles: CLIENTS, niveaux: [] as NiveauIAP[] },
  iap_premium: { label: "Clients IAP Elite et Premium", roles: CLIENTS, niveaux: ["Elite", "Premium"] as NiveauIAP[] },
  iap_elite: { label: "Clients IAP Elite", roles: CLIENTS, niveaux: ["Elite"] as NiveauIAP[] },
};
export type Cible = keyof typeof CIBLES;

