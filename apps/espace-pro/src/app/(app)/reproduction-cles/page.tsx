import type { Metadata } from "next";
import { PageAVenir } from "@/components/ui/page-a-venir";

export const metadata: Metadata = { title: "Reproduction de clés" };

export default function Page() {
  return (
    <PageAVenir
      titre="Reproduction de clés"
      description="Demander la reproduction de clés protégées et suivre chaque demande jusqu’à l’expédition."
      fonctions={[
        "Déposer une demande avec le numéro de carte de propriété",
        "Joindre les justificatifs nécessaires aux clés protégées",
        "Suivre l’avancement et la date d’expédition",
        "Retrouver l’historique des reproductions par client",
      ]}
    />
  );
}
