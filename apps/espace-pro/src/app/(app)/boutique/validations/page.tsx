import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ValidationsCommandes } from "@/components/boutique/validations-commandes";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { commandesAValider } from "@/lib/data/boutique";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Validation des commandes" };

export default async function Page() {
  const profil = await profilCourant();
  if (!profil) redirect("/connexion");

  if (profil.role !== "admin" && profil.role !== "chef_marche") {
    return (
      <>
        <PageHeader title="Validation des commandes" />
        <EmptyState
          title="Réservé aux chefs de marché"
          action={
            <ButtonLink href="/boutique" variant="secondary">
              Retour à la boutique
            </ButtonLink>
          }
        >
          <p>Les commandes de plus de 300 € passées par les commerciaux sont validées par leur chef de marché ou par l’administrateur.</p>
        </EmptyState>
      </>
    );
  }

  const commandes = await commandesAValider();
  return <ValidationsCommandes commandes={commandes} />;
}
