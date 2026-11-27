import type { Metadata } from "next";
import { PageAVenir } from "@/components/ui/page-a-venir";

export const metadata: Metadata = { title: "SAV management" };

export default function Page() {
  return (
    <PageAVenir
      titre="SAV management"
      description="Piloter le service après-vente : volumes, délais, qualité et coûts, par produit et par secteur."
      fonctions={[
        "Suivre les demandes ouvertes, les délais de prise en charge et de résolution",
        "Repérer les produits et les défauts les plus fréquents",
        "Mesurer la charge et la performance des intervenants",
        "Suivre la satisfaction des clients après intervention et le coût du SAV",
      ]}
    />
  );
}
