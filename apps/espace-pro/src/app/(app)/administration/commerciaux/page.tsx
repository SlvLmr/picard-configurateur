import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GestionCommerciaux } from "@/components/administration/gestion-commerciaux";
import { commerciauxAdmin } from "@/lib/data/administration";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Commerciaux et zones" };

export default async function Page() {
  if ((await profilCourant())?.role !== "admin") redirect("/accueil");
  return <GestionCommerciaux commerciaux={await commerciauxAdmin()} />;
}
