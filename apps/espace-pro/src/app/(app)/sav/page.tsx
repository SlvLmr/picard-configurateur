import type { Metadata } from "next";
import { ROLES_TRAITEMENT } from "@/components/sav/libelles";
import { VueSav } from "@/components/sav/vue-sav";
import { demandesSav, intervenantsSav, statsSav } from "@/lib/data/sav";
import { profilCourant } from "@/lib/data/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "SAV" };

export default async function Page() {
  const profil = await profilCourant();
  if (!profil) return null;
  const [demandes, stats, intervenants] = await Promise.all([
    demandesSav(),
    statsSav(),
    ROLES_TRAITEMENT.includes(profil.role) ? intervenantsSav() : Promise.resolve([]),
  ]);
  return <VueSav demandes={demandes} stats={stats} intervenants={intervenants} role={profil.role} />;
}
