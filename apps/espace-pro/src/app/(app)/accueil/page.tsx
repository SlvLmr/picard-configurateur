import type { Metadata } from "next";
import { leadsAValider, statsLeads } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { AccueilParRole } from "./accueil-par-role";

export const metadata: Metadata = { title: "Accueil" };

export default async function Page() {
  const profil = await profilCourant();
  const reel = estInterne(profil)
    ? { leads: await leadsAValider(4), stats: await statsLeads(30), peutAttribuer: peutAttribuer(profil), prenom: profil?.prenom ?? null }
    : null;
  return <AccueilParRole reel={reel} />;
}
