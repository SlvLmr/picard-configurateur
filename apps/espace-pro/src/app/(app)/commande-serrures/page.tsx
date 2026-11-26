import type { Metadata } from "next";
import { PageAVenir } from "@/components/ui/page-a-venir";

export const metadata: Metadata = { title: "Commande serrures" };

export default function Page() {
  return (
    <PageAVenir
      titre="Commande serrures"
      description="Commander serrures, cylindres et pièces détachées Picard Serrures, et suivre ses commandes."
      fonctions={[
        "Trouver une serrure ou un cylindre par gamme, référence ou caractéristiques",
        "Passer commande avec ses conditions tarifaires",
        "Suivre l’état et la livraison de ses commandes",
        "Retrouver ses factures et recommander en un clic",
      ]}
    />
  );
}
