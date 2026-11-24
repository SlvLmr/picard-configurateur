import type { Metadata } from "next";
import { ListeCampagnes } from "@/components/campagnes/liste-campagnes";
import { campagnesResume, peutGererCampagnes } from "@/lib/data/campagnes";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Pilotage campagne" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [profil, campagnes] = await Promise.all([profilCourant(), campagnesResume()]);
  return <ListeCampagnes campagnes={campagnes} gestion={peutGererCampagnes(profil)} />;
}
