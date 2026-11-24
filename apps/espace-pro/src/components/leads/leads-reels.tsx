import { CircleCheck, Hourglass, Inbox, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Repartition } from "@/components/ui/repartition";
import { formatDuree } from "@/lib/format";
import type { LeadReel, StatsLeads } from "@/lib/data/types";
import { LeadQueueReel } from "./lead-queue-reel";

export const COULEURS_STATUT = {
  a_valider: "var(--line-strong)",
  attribue: "var(--accent-soft)",
  accepte: "var(--bleu-300)",
  contacte: "var(--bleu-400)",
  devis: "var(--accent)",
  signe: "var(--success)",
  perdu: "var(--danger)",
} as const;

export const LIBELLES_STATUT = {
  a_valider: "À valider",
  attribue: "En attente du pro",
  accepte: "Acceptés",
  contacte: "Contactés",
  devis: "Devis envoyés",
  signe: "Signés",
  perdu: "Perdus",
} as const;

export function LeadsReels({ leads, stats, peutAttribuer }: { leads: LeadReel[]; stats: StatsLeads | null; peutAttribuer: boolean }) {
  const demo = leads.some((l) => l.demo);
  return (
    <>
      <PageHeader
        title={peutAttribuer ? "File de validation" : "Leads du réseau"}
        meta={demo ? <Badge variant="warning">Données de démonstration</Badge> : null}
        description="Chaque lead est pré-attribué dans son département : IAP Elite, puis Premium, puis Officiel, en servant d’abord le moins sollicité. Sans client dans le département, il revient au commercial du secteur."
      />
      {stats ? (
        <KpiBand
          items={[
            { label: "À valider", value: stats.a_valider, icon: Inbox, tone: "cta", note: `${stats.sans_pro} sans pro à proximité` },
            { label: "Délai moyen de prise en charge", value: stats.delai_moyen_min ? formatDuree(stats.delai_moyen_min) : "–", icon: Timer, note: "Réception → acceptation, 30 jours" },
            { label: "Acceptés en moins de 24 h", value: stats.acceptes_24h_pct ?? "–", unit: "%", icon: Hourglass, tone: "success" },
            { label: "Taux de transformation", value: stats.transformation_pct ?? "–", unit: "%", icon: CircleCheck, tone: "accent", note: `${stats.statut_renseigne_pct ?? 0} % des statuts renseignés` },
          ]}
        />
      ) : null}
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="À valider" description="Du plus ancien au plus récent" />
          <LeadQueueReel leads={leads} peutAttribuer={peutAttribuer} />
        </Panel>
        {stats ? (
          <Panel className="self-start">
            <PanelHeader title="Où en sont les leads" description={`${stats.recus} leads reçus sur 30 jours`} />
            <PanelBody>
              <Repartition
                label="Répartition des leads par statut"
                segments={(Object.keys(LIBELLES_STATUT) as (keyof typeof LIBELLES_STATUT)[])
                  .filter((k) => k !== "a_valider")
                  .map((k) => ({ label: LIBELLES_STATUT[k], value: stats.par_statut[k] ?? 0, color: COULEURS_STATUT[k] }))}
              />
            </PanelBody>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
