import type { Metadata } from "next";
import { journeeCommercial } from "@/lib/data/crm";
import { leadsAValider, statsLeads } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { AccueilParRole } from "./accueil-par-role";

export const metadata: Metadata = { title: "Accueil" };

export default async function Page() {
  const profil = await profilCourant();
  const reel = estInterne(profil)
    ? { leads: await leadsAValider(4), stats: await statsLeads(30), peutAttribuer: peutAttribuer(profil), prenom: profil?.prenom ?? null }
    : null;
  const avecJournee = profil && ["atc", "admin", "codir", "chef_service", "chef_marche"].includes(profil.role);
  const journee = avecJournee ? await journeeCommercial().catch(() => null) : null;
  return <AccueilParRole reel={reel} journee={journee} />;
}
