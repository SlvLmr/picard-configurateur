import type { Metadata } from "next";
import { PageAVenir } from "@/components/ui/page-a-venir";

export const metadata: Metadata = { title: "Gestion opérations" };

export default function Page() {
  return (
    <PageAVenir
      titre="Gestion opérations"
      description="Préparer, déployer et suivre les opérations commerciales chez vos clients, sur votre secteur."
      fonctions={[
        "Voir les opérations en cours et les clients à mobiliser sur votre secteur",
        "Planifier les actions terrain : présentation, mise en place, relance",
        "Suivre la participation de chaque client et les résultats obtenus",
        "Partager les retours du terrain avec le marketing et la direction",
      ]}
    />
  );
}
