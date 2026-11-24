import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FicheLead } from "@/components/leads/fiche-lead";
import { ficheLead } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Fiche lead" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const profil = await profilCourant();
  // Fiche réservée aux équipes internes et au commercial du lead (la sécurité par ligne filtre le reste)
  if (!profil || !(estInterne(profil) || profil.role === "atc")) redirect("/leads");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const fiche = await ficheLead(params.id, estInterne(profil));
  if (!fiche) notFound();
  return <FicheLead fiche={fiche} peutGerer={peutAttribuer(profil)} />;
}
