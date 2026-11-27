import type { Metadata } from "next";
import { PilotageDigital } from "@/components/digital/pilotage-digital";
import { mesuresDigital } from "@/lib/data/digital";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Traffic management" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [profil, mesures] = await Promise.all([profilCourant(), mesuresDigital()]);
  return <PilotageDigital mesures={mesures} modifiable={profil?.role === "admin"} />;
}
