import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GestionClients } from "@/components/administration/gestion-clients";
import { commerciauxAdmin, comptesAdmin } from "@/lib/data/administration";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Clients" };

export default async function Page() {
  if ((await profilCourant())?.role !== "admin") redirect("/accueil");
  const [comptes, commerciaux] = await Promise.all([comptesAdmin(), commerciauxAdmin()]);
  return <GestionClients comptes={comptes} commerciaux={commerciaux} />;
}
