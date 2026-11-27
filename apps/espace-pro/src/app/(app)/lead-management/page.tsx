import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeadsReels } from "@/components/leads/leads-reels";
import { entonnoirLeads, expirerLeads, leadsGestion, notificationsRecentes, statsLeadManager } from "@/lib/data/leads";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { envoiConfigure } from "@/lib/notifications";

export const metadata: Metadata = { title: "Lead management" };
export const dynamic = "force-dynamic";

/** Outil interne du Lead Manager : validation, qualification, attribution, carte, envois et statistiques du réseau. */
export default async function Page() {
  const profil = await profilCourant();
  if (!estInterne(profil)) redirect("/leads");
  // Les leads non acceptés dans le délai reviennent au Lead Manager
  await expirerLeads();
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
