import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GestionContenus } from "@/components/administration/gestion-contenus";
import { toutesAnnonces, tousEvenements } from "@/lib/data/accueil";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Annonces et événements" };

export default async function Page() {
  const profil = await profilCourant();
  if (profil?.role !== "admin") redirect("/accueil");
  const [annonces, evenements] = await Promise.all([toutesAnnonces(), tousEvenements()]);
  return <GestionContenus annonces={annonces} evenements={evenements} />;
}
