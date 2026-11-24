import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BoutiqueVue } from "@/components/boutique/boutique-vue";
import { donneesBoutique } from "@/lib/data/boutique";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Boutique" };

export default async function Page() {
  const profil = await profilCourant();
  if (!profil) redirect("/connexion");
  const donnees = await donneesBoutique(profil);
  return <BoutiqueVue donnees={donnees} role={profil.role} />;
}
