import type { Metadata } from "next";
import { Mediatheque } from "@/components/mediatheque/mediatheque";
import { ressourcesVisibles } from "@/lib/data/mediatheque";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Médiathèque" };

export default async function Page() {
  const [profil, { ressources, stats }] = await Promise.all([profilCourant(), ressourcesVisibles()]);
  return <Mediatheque ressources={ressources} stats={stats} peutPublier={profil?.role === "admin"} />;
}
