/**
 * Marketing local : données de démonstration.
 * À remplacer par la base (commandes de supports, opérations, co-financements).
 */

export type CategorieSupport = "imprime" | "reseaux" | "google" | "campagne" | "site";
export type Apercu = "flyer" | "carte" | "banniere" | "post" | "google" | "annonce" | "site";

export type OptionSupport = { label: string; euros: number; points: number };

export type Support = {
  id: string;
  categorie: CategorieSupport;
  titre: string;
  description: string;
  delai: string;
  apercu: Apercu;
  options: OptionSupport[];
  cofinance?: boolean;
  operation?: boolean;
};

export const CATEGORIES: Record<CategorieSupport, string> = {
  imprime: "Imprimés",
  reseaux: "Réseaux sociaux",
  google: "Google",
  campagne: "Campagnes locales",
  site: "Mini-site",
};

export const OPERATION = {
  titre: "Mois de la sécurité",
  periode: "Du 1er au 31 mars 2027",
  limite: "Inscriptions jusqu’au 15 février",
  accroche: "Une opération nationale clés en main pour capter les demandes de printemps, avant la saison des cambriolages.",
  inclus: [
    "Flyers et affiche vitrine à votre nom",
    "8 posts et 4 stories pour vos réseaux",
    "Campagne Facebook dans un rayon de 15 km",
    "Leads de l’opération attribués en priorité aux participants",
  ],
  cofinancement: "Co-financée à 50 % pour les IAP Elite, 30 % pour les Premium",
  participants: 64,
};

export const SUPPORTS: Support[] = [
  {
    id: "flyer",
    categorie: "imprime",
    titre: "Flyer A5",
    description: "Recto verso, papier 170 g, à distribuer en boîtes aux lettres ou au comptoir.",
    delai: "Livré sous 5 jours",
    apercu: "flyer",
    operation: true,
    options: [
      { label: "250 exemplaires", euros: 59, points: 590 },
      { label: "500 exemplaires", euros: 89, points: 890 },
      { label: "1 000 exemplaires", euros: 129, points: 1290 },
    ],
  },
  {
    id: "cartes",
    categorie: "imprime",
    titre: "Cartes de visite",
    description: "Avec votre logo, votre niveau IAP et un code pour laisser un avis.",
    delai: "Livré sous 5 jours",
    apercu: "carte",
    options: [
      { label: "250 cartes", euros: 39, points: 390 },
      { label: "500 cartes", euros: 55, points: 550 },
    ],
  },
  {
    id: "kakemono",
    categorie: "imprime",
    titre: "Kakémono 80 × 200 cm",
    description: "Pour votre showroom, un salon ou des portes ouvertes. Structure enrouleur incluse.",
    delai: "Livré sous 8 jours",
    apercu: "banniere",
    options: [
      { label: "1 kakémono", euros: 119, points: 1190 },
      { label: "2 kakémonos", euros: 209, points: 2090 },
    ],
  },
  {
    id: "vehicule",
    categorie: "imprime",
    titre: "Marquage véhicule",
    description: "Adhésifs aux couleurs Picard Serrures avec vos coordonnées. Pose possible chez un partenaire.",
    delai: "Sous 3 semaines",
    apercu: "banniere",
    cofinance: true,
    options: [
      { label: "Portières", euros: 290, points: 2900 },
      { label: "Véhicule complet", euros: 790, points: 7900 },
    ],
  },
  {
    id: "posts",
    categorie: "reseaux",
    titre: "Kit de posts mensuels",
    description: "8 visuels et textes prêts à publier chaque mois, personnalisés avec votre logo.",
    delai: "Disponible immédiatement",
    apercu: "post",
    operation: true,
    options: [
      { label: "1 mois", euros: 0, points: 0 },
      { label: "Abonnement 12 mois", euros: 0, points: 0 },
    ],
  },
  {
    id: "google",
    categorie: "google",
    titre: "Fiche Google Business optimisée",
    description: "Création ou reprise de votre fiche : photos, horaires, catégories, réponses aux avis.",
    delai: "Sous 10 jours",
    apercu: "google",
    options: [{ label: "Forfait optimisation", euros: 149, points: 1490 }],
  },
  {
    id: "avis",
    categorie: "google",
    titre: "Campagne d’avis clients",
    description: "SMS et e-mails envoyés à vos clients après chantier pour obtenir des avis Google.",
    delai: "Démarrage sous 48 h",
    apercu: "google",
    options: [
      { label: "50 envois", euros: 29, points: 290 },
      { label: "200 envois", euros: 89, points: 890 },
    ],
  },
  {
    id: "facebook",
    categorie: "campagne",
    titre: "Campagne Facebook locale",
    description: "Annonces diffusées autour de votre atelier. Les leads arrivent directement dans votre Espace Pro.",
    delai: "Démarrage sous 72 h",
    apercu: "annonce",
    cofinance: true,
    operation: true,
    options: [
      { label: "Budget 150 €, 2 semaines", euros: 150, points: 1500 },
      { label: "Budget 300 €, 1 mois", euros: 300, points: 3000 },
      { label: "Budget 600 €, 2 mois", euros: 600, points: 6000 },
    ],
  },
  {
    id: "google-ads",
    categorie: "campagne",
    titre: "Annonces Google locales",
    description: "Apparaissez en tête quand on cherche un serrurier près de chez vous.",
    delai: "Démarrage sous 72 h",
    apercu: "annonce",
    cofinance: true,
    options: [
      { label: "Budget 200 €, 1 mois", euros: 200, points: 2000 },
      { label: "Budget 500 €, 3 mois", euros: 500, points: 5000 },
    ],
  },
  {
    id: "site",
    categorie: "site",
    titre: "Mini-site installateur",
    description: "Votre page à votre nom : réalisations, avis, formulaire de devis relié à vos leads.",
    delai: "En ligne sous 7 jours",
    apercu: "site",
    options: [{ label: "Abonnement annuel", euros: 190, points: 1900 }],
  },
];

/** Le client utilisé pour l'aperçu personnalisé (persona de démonstration). */
export const CLIENT_DEMO = {
  raison: "Serrurerie Lambert",
  adresse: "12 rue de la Paix, 44000 Nantes",
  telephone: "02 40 00 00 00",
  niveau: "Elite" as const,
  note: "4,8",
  avis: 23,
  points: 4820,
  site: "serrurerie-lambert.fr",
};

export type ClientMarketing = {
  nom: string;
  niveau: "Elite" | "Premium" | "Officiel";
  ville: string;
  operation: boolean;
  google: "optimisee" | "incomplete" | "a_creer";
  derniereCommande: string | null;
  recommandation: string;
};

export const CLIENTS_ATC: ClientMarketing[] = [
  { nom: "Serrurerie Lambert", niveau: "Elite", ville: "Nantes", operation: true, google: "optimisee", derniereCommande: "Flyers, il y a 3 semaines", recommandation: "Proposer le marquage véhicule, co-financé pour les Elite." },
  { nom: "Atelier Keraudren", niveau: "Premium", ville: "Rennes", operation: false, google: "incomplete", derniereCommande: null, recommandation: "Inscrire à l’opération et compléter la fiche Google avant le 15 février." },
  { nom: "Clés & Co", niveau: "Officiel", ville: "Saint-Nazaire", operation: false, google: "a_creer", derniereCommande: null, recommandation: "Créer la fiche Google : aucun avis visible aujourd’hui." },
  { nom: "Serrures du Scorff", niveau: "Officiel", ville: "Lorient", operation: true, google: "incomplete", derniereCommande: "Cartes de visite, il y a 2 mois", recommandation: "Lancer une campagne d’avis clients après les chantiers de l’hiver." },
  { nom: "Fermetures Sarthe", niveau: "Premium", ville: "Le Mans", operation: false, google: "optimisee", derniereCommande: "Kakémono, il y a 5 mois", recommandation: "Inscrire à l’opération : secteur peu couvert, leads garantis." },
];

export const COMMANDES_TRIMESTRE = [
  { label: "Imprimés", value: 18 },
  { label: "Réseaux sociaux", value: 11 },
  { label: "Google", value: 6 },
  { label: "Campagnes locales", value: 4 },
  { label: "Mini-site", value: 2 },
];
