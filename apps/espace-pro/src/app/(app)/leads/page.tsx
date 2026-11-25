import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeadsPro } from "@/components/leads/leads-pro";
import { expirerLeads, leadsProfessionnel, releveFacturation, statsPro } from "@/lib/data/leads";
import { estInterne, profilCourant } from "@/lib/data/session";
import { isClient } from "@/lib/roles";
import { LeadsParRole } from "./leads-par-role";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const profil = await profilCourant();
  // Les leads non acceptés dans le délai reviennent au Lead Manager
  await expirerLeads();
  // Le Lead Manager travaille dans Lead Management
  if (profil?.role === "repartiteur") redirect("/lead-management");
  if (estInterne(profil)) {
    // Vue simple des leads du réseau, en lecture (l'outil complet est dans Lead Management)
    const leads = await leadsProfessionnel();
    return <LeadsPro leads={leads} lectureSeule stats={null} releve={[]} peutCreer={false} />;
  }
  if (profil && (isClient(profil.role) || profil.role === "atc")) {
    const gerant = profil.role === "client_gerant";
    const [leads, stats, releve] = await Promise.all([leadsProfessionnel(), isClient(profil.role) ? statsPro() : null, gerant ? releveFacturation() : []]);
    return <LeadsPro leads={leads} lectureSeule={profil.role === "atc"} stats={stats} releve={releve} peutCreer={isClient(profil.role)} />;
  }
  return <LeadsParRole />;
}
