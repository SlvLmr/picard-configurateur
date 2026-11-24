import type { Metadata } from "next";
import { LeadsReels } from "@/components/leads/leads-reels";
import { leadsAValider, statsLeads } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { LeadsParRole } from "./leads-par-role";

export const metadata: Metadata = { title: "Leads" };

export default async function Page() {
  const profil = await profilCourant();
  if (estInterne(profil)) {
    const [leads, stats] = await Promise.all([leadsAValider(), statsLeads(30)]);
    return <LeadsReels leads={leads} stats={stats} peutAttribuer={peutAttribuer(profil)} />;
  }
  return <LeadsParRole />;
}
