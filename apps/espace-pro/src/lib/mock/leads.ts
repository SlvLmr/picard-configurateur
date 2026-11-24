import type { NiveauIAP } from "../roles";

export type LeadSource = "Ma Porte" | "Site web" | "Téléphone" | "Salon";
export type LeadStatut = "a_valider" | "attribue" | "accepte" | "contacte" | "devis" | "signe" | "perdu";
export type Destinataire = { nom: string; type: NiveauIAP | "Client" | "ATC"; distanceKm?: number };

export type Lead = {
  id: string;
  recuIlYaMin: number;
  contact: string;
  ville: string;
  departement: string;
  projet: string;
  source: LeadSource;
  statut: LeadStatut;
  suggestion: Destinataire;
  alternatives: Destinataire[];
  /** Délai d'acceptation restant, en minutes, une fois attribué */
  delaiRestantMin?: number;
  delaiTotalMin?: number;
  configurationMaPorte?: string;
  grosProjet?: boolean;
};

export const LEADS: Lead[] = [
  {
    id: "L-2481",
    recuIlYaMin: 12,
    contact: "Mme Bernard",
    ville: "Nantes",
    departement: "44",
    projet: "Porte blindée palière, A2P BP2",
    source: "Ma Porte",
    statut: "a_valider",
    suggestion: { nom: "Serrurerie Lambert", type: "Elite", distanceKm: 3.2 },
    alternatives: [
      { nom: "Atelier Keraudren", type: "Premium", distanceKm: 6.1 },
      { nom: "Serrures du Scorff", type: "Officiel", distanceKm: 9.4 },
    ],
    configurationMaPorte: "Modèle Altitude, chêne clair, 93 × 215 cm",
  },
  {
    id: "L-2480",
    recuIlYaMin: 26,
    contact: "M. Leroy",
    ville: "Rennes",
    departement: "35",
    projet: "Blindage de porte existante",
    source: "Site web",
    statut: "a_valider",
    suggestion: { nom: "Atelier Keraudren", type: "Premium", distanceKm: 5.8 },
    alternatives: [{ nom: "Clés & Co", type: "Officiel", distanceKm: 8 }],
  },
  {
    id: "L-2479",
    recuIlYaMin: 41,
    contact: "SCI Les Tilleuls",
    ville: "Angers",
    departement: "49",
    projet: "12 portes palières en copropriété",
    source: "Téléphone",
    statut: "a_valider",
    suggestion: { nom: "Julien Moreau", type: "ATC" },
    alternatives: [{ nom: "Fermetures d’Anjou", type: "Officiel", distanceKm: 4.2 }],
    grosProjet: true,
  },
  {
    id: "L-2478",
    recuIlYaMin: 64,
    contact: "Mme Petit",
    ville: "Lorient",
    departement: "56",
    projet: "Cylindre haute sécurité",
    source: "Ma Porte",
    statut: "a_valider",
    suggestion: { nom: "Serrures du Scorff", type: "Officiel", distanceKm: 7.1 },
    alternatives: [],
  },
  {
    id: "L-2477",
    recuIlYaMin: 82,
    contact: "M. Garnier",
    ville: "Le Mans",
    departement: "72",
    projet: "Porte blindée de pavillon",
    source: "Site web",
    statut: "a_valider",
    suggestion: { nom: "Fermetures Sarthe", type: "Client", distanceKm: 11 },
    alternatives: [{ nom: "Julien Moreau", type: "ATC" }],
  },
];

/** Leads reçus par un client (vue installateur). */
export const LEADS_CLIENT: Lead[] = [
  {
    ...LEADS[0],
    statut: "attribue",
    delaiRestantMin: 342,
    delaiTotalMin: 1440,
  },
  {
    id: "L-2466",
    recuIlYaMin: 180,
    contact: "M. Caradec",
    ville: "Rezé",
    departement: "44",
    projet: "Blindage de porte existante",
    source: "Site web",
    statut: "attribue",
    suggestion: { nom: "Serrurerie Lambert", type: "Elite", distanceKm: 6 },
    alternatives: [],
    delaiRestantMin: 1270,
    delaiTotalMin: 1440,
  },
];

export const STATS_LEADS = {
  aValider: 37,
  sansProProche: 6,
  delaiMoyenMin: 134,
  delaiMoyenEvolutionMin: -18,
  accepteesSous24h: 92,
  tauxTransformation: 31,
  statutRenseigne: 88,
  objectifStatutRenseigne: 95,
};

export const PROS_EN_RETARD = [
  { nom: "Serrurerie Dubois", type: "Officiel" as const, detail: "2 leads, délai dépassé de 3 h" },
  { nom: "Clés & Co", type: "Premium" as const, detail: "1 lead, délai dépassé de 1 h" },
  { nom: "Métallerie Rio", type: "Client" as const, detail: "1 lead, réattribué automatiquement dans 40 min" },
];

export const PIPELINE_CLIENT = [
  { etape: "Acceptés", n: 3 },
  { etape: "Contactés", n: 5 },
  { etape: "Devis envoyés", n: 4 },
  { etape: "Signés ce mois", n: 2 },
];
