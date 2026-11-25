import type { Metadata } from "next";
import { PageCalendrier } from "@/components/communication/page-calendrier";
import { ANNEE_DEPART, ANNEES } from "@/lib/periode-calendrier";
import { agenda } from "@/lib/data/accueil";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Calendrier" };

export default async function Page() {
  // Même période que la frise : à partir de janvier 2027, sur deux ans
  const depart = Math.max(ANNEE_DEPART, new Date().getFullYear());
  const debut = new Date(depart, 0, 1);
  const fin = new Date(depart + ANNEES - 1, 11, 31, 23, 59);
  const [profil, elements] = await Promise.all([profilCourant(), agenda(debut, fin).catch(() => [])]);
  return <PageCalendrier elements={elements} admin={profil?.role === "admin"} />;
}
