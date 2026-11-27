import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FicheLead } from "@/components/leads/fiche-lead";
import { ficheLead } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { isClient } from "@/lib/roles";

export const metadata: Metadata = { title: "Fiche lead" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const profil = await profilCourant();
  if (!profil || !(estInterne(profil) || profil.role === "atc" || isClient(profil.role))) redirect("/leads");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  // Les équipes internes ouvrent la fiche dans Lead management
  if (estInterne(profil)) redirect(`/lead-management/${params.id}`);
  // La sécurité par ligne filtre les leads que l'utilisateur ne peut pas voir
  const fiche = await ficheLead(params.id, estInterne(profil));
  if (!fiche) notFound();
  const mode = peutAttribuer(profil) ? "gestion" : isClient(profil.role) ? "pro" : "lecture";
  return <FicheLead fiche={fiche} mode={mode} />;
}
