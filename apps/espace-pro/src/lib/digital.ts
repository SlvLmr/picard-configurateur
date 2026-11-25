/** Pilotage du marketing digital : canaux et indicateurs suivis chaque mois. */
export type Canal = "ads" | "site" | "seo" | "geo";
export type Indicateur = { cle: string; label: string; unite?: "€" | "%" | "s" | "rang"; aide: string; hausseBonne?: boolean };

export const CANAUX: { id: Canal; label: string; description: string; source: string; indicateurs: Indicateur[] }[] = [
  {
    id: "ads",
    label: "Google Ads",
    description: "Campagnes payantes : budget, visibilité, clics et conversions.",
    source: "Google Ads",
    indicateurs: [
      { cle: "budget", label: "Budget dépensé", unite: "€", aide: "Coût total du mois", hausseBonne: false },
      { cle: "impressions", label: "Impressions", aide: "Affichages des annonces" },
      { cle: "clics", label: "Clics", aide: "Clics sur les annonces" },
      { cle: "conversions", label: "Conversions", aide: "Demandes de devis ou appels issus des annonces" },
    ],
  },
  {
    id: "site",
    label: "Site internet",
    description: "Fréquentation du site et demandes reçues.",
    source: "Google Analytics",
    indicateurs: [
      { cle: "visites", label: "Visites", aide: "Sessions du mois" },
      { cle: "visiteurs", label: "Visiteurs", aide: "Utilisateurs uniques" },
      { cle: "demandes", label: "Demandes de devis", aide: "Formulaires envoyés depuis le site" },
      { cle: "rebond", label: "Taux de rebond", unite: "%", aide: "Visites d’une seule page", hausseBonne: false },
    ],
  },
  {
    id: "seo",
    label: "Référencement naturel",
    description: "Présence dans les résultats de recherche Google.",
    source: "Google Search Console",
    indicateurs: [
      { cle: "clics", label: "Clics organiques", aide: "Clics depuis les résultats Google" },
      { cle: "impressions", label: "Impressions organiques", aide: "Apparitions dans les résultats" },
      { cle: "position", label: "Position moyenne", unite: "rang", aide: "Plus le chiffre est bas, mieux c’est", hausseBonne: false },
      { cle: "top10", label: "Mots-clés en top 10", aide: "Requêtes suivies en première page" },
    ],
  },
  {
    id: "geo",
    label: "Moteurs d’IA (GEO)",
    description: "Visibilité de Picard Serrures dans les réponses des assistants d’IA.",
    source: "Suivi manuel des requêtes",
    indicateurs: [
      { cle: "requetes", label: "Requêtes suivies", aide: "Questions testées dans les assistants d’IA" },
      { cle: "citations", label: "Citations de la marque", aide: "Réponses qui citent Picard Serrures" },
      { cle: "part_voix", label: "Part de voix", unite: "%", aide: "Part des citations face aux concurrents" },
    ],
  },
];

/** Indicateurs calculés à partir des valeurs saisies. */
export function calcules(m: Partial<Record<string, number>>) {
  const ctr = m.impressions && m.clics !== undefined ? (m.clics / m.impressions) * 100 : null;
  const cpa = m.conversions && m.budget !== undefined ? m.budget / m.conversions : null;
  return { ctr, cpa };
}
