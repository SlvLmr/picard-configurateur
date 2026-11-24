import { CircleCheck, Hourglass, Inbox, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { formatDuree } from "@/lib/format";
import type { Entonnoir, LeadGestion, StatsLeads } from "@/lib/data/types";
import { PanneauEntonnoir } from "./entonnoir";
import { GestionLeads } from "./gestion-leads";

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

/** Page Leads des équipes internes : indicateurs, entonnoir et poste de gestion. */
export function LeadsReels({
  leads,
  stats,
  entonnoir,
  peutAttribuer,
}: {
  leads: LeadGestion[];
  stats: StatsLeads | null;
  entonnoir: Entonnoir;
  peutAttribuer: boolean;
}) {
  const demo = leads.some((l) => l.demo);
  return (
    <>
      <PageHeader
        title={peutAttribuer ? "Gestion des leads" : "Leads du réseau"}
        meta={demo ? <Badge variant="warning">Données de démonstration</Badge> : null}
        description="Chaque lead est pré-attribué dans son département : IAP Elite, puis Premium, puis Officiel, en servant d’abord le moins sollicité. Ouvrez un lead pour le détail, les notes et l’attribution par zone."
      />
      {stats ? (
        <KpiBand
          items={[
            { label: "À valider", value: stats.a_valider, icon: Inbox, tone: stats.a_valider ? "cta" : "neutral", note: `${stats.sans_pro} sans pro à proximité` },
            { label: "En attente du pro", value: stats.en_attente_pro, icon: Hourglass, tone: "accent", note: "Attribués, pas encore acceptés" },
            {
              label: "Délai moyen de prise en charge",
              value: stats.delai_moyen_min ? formatDuree(stats.delai_moyen_min) : "–",
              icon: Timer,
              note: `${stats.acceptes_24h_pct ?? 0} % acceptés en moins de 24 h`,
            },
            { label: "Taux de transformation", value: stats.transformation_pct ?? "–", unit: "%", icon: CircleCheck, tone: "success", note: `${stats.statut_renseigne_pct ?? 0} % des statuts renseignés` },
          ]}
        />
      ) : null}
      <div className="mt-8 flex flex-col gap-8">
        <GestionLeads leads={leads} peutGerer={peutAttribuer} />
        <PanneauEntonnoir initial={entonnoir} />
      </div>
    </>
  );
}
