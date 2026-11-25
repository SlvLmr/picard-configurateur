import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RapprochementNavision } from "@/components/leads/rapprochement-navision";
import { donneesNavision } from "@/lib/data/navision";
import { estInterne, profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Commandes Navision" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const profil = await profilCourant();
  if (!estInterne(profil)) redirect("/leads");
  const donnees = await donneesNavision();
  return <RapprochementNavision {...donnees} modifiable={profil?.role === "admin"} />;
}
