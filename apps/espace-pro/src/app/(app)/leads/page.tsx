import type { Metadata } from "next";
import { LeadsPro } from "@/components/leads/leads-pro";
import { LeadsReels } from "@/components/leads/leads-reels";
import { entonnoirLeads, leadsGestion, leadsProfessionnel, statsLeads } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { isClient } from "@/lib/roles";
import { LeadsParRole } from "./leads-par-role";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const profil = await profilCourant();
  if (estInterne(profil)) {
    const [leads, stats, entonnoir] = await Promise.all([leadsGestion(365), statsLeads(30), entonnoirLeads(30)]);
    return <LeadsReels leads={leads} stats={stats} entonnoir={entonnoir} peutAttribuer={peutAttribuer(profil)} />;
  }
  if (profil && (isClient(profil.role) || profil.role === "atc")) {
    return <LeadsPro leads={await leadsProfessionnel()} lectureSeule={profil.role === "atc"} />;
  }
  return <LeadsParRole />;
}
