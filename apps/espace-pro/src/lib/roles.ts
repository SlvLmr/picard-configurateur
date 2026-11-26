/**
 * Rôles et périmètres.
 * Un utilisateur a UN rôle (ce qu'il peut faire) et UN périmètre (sur quelles données).
 * Les niveaux IAP sont un attribut du compte client, pas un rôle distinct.
 */

export type ModuleId =
  | "accueil"
  | "leads"
  | "crm"
  | "tournees"
  | "lead_management"
  | "pilotage"
  | "picard_2030"
  | "configurateur"
  | "commande_serrures"
  | "reproduction_cles"
  | "mediatheque"
  | "newsletters"
  | "questionnaires"
  | "marketing"
  | "digital"
  | "animations"
  | "boutique"
  | "sav"
  | "campagnes"
  | "administration";

export type RoleId =
  | "admin"
  | "codir"
  | "chef_service"
  | "chef_marche"
  | "atc"
  | "repartiteur"
  | "client_gerant"
  | "client_equipe"
  | "sav"
  | "bureau_etudes"
  | "qualite";

export type NiveauIAP = "Elite" | "Premium" | "Officiel";
export type TypeClient = "IAP" | "Serrurier" | "Fenêtrier";

export const MODULES: Record<ModuleId, { label: string; href: string; phase: number }> = {
  accueil: { label: "Accueil", href: "/accueil", phase: 1 },
  leads: { label: "Gestion des leads", href: "/leads", phase: 1 },
  crm: { label: "CRM", href: "/crm", phase: 2 },
  tournees: { label: "Planning des tournées", href: "/crm/tournee", phase: 2 },
  lead_management: { label: "Lead Management", href: "/lead-management", phase: 1 },
  pilotage: { label: "Résultats commerciaux", href: "/pilotage", phase: 2 },
  campagnes: { label: "Suivi des opérations", href: "/campagnes", phase: 2 },
  picard_2030: { label: "Picard 2030", href: "/picard-2030", phase: 5 },
  configurateur: { label: "Configurateur portes", href: "/configurateur", phase: 2 },
  commande_serrures: { label: "Commande serrures", href: "/commande-serrures", phase: 5 },
  reproduction_cles: { label: "Reproduction de clés", href: "/reproduction-cles", phase: 5 },
  mediatheque: { label: "Médiathèque", href: "/mediatheque", phase: 1 },
  newsletters: { label: "Campagnes e-mail", href: "/newsletters", phase: 3 },
  questionnaires: { label: "Enquêtes et sondages", href: "/questionnaires", phase: 3 },
  marketing: { label: "Boîte à outils local", href: "/marketing", phase: 4 },
  digital: { label: "Visibilité en ligne", href: "/digital", phase: 3 },
  animations: { label: "Opérations nationales", href: "/animations", phase: 3 },
  boutique: { label: "Boutique", href: "/boutique", phase: 3 },
  sav: { label: "SAV", href: "/sav", phase: 2 },
  administration: { label: "Administration", href: "/administration", phase: 1 },
};

export const ROLE_MODULES: Record<RoleId, ModuleId[]> = {
  admin: ["accueil", "picard_2030", "leads", "crm", "tournees", "lead_management", "newsletters", "digital", "pilotage", "configurateur", "sav", "mediatheque", "questionnaires", "marketing", "animations", "boutique", "administration", "campagnes", "commande_serrures", "reproduction_cles"],
  codir: ["accueil", "picard_2030", "pilotage", "leads", "crm", "tournees", "lead_management", "newsletters", "digital", "sav", "mediatheque", "questionnaires", "animations", "boutique", "campagnes", "commande_serrures", "reproduction_cles"],
  chef_service: ["accueil", "picard_2030", "pilotage", "crm", "tournees", "lead_management", "leads", "sav", "mediatheque", "questionnaires", "animations", "boutique", "campagnes", "commande_serrures", "reproduction_cles"],
  chef_marche: ["accueil", "picard_2030", "pilotage", "crm", "tournees", "lead_management", "newsletters", "digital", "leads", "sav", "mediatheque", "questionnaires", "marketing", "animations", "boutique", "campagnes", "commande_serrures", "reproduction_cles"],
  atc: ["accueil", "crm", "tournees", "leads", "configurateur", "sav", "mediatheque", "questionnaires", "marketing", "animations", "boutique", "campagnes", "commande_serrures", "reproduction_cles"],
  repartiteur: ["accueil", "lead_management", "mediatheque", "questionnaires"],
  client_gerant: ["accueil", "leads", "configurateur", "sav", "mediatheque", "questionnaires", "marketing", "animations", "boutique", "commande_serrures", "reproduction_cles"],
  client_equipe: ["accueil", "leads", "configurateur", "sav", "mediatheque", "questionnaires", "animations", "commande_serrures", "reproduction_cles"],
  sav: ["accueil", "sav", "crm", "tournees", "mediatheque", "questionnaires", "commande_serrures", "reproduction_cles"],
  bureau_etudes: ["accueil", "sav", "configurateur", "mediatheque", "questionnaires"],
  qualite: ["accueil", "sav", "pilotage", "mediatheque", "questionnaires"],
};

/** Organisation du menu : l'accueil, puis quatre parties. Seuls les modules du rôle s'affichent. */
export const SECTIONS_MENU: { titre: string; modules: ModuleId[] }[] = [
  { titre: "Communication et marketing", modules: ["mediatheque", "leads", "marketing", "animations", "boutique"] },
  { titre: "Technique et commandes", modules: ["sav", "configurateur", "commande_serrures", "reproduction_cles"] },
  { titre: "Outils commerciaux", modules: ["crm", "tournees"] },
  { titre: "Outils direction", modules: ["pilotage", "campagnes", "picard_2030"] },
  { titre: "Outils marketing", modules: ["lead_management", "digital", "newsletters", "questionnaires"] },
];

/** Personas de démonstration (en attendant l'authentification). */
export type Persona = {
  id: string;
  role: RoleId;
  prenom: string;
  nom: string;
  fonction: string;
  societe?: string;
  niveau?: NiveauIAP;
};

export const PERSONAS: Persona[] = [
  { id: "claire", role: "repartiteur", prenom: "Claire", nom: "Durand", fonction: "Lead Manager" },
  { id: "julien", role: "atc", prenom: "Julien", nom: "Moreau", fonction: "ATC serruriers, Grand Ouest" },
  { id: "philippe", role: "codir", prenom: "Philippe", nom: "Renaud", fonction: "Directeur commercial" },
  { id: "marc", role: "client_gerant", prenom: "Marc", nom: "Lambert", fonction: "Gérant", societe: "Serrurerie Lambert", niveau: "Elite" },
];

export const ROLE_LABEL: Record<RoleId, string> = {
  admin: "Administrateur",
  codir: "CODIR",
  chef_service: "Chef de service",
  chef_marche: "Chef de marché",
  atc: "Commercial",
  repartiteur: "Lead Manager",
  client_gerant: "Client",
  client_equipe: "Client (équipe)",
  sav: "SAV",
  bureau_etudes: "Bureau d’études",
  qualite: "Qualité",
};

export const isClient = (r: RoleId) => r === "client_gerant" || r === "client_equipe";
