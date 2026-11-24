import type { Metadata } from "next";
import { Mediatheque } from "@/components/mediatheque/mediatheque";
import { catalogueMedia, ressourcesVisibles } from "@/lib/data/mediatheque";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Médiathèque" };

export default async function Page() {
  const [profil, { ressources, stats }, { gammes, produits }] = await Promise.all([profilCourant(), ressourcesVisibles(), catalogueMedia()]);
  return <Mediatheque ressources={ressources} stats={stats} gammes={gammes} produits={produits} peutPublier={profil?.role === "admin"} />;
}
