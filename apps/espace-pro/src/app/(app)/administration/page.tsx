import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VueAdministration } from "@/components/administration/vue-administration";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { donneesAdministration } from "@/lib/data/administration";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Administration" };

export default async function Page() {
  const profil = await profilCourant();
  if (profil?.role !== "admin") redirect("/accueil");
  const d = await donneesAdministration();

  if (d.etat !== "ok") {
    return (
      <>
        <PageHeader title="Administration" description="Utilisateurs, rôles et invitations." />
        <EmptyState title={d.etat === "migration_manquante" ? "Module en cours d’installation" : "Impossible de charger les utilisateurs"}>
          {d.etat === "migration_manquante"
            ? "La mise à jour de la base de données qui active l’administration n’est pas encore appliquée. Elle le sera dès votre validation dans Supabase."
            : d.message}
        </EmptyState>
      </>
    );
  }
  return <VueAdministration {...d} moiId={profil.id} />;
}
