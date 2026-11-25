import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FicheLead } from "@/components/leads/fiche-lead";
import { ficheLead } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Fiche lead" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const profil = await profilCourant();
  if (!estInterne(profil)) redirect(`/leads/${params.id}`);
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const fiche = await ficheLead(params.id, true);
  if (!fiche) notFound();
  return <FicheLead fiche={fiche} mode={peutAttribuer(profil) ? "gestion" : "lecture"} retour="/lead-management" />;
}
