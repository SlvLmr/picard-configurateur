import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VueCampagne } from "@/components/campagnes/vue-campagne";
import { avancementCampagne, campagne, ciblesCampagne, peutGererCampagnes } from "@/lib/data/campagnes";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Pilotage campagne" };
export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: { atc?: string; vue?: string } }) {
  const [profil, c] = await Promise.all([profilCourant(), campagne(params.id)]);
  if (!c) notFound();
  const [avancement, cibles] = await Promise.all([avancementCampagne(c.id), ciblesCampagne(c.id)]);
  const gestion = peutGererCampagnes(profil);
  return (
    <VueCampagne
      campagne={c}
      avancement={avancement}
      cibles={cibles}
      gestion={gestion}
      peutAgir={gestion || profil?.role === "atc"}
      atcInitial={searchParams.atc ?? null}
      vueInitiale={gestion && searchParams.vue !== "clients" && !searchParams.atc ? "avancement" : "clients"}
    />
  );
}
