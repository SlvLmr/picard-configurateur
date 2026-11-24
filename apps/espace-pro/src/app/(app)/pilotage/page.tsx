import type { Metadata } from "next";
import { VuePilotage } from "@/components/pilotage/vue-pilotage";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { statsLeads } from "@/lib/data/leads";
import { peutPiloter, signauxPilotage, synthesePilotage } from "@/lib/data/pilotage";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Pilotage" };

export default async function Page() {
  const profil = await profilCourant();

  if (!peutPiloter(profil)) {
    return (
      <>
        <PageHeader title="Pilotage commercial" />
        <EmptyState title="Accès réservé">Le pilotage est réservé à la direction, aux chefs de service et aux chefs de marché.</EmptyState>
      </>
    );
  }

  const [synthese, signaux, leads] = await Promise.all([synthesePilotage(), signauxPilotage(), statsLeads(90)]);

  if (!synthese) {
    return (
      <>
        <PageHeader title="Pilotage commercial" />
        <EmptyState title="Données indisponibles">
          Les chiffres de l’outil Commerce n’ont pas pu être chargés. Rechargez la page ; si le problème persiste, prévenez l’administrateur.
        </EmptyState>
      </>
    );
  }

  return <VuePilotage synthese={synthese} signaux={signaux} leads={leads} />;
}
