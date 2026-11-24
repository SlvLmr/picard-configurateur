import { Building2, CalendarDays, MailPlus, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Briques } from "@/components/accueil/briques";
import { PageHeader } from "@/components/ui/page-header";
import { commerciauxAdmin, comptesAdmin, donneesAdministration } from "@/lib/data/administration";
import { tousEvenements } from "@/lib/data/accueil";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Administration" };

export default async function Page() {
  const profil = await profilCourant();
  if (profil?.role !== "admin") redirect("/accueil");
  const [d, commerciaux, comptes, evenements] = await Promise.all([donneesAdministration(), commerciauxAdmin(), comptesAdmin(), tousEvenements()]);
  const utilisateurs = d.etat === "ok" ? d.utilisateurs : [];
  const invitations = d.etat === "ok" ? d.invitations : [];
  const sansRole = utilisateurs.filter((u) => !u.role).length;
  const zones = new Set(commerciaux.filter((c) => c.actif).map((c) => c.equipe)).size;

  return (
    <>
      <PageHeader title="Administration" description="Tout ce qui se règle dans l’Espace Pro, rubrique par rubrique." />
      <Briques
        items={[
          { label: "Utilisateurs", valeur: utilisateurs.filter((u) => u.role && u.actif).length, aide: sansRole ? `${sansRole} compte${sansRole > 1 ? "s" : ""} sans rôle` : `${invitations.length} invitation${invitations.length > 1 ? "s" : ""} en attente`, href: "/administration/utilisateurs", icon: MailPlus, ton: "cta", attention: sansRole > 0 },
          { label: "Commerciaux et zones", valeur: commerciaux.filter((c) => c.actif).length, aide: `${zones} zones`, href: "/administration/commerciaux", icon: UsersRound, ton: "accent" },
          { label: "Clients", valeur: comptes.filter((c) => c.actif).length, aide: `${comptes.filter((c) => c.niveau).length} IAP`, href: "/administration/clients", icon: Building2, ton: "success" },
          { label: "Actualités et calendrier", valeur: evenements.length, aide: "Événements à venir", href: "/administration/contenus", icon: CalendarDays, ton: "warning" },
          { label: "Rôles et droits", valeur: "Accès", aide: "Qui voit quelle rubrique", href: "/administration/droits", icon: ShieldCheck, ton: "neutral" },
          { label: "Paramètres", valeur: "Règles", aide: "Délais, points, seuils", href: "/administration/parametres", icon: Settings2, ton: "neutral" },
        ]}
      />
    </>
  );
}
