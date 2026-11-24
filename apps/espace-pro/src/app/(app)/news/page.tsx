import type { Metadata } from "next";
import { PageNews } from "@/components/communication/page-news";
import { annoncesActives } from "@/lib/data/accueil";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "News" };

export default async function Page() {
  const [profil, annonces] = await Promise.all([profilCourant(), annoncesActives()]);
  return <PageNews annonces={annonces} admin={profil?.role === "admin"} />;
}
