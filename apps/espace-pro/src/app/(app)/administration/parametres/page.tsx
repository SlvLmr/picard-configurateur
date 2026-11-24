import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GestionParametres } from "@/components/administration/gestion-parametres";
import { parametres } from "@/lib/data/administration";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Paramètres" };

export default async function Page() {
  if ((await profilCourant())?.role !== "admin") redirect("/accueil");
  return <GestionParametres parametres={await parametres()} />;
}
