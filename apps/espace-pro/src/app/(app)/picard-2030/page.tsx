import type { Metadata } from "next";
import { PageAVenir } from "@/components/ui/page-a-venir";

export const metadata: Metadata = { title: "Picard 2030" };

export default function Page() {
  return (
    <PageAVenir
      titre="Picard 2030"
      description="Le plan stratégique de Picard Serrures : ambitions, chantiers et indicateurs de suivi."
      fonctions={[
        "Les ambitions et les objectifs chiffrés à l’horizon 2030",
        "Les chantiers prioritaires, leurs responsables et leur avancement",
        "Les indicateurs clés suivis année après année",
        "Les temps forts et les décisions de la direction",
      ]}
    />
  );
}
