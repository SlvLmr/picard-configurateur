import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { MODULES, type ModuleId } from "@/lib/roles";

const CONTENU: Partial<Record<ModuleId, { description: string; points: string[] }>> = {
  crm: {
    description: "Le portefeuille de chaque commercial : comptes, visites, plans d’action et objectifs.",
    points: ["Fiche compte avec tout l’historique", "Tournée et préparation des visites", "Compte rendu vocal en 30 secondes", "Plans d’action reliés aux objectifs"],
  },
  pilotage: {
    description: "La vue de la direction et des chefs de marché sur l’activité commerciale et le réseau.",
    points: ["Objectifs et réalisé par marché et par commercial", "Couverture du portefeuille", "Entonnoir de transformation des leads", "Signaux faibles sur les clients"],
  },
  configurateur: {
    description: "La configuration technique d’une porte, jusqu’au devis, au plan coté et à la commande.",
    points: ["Pré-rempli depuis Ma Porte", "Prise de cotes guidée", "Règles du bureau d’études appliquées en direct", "Devis à l’en-tête du professionnel"],
  },
  mediatheque: {
    description: "Photos, vidéos, documentations commerciales et techniques, toujours à jour.",
    points: ["Droits par profil et par niveau IAP", "Alerte quand un document utilisé change", "Kits de lancement prêts à l’emploi"],
  },
  marketing: {
    description: "Les supports pour se faire connaître localement, personnalisés au nom de chaque professionnel.",
    points: ["Supports imprimés personnalisés", "Kits réseaux sociaux mensuels", "Fiche Google Business et avis", "Campagnes locales co-financées"],
  },
  boutique: {
    description: "Goodies, tenues et PLV, payables en points, par carte ou les deux.",
    points: ["Paiement mixte points et carte", "Commandes des commerciaux sur enveloppe", "Validation au-delà d’un seuil"],
  },
};

export function ModuleAVenir({ id }: { id: ModuleId }) {
  const m = MODULES[id];
  const c = CONTENU[id];
  return (
    <>
      <PageHeader title={m.label} description={c?.description} />
      <EmptyState title={`Prévu en phase ${m.phase}`}>
        <p>Ce module n’est pas encore construit. Voici ce qu’il contiendra :</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {c?.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </EmptyState>
    </>
  );
}
