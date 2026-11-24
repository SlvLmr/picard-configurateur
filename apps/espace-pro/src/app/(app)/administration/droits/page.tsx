import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GestionDroits } from "@/components/administration/gestion-droits";
import { droits } from "@/lib/data/administration";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Rôles et droits" };

export default async function Page() {
  if ((await profilCourant())?.role !== "admin") redirect("/accueil");
  return <GestionDroits droits={await droits()} />;
}
