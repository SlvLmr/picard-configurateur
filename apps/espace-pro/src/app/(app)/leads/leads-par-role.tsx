"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatBand } from "@/components/ui/stat-band";
import { LeadInbox } from "@/components/leads/lead-inbox";
import { LeadQueue } from "@/components/leads/lead-queue";
import { formatDuree } from "@/lib/format";
import { LEADS, LEADS_CLIENT, PIPELINE_CLIENT, STATS_LEADS } from "@/lib/mock/leads";
import { isClient } from "@/lib/roles";
import { useSession } from "@/lib/session";

export function LeadsParRole() {
  const { persona } = useSession();

  if (isClient(persona.role) || persona.role === "atc") {
    const atc = persona.role === "atc";
    return (
      <>
        <PageHeader
          title={atc ? "Leads de mes clients" : "Mes leads"}
          description={
            atc
              ? "Suivez la réactivité de votre portefeuille. Un lead en attente est un bon sujet de visite."
              : "Votre réactivité compte dans l’attribution des prochains leads."
          }
        />
        <Panel>
          <PanelHeader title={atc ? "En attente chez mes clients" : "À accepter"} />
          <LeadInbox leads={LEADS_CLIENT} readOnly={atc} />
        </Panel>
        {!atc ? (
          <div className="mt-8">
            <StatBand
              items={PIPELINE_CLIENT.map((p) => ({ label: p.etape, value: p.n }))}
            />
            <p className="mt-3 text-xs text-text-3">Chaque statut renseigné rapporte 10 points et alimente votre taux de transformation.</p>
          </div>
        ) : null}
      </>
    );
  }

  const s = STATS_LEADS;
  const lecture = persona.role !== "repartiteur";
  return (
    <>
      <PageHeader
        title={lecture ? "Leads du réseau" : "File de validation"}
        description="Chaque lead est pré-attribué au professionnel le plus proche : IAP Elite, puis Premium, puis Officiel, puis les autres clients. Sans client à proximité, il revient au commercial du secteur."
        actions={
          <Button>
            <Download aria-hidden />
            Exporter
          </Button>
        }
      />
      <StatBand
        items={[
          { label: "Taux de transformation", value: `${s.tauxTransformation} %`, note: "2 points de plus", tone: "positive" },
          { label: "Délai moyen de prise en charge", value: formatDuree(s.delaiMoyenMin), note: "18 min de moins", tone: "positive" },
          { label: "Acceptés en moins de 24 h", value: `${s.accepteesSous24h} %` },
          { label: "Sans pro à proximité", value: s.sansProProche, note: "Renvoyés aux commerciaux" },
        ]}
      />
      <Panel className="mt-8">
        <PanelHeader title={lecture ? "Derniers leads" : "À valider"} description="Du plus ancien au plus récent" />
        <LeadQueue leads={[...LEADS].reverse()} readOnly={lecture} />
      </Panel>
    </>
  );
}
