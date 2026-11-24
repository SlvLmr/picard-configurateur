/**
 * Rôles et périmètres.
 * Un utilisateur a UN rôle (ce qu'il peut faire) et UN périmètre (sur quelles données).
 * Les niveaux IAP sont un attribut du compte client, pas un rôle distinct.
 */

export type ModuleId =
  | "accueil"
  | "leads"
  | "crm"
  | "pilotage"
  | "configurateur"
  | "mediatheque"
  | "marketing"
  | "animations"
  | "boutique"
  | "sav"
  | "campagnes"
  | "news"
  | "calendrier"
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
  leads: { label: "Leads", href: "/leads", phase: 1 },
  crm: { label: "CRM", href: "/crm", phase: 2 },
  pilotage: { label: "Pilotage commercial", href: "/pilotage", phase: 2 },
  campagnes: { label: "Pilotage campagne", href: "/campagnes", phase: 2 },
  configurateur: { label: "Configurateur", href: "/configurateur", phase: 2 },
  mediatheque: { label: "Médiathèque", href: "/mediatheque", phase: 1 },
  marketing: { label: "Local", href: "/marketing", phase: 4 },
  animations: { label: "Animations", href: "/animations", phase: 3 },
  boutique: { label: "Boutique", href: "/boutique", phase: 3 },
  sav: { label: "SAV", href: "/sav", phase: 2 },
  news: { label: "Messages", href: "/news", phase: 1 },
  calendrier: { label: "Calendrier", href: "/calendrier", phase: 1 },
  administration: { label: "Administration", href: "/administration", phase: 1 },
};

export const ROLE_MODULES: Record<RoleId, ModuleId[]> = {
  admin: ["accueil", "leads", "crm", "pilotage", "configurateur", "sav", "mediatheque", "marketing", "animations", "boutique", "administration", "news", "calendrier", "campagnes"],
  codir: ["accueil", "pilotage", "leads", "crm", "sav", "mediatheque", "animations", "boutique", "news", "calendrier", "campagnes"],
  chef_service: ["accueil", "pilotage", "crm", "leads", "sav", "mediatheque", "animations", "boutique", "news", "calendrier", "campagnes"],
  chef_marche: ["accueil", "pilotage", "crm", "leads", "sav", "mediatheque", "marketing", "animations", "boutique", "news", "calendrier", "campagnes"],
  atc: ["accueil", "crm", "leads", "configurateur", "sav", "mediatheque", "marketing", "animations", "boutique", "news", "calendrier", "campagnes"],
  repartiteur: ["accueil", "leads", "mediatheque", "news", "calendrier"],
  client_gerant: ["accueil", "leads", "configurateur", "sav", "mediatheque", "marketing", "animations", "boutique", "news", "calendrier"],
  client_equipe: ["accueil", "leads", "configurateur", "sav", "mediatheque", "animations", "news", "calendrier"],
  sav: ["accueil", "sav", "crm", "mediatheque", "news", "calendrier"],
  bureau_etudes: ["accueil", "sav", "configurateur", "mediatheque", "news", "calendrier"],
  qualite: ["accueil", "sav", "pilotage", "mediatheque", "news", "calendrier"],
};

/** Organisation du menu : l'accueil, puis quatre parties. Seuls les modules du rôle s'affichent. */
export const SECTIONS_MENU: { titre: string; modules: ModuleId[] }[] = [
  { titre: "Communication", modules: ["news", "calendrier", "mediatheque"] },
  { titre: "Marketing", modules: ["leads", "marketing", "animations", "boutique"] },
  { titre: "Technique", modules: ["configurateur", "sav"] },
  { titre: "Interne", modules: ["crm", "pilotage", "campagnes"] },
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
