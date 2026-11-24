import type { Destinataire } from "./leads";

export const VISITES_DU_JOUR = [
  { heure: "9 h 30", compte: "Serrurerie Lambert", type: "Elite" as Destinataire["type"], ville: "Nantes", objet: "Point trimestriel, présentation de la gamme Altitude" },
  { heure: "14 h", compte: "Atelier Keraudren", type: "Premium" as Destinataire["type"], ville: "Rennes", objet: "Préparer le passage en Elite" },
  { heure: "16 h 30", compte: "Fermetures Sarthe", type: "Client" as Destinataire["type"], ville: "Le Mans", objet: "Prospection IAP Officiel" },
];

export const ACTIONS_EN_RETARD = [
  { compte: "Clés & Co", action: "Envoyer le kit vitrine", retardJours: 6 },
  { compte: "Serrurerie Dubois", action: "Rappeler pour le devis copropriété", retardJours: 2 },
];

export const OBJECTIF_ATC = { realiseKEur: 412, objectifKEur: 500, semainesRestantes: 5, visites: 46, visitesObjectif: 60 };

export const MARCHES = [
  { nom: "Serruriers", realise: 1.84, objectif: 2.0 },
  { nom: "IAP", realise: 1.56, objectif: 1.5 },
  { nom: "Fenêtriers", realise: 0.71, objectif: 1.0 },
  { nom: "Grands comptes", realise: 0.71, objectif: 0.85 },
];

export const SIGNAUX = [
  { niveau: "danger" as const, titre: "Clés & Co", detail: "CA en baisse de 32 % sur 3 mois, aucune connexion depuis 41 jours." },
  { niveau: "warning" as const, titre: "Marché fenêtriers", detail: "18 % des leads refusés ce mois, contre 7 % en moyenne." },
  { niveau: "warning" as const, titre: "Secteur Est", detail: "14 clients non visités depuis plus de 90 jours." },
];

export const POUR_VOUS = [
  { titre: "Notice de pose Altitude, version 3", detail: "Modifiée hier. Vous aviez téléchargé la version 2 en mars.", href: "/mediatheque", action: "Ouvrir" },
  { titre: "Opération « Mois de la sécurité »", detail: "Flyers, posts et campagne locale co-financée à 50 % pour les IAP Elite.", href: "/marketing", action: "Participer" },
  { titre: "Veste softshell brodée", detail: "1 900 points. Vous en avez 4 820.", href: "/boutique", action: "Voir" },
];
