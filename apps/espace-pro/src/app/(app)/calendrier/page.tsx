import type { Metadata } from "next";
import { PageCalendrier } from "@/components/communication/page-calendrier";
import { agenda } from "@/lib/data/accueil";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Calendrier" };

export default async function Page() {
  const maintenant = new Date();
  // Deux années pleines : la frise se parcourt de janvier de l'an dernier à décembre de l'an prochain
  const debut = new Date(maintenant.getFullYear() - 1, 0, 1);
  const fin = new Date(maintenant.getFullYear() + 1, 11, 31);
  const [profil, elements] = await Promise.all([profilCourant(), agenda(debut, fin).catch(() => [])]);
  return <PageCalendrier elements={elements} admin={profil?.role === "admin"} />;
}
