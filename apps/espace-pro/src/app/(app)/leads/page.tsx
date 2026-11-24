import type { Metadata } from "next";
import { LeadsPro } from "@/components/leads/leads-pro";
import { LeadsReels } from "@/components/leads/leads-reels";
import { entonnoirLeads, expirerLeads, leadsGestion, leadsProfessionnel, notificationsRecentes, releveFacturation, statsLeadManager, statsPro } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { envoiConfigure } from "@/lib/notifications";
import { isClient } from "@/lib/roles";
import { LeadsParRole } from "./leads-par-role";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const profil = await profilCourant();
  // Les leads non acceptés dans le délai reviennent au Lead Manager
  await expirerLeads();
  if (estInterne(profil)) {
    const [leads, stats, entonnoir, notifications] = await Promise.all([leadsGestion(365), statsLeadManager(30), entonnoirLeads(30), notificationsRecentes()]);
    return (
      <LeadsReels
        leads={leads}
        stats={stats}
        entonnoir={entonnoir}
        peutAttribuer={peutAttribuer(profil)}
        notifications={notifications}
        envoiConfigure={envoiConfigure()}
      />
    );
  }
  if (profil && (isClient(profil.role) || profil.role === "atc")) {
    const gerant = profil.role === "client_gerant";
    const [leads, stats, releve] = await Promise.all([leadsProfessionnel(), isClient(profil.role) ? statsPro() : null, gerant ? releveFacturation() : []]);
    return <LeadsPro leads={leads} lectureSeule={profil.role === "atc"} stats={stats} releve={releve} peutCreer={isClient(profil.role)} />;
  }
  return <LeadsParRole />;
}
