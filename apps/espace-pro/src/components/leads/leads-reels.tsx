"use client";

import { Flame, Hourglass, Inbox, Smile } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import type { Entonnoir, LeadGestion, Notification, StatsLeadManager as Stats } from "@/lib/data/types";
import { formatDuree } from "@/lib/format";
import { CarteLeads } from "./carte-leads";
import { PanneauEntonnoir } from "./entonnoir";
import { Envois } from "./envois";
import { BoutonNouveauLead } from "./formulaire-lead";
import { GestionLeads } from "./gestion-leads";
import { StatsLeadManager } from "./stats-lead-manager";
import { TableauLeads } from "./tableau-leads";

type Vue = "tableau" | "liste" | "carte" | "stats" | "envois";

/** Page Leads des équipes internes : poste du Lead Manager, statistiques et journal des envois. */
export function LeadsReels({
  leads,
  stats,
  entonnoir,
  peutAttribuer,
  notifications,
  envoiConfigure,
}: {
  leads: LeadGestion[];
  stats: Stats | null;
  entonnoir: Entonnoir;
  peutAttribuer: boolean;
  notifications: Notification[];
  envoiConfigure: boolean;
}) {
  const [vue, setVue] = useState<Vue>("tableau");
  const demo = leads.some((l) => l.demo);
  const aValider = leads.filter((l) => l.statut === "a_valider");
  const chauds = aValider.filter((l) => l.temperature === "chaud").length;
  return (
    <>
      <PageHeader
        title="Lead Management"
        meta={demo ? <Badge variant="warning">Données de démonstration</Badge> : null}
        description={
          peutAttribuer
            ? "Qualifiez chaque demande, orientez-la vers le bon installateur et suivez-la jusqu’à la pose. L’installateur a 24 h pour accepter, sinon le lead vous revient."
            : "Tous les leads du réseau, leur avancement et la satisfaction des clients. Consultation seule."
        }
        actions={peutAttribuer ? <BoutonNouveauLead /> : null}
      />
      <KpiBand
        items={[
          { label: "À traiter", value: aValider.length, icon: Inbox, tone: aValider.length ? "cta" : "neutral", note: stats ? `${stats.a_qualifier} pas encore qualifiés` : undefined },
          { label: "Leads chauds en attente", value: chauds, icon: Flame, tone: chauds ? "danger" : "neutral", note: "À orienter en priorité" },
          {
            label: "Délai d’acceptation",
            value: stats?.delai_acceptation_min ? formatDuree(stats.delai_acceptation_min) : "–",
            icon: Hourglass,
            tone: stats?.en_retard ? "warning" : "accent",
            note: stats?.en_retard ? `${stats.en_retard} lead${stats.en_retard > 1 ? "s" : ""} en retard` : "Moyenne sur 30 jours",
          },
          {
            label: "NPS clients",
            value: stats?.nps_client.score === null || stats?.nps_client.score === undefined ? "–" : stats.nps_client.score,
            icon: Smile,
            tone: "success",
            note: stats ? `${stats.nps_client.reponses} réponse${stats.nps_client.reponses > 1 ? "s" : ""}` : undefined,
          },
        ]}
      />
      <div className="mt-8 overflow-x-auto">
        <Segmented
          label="Vue"
          value={vue}
          onChange={setVue}
          options={[
            { value: "tableau", label: "Tableau" },
            { value: "liste", label: "Liste", count: leads.length },
            { value: "carte", label: "Carte" },
            { value: "stats", label: "Statistiques" },
            { value: "envois", label: "E-mails et SMS", count: stats?.notifications_en_attente || undefined },
          ]}
        />
      </div>
      <div className="mt-6 flex flex-col gap-8">
        {vue === "tableau" ? <TableauLeads leads={leads} peutGerer={peutAttribuer} /> : null}
        {vue === "liste" ? <GestionLeads leads={leads} peutGerer={peutAttribuer} /> : null}
        {vue === "carte" ? <CarteLeads leads={leads} /> : null}
        {vue === "stats" ? (
          <>
            {stats ? <StatsLeadManager s={stats} jours={30} /> : null}
            <PanneauEntonnoir initial={entonnoir} />
          </>
        ) : null}
        {vue === "envois" ? <Envois notifications={notifications} configure={envoiConfigure} /> : null}
      </div>
    </>
  );
}
