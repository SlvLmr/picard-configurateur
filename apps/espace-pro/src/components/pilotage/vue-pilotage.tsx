import { BadgeEuro, CalendarClock, Handshake, Target, TrendingDown, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Jauge } from "@/components/ui/jauge";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import type { Signal, SynthesePilotage } from "@/lib/data/pilotage";
import type { StatsLeads } from "@/lib/data/types";
import { BarreObjectif, Evolution } from "./barre-objectif";
import { CourbeMensuelle } from "./courbe-mensuelle";
import { MOIS_LONGS, NOMS_GAMMES, enMillions, evolution, montantCourt, ratio } from "./montants";
import { TableauCommerciaux } from "./tableau-commerciaux";

export function VuePilotage({ synthese, signaux, leads }: { synthese: SynthesePilotage; signaux: Signal[]; leads: StatsLeads | null }) {
  const s = synthese.societe;
  const fin = synthese.dernier_mois ? MOIS_LONGS[synthese.dernier_mois - 1] : null;
  const atteinte = ratio(s.realise_cumul, s.budget_cumul);
  const evol = evolution(s.realise_cumul, s.n1_cumul);
  const reste = Math.max(0, s.budget_annuel - s.realise_cumul);
  const moisRestants = 12 - synthese.dernier_mois;
  const tendance = synthese.mois.filter((m) => m.realise !== null).slice(-7).map((m) => m.realise as number);

  return (
    <>
      <PageHeader
        title="Pilotage commercial"
        meta={<Badge variant="success">Données de l’outil Commerce</Badge>}
        description={
          fin
            ? `Chiffre d’affaires ${synthese.annee} arrêté à fin ${fin}, comparé au budget et à ${synthese.annee - 1} sur la même période.`
            : `Aucun réalisé saisi pour ${synthese.annee} pour l’instant.`
        }
      />

      <KpiBand
        items={[
          {
            label: "Réalisé à date",
            value: enMillions(s.realise_cumul),
            unit: "M€",
            icon: BadgeEuro,
            tone: "cta",
            delta: evol !== null ? { text: `${evol > 0 ? "+" : "−"}${Math.abs(evol)} % sur un an`, sens: evol >= 0 ? "up" : "down", bon: evol >= 0 } : undefined,
            trend: tendance.length > 1 ? tendance : undefined,
          },
          {
            label: "Atteinte du budget à date",
            value: atteinte ?? "–",
            unit: "%",
            icon: Target,
            tone: atteinte !== null && atteinte >= 100 ? "success" : atteinte !== null && atteinte < 90 ? "warning" : "accent",
            note: `Budget à date : ${montantCourt(s.budget_cumul)}`,
          },
          {
            label: "Reste à faire sur l’année",
            value: enMillions(reste),
            unit: "M€",
            icon: CalendarClock,
            tone: "neutral",
            note: moisRestants > 0 ? `Soit ${montantCourt(reste / moisRestants)} par mois sur ${moisRestants} mois` : "Année terminée",
          },
          {
            label: "Transformation des leads",
            value: leads?.transformation_pct ?? "–",
            unit: "%",
            icon: Handshake,
            tone: "success",
            note: leads ? `${leads.recus} leads reçus sur 90 jours` : undefined,
          },
        ]}
      />

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Chiffre d’affaires mensuel" description="Survolez un mois pour le détail" />
          <PanelBody>
            <CourbeMensuelle mois={synthese.mois} annee={synthese.annee} />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader title="Objectif annuel" description={`Budget ${synthese.annee} : ${montantCourt(s.budget_annuel)}`} />
          <PanelBody className="flex flex-col items-center gap-6">
            <Jauge
              value={s.realise_cumul}
              max={s.budget_annuel}
              target={s.budget_cumul}
              label="Réalisé par rapport au budget annuel"
              valueLabel={`${ratio(s.realise_cumul, s.budget_annuel) ?? 0} %`}
              sousTitre={`${montantCourt(s.realise_cumul)} sur ${montantCourt(s.budget_annuel)}`}
              tone={atteinte !== null && atteinte >= 100 ? "success" : "accent"}
              size={260}
            />
            <p className="max-w-xs text-center text-xs text-text-3">Le trait noir indique où il faudrait être aujourd’hui pour tenir le budget.</p>
          </PanelBody>
        </Panel>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Équipe commerciale" description={`${synthese.commerciaux.length} commerciaux, cumul à date`} />
          <TableauCommerciaux commerciaux={synthese.commerciaux} />
        </Panel>
        <div className="flex flex-col gap-8">
          <Panel>
            <PanelHeader title="Par gamme" description="Atteinte du budget et évolution sur un an" />
            <ul>
              {synthese.gammes.map((g) => (
                <li key={g.gamme} className="border-t border-line px-6 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-text">{NOMS_GAMMES[g.gamme] ?? g.gamme}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular text-sm text-text-2">{montantCourt(g.realise_cumul)}</span>
                      <Evolution valeur={evolution(g.realise_cumul, g.n1_cumul)} />
                    </span>
                  </div>
                  <div className="mt-2">
                    <BarreObjectif pct={ratio(g.realise_cumul, g.budget_cumul)} label={`Atteinte du budget, gamme ${g.gamme}`} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <SignauxPanel signaux={signaux} />
        </div>
      </div>

      {leads ? <EntonnoirLeads stats={leads} /> : null}
    </>
  );
}

function SignauxPanel({ signaux }: { signaux: Signal[] }) {
  const icone = (s: Signal) => (s.type === "commercial" ? Users : s.type === "gamme" ? TrendingDown : TriangleAlert);
  return (
    <Panel>
      <PanelHeader title="Signaux à surveiller" description={signaux.length ? `${signaux.length} points d’attention` : undefined} />
      {signaux.length ? (
        <ul>
          {signaux.map((s, i) => (
            <li key={`${s.type}-${i}`} className="flex gap-3 border-t border-line px-6 py-4">
              <Picto icon={icone(s)} tone={s.niveau} size="sm" />
              <div className="min-w-0">
                <p className="font-semibold text-text">{s.titre}</p>
                <p className="mt-0.5 text-sm text-text-2">{s.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex gap-3 border-t border-line px-6 py-4">
          <Picto icon={TrendingUp} tone="success" size="sm" />
          <p className="text-sm text-text-2">Aucun signal : tous les commerciaux sont au-dessus de 85 % de leur budget et aucune gamme ne recule.</p>
        </div>
      )}
    </Panel>
  );
}

function EntonnoirLeads({ stats }: { stats: StatsLeads }) {
  const p = stats.par_statut;
  const n = (k: keyof typeof p) => p[k] ?? 0;
  const etapes = [
    { label: "Leads reçus", valeur: stats.recus },
    { label: "Acceptés par un professionnel", valeur: n("accepte") + n("contacte") + n("devis") + n("signe") + n("perdu") },
    { label: "Clients contactés", valeur: n("contacte") + n("devis") + n("signe") + n("perdu") },
    { label: "Devis envoyés", valeur: n("devis") + n("signe") },
    { label: "Ventes signées", valeur: n("signe") },
  ];
  const max = Math.max(etapes[0].valeur, 1);
  return (
    <Panel className="mt-8">
      <PanelHeader title="Parcours des leads" description="90 derniers jours, de la réception à la signature" />
      <PanelBody>
        <ol className="flex flex-col gap-3">
          {etapes.map((e, i) => (
            <li key={e.label} className="grid grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] items-center gap-4">
              <span className="text-sm text-text-2">{e.label}</span>
              <span className="h-6 rounded-sm bg-sunken">
                <span
                  className="block h-6 rounded-sm transition-[width] duration-700 ease-out"
                  style={{ width: `${(e.valeur / max) * 100}%`, background: i === etapes.length - 1 ? "var(--success)" : "var(--accent)", opacity: i === etapes.length - 1 ? 1 : 1 - i * 0.15 }}
                />
              </span>
              <span className="tabular w-24 text-right text-sm">
                <span className="font-semibold text-text">{e.valeur}</span>
                {i > 0 ? <span className="text-text-3"> ({Math.round((e.valeur / max) * 100)} %)</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </PanelBody>
    </Panel>
  );
}
