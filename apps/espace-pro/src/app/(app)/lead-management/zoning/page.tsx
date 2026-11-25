import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EditeurZoning } from "@/components/leads/editeur-zoning";
import { estInterne, profilCourant } from "@/lib/data/session";
import { secteursZoning } from "@/lib/data/zoning";

export const metadata: Metadata = { title: "Zoning" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const profil = await profilCourant();
  if (!estInterne(profil)) redirect("/leads");
  const secteurs = await secteursZoning();
  return <EditeurZoning secteurs={secteurs} modifiable={profil?.role === "admin"} />;
}
