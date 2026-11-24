import type { Metadata } from "next";
import { lireEtat } from "@/components/pilotage/navigation";
import { VuePilotage } from "@/components/pilotage/vue-pilotage";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { detailPilotage, peutPiloter, signauxPilotage, tableauPilotage } from "@/lib/data/pilotage";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Pilotage commercial" };

export default async function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const profil = await profilCourant();

  if (!peutPiloter(profil)) {
    return (
      <>
        <PageHeader title="Pilotage commercial" />
        <EmptyState title="Accès réservé">Le pilotage commercial est réservé à la direction, aux chefs de service et aux chefs de marché.</EmptyState>
      </>
    );
  }

  const etat = lireEtat(searchParams);
  const [t, societe, detail, signaux] = await Promise.all([
    tableauPilotage(etat.periode === "mois" && etat.mois ? etat.mois : undefined),
    detailPilotage("societe", null),
    etat.vue !== "societe" && etat.cle ? detailPilotage(etat.vue, etat.cle) : Promise.resolve(null),
    etat.vue === "societe" ? signauxPilotage() : Promise.resolve([]),
  ]);

  if (!t) {
    return (
      <>
        <PageHeader title="Pilotage commercial" />
        <EmptyState title="Données indisponibles">
          Les chiffres de l’outil Picard ATC n’ont pas pu être chargés. Rechargez la page ; si le problème persiste, prévenez l’administrateur.
        </EmptyState>
      </>
    );
  }

  return <VuePilotage t={t} etat={etat} societe={societe} detail={detail} signaux={signaux} />;
}
