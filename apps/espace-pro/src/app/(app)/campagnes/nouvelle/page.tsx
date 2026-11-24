import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NouvelleCampagne } from "@/components/campagnes/nouvelle-campagne";
import { peutGererCampagnes, zonesCampagne } from "@/lib/data/campagnes";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Nouvelle campagne" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const profil = await profilCourant();
  if (!peutGererCampagnes(profil)) redirect("/campagnes");
  return <NouvelleCampagne zones={await zonesCampagne()} />;
}
