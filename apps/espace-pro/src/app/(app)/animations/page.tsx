import type { Metadata } from "next";
import { PageAnimations } from "@/components/animations/page-animations";
import { donneesAnimations } from "@/lib/data/animations";
import { profilCourant } from "@/lib/data/session";
import { isClient } from "@/lib/roles";

export const metadata: Metadata = { title: "Animations" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const profil = await profilCourant();
  const client = !!profil && isClient(profil.role);
  const donnees = await donneesAnimations(client);
  return <PageAnimations {...donnees} client={client} admin={profil?.role === "admin"} />;
}
