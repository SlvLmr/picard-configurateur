"use client";

import Link from "next/link";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Cote } from "@/components/ui/cote";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatBand } from "@/components/ui/stat-band";
import { LeadInbox } from "@/components/leads/lead-inbox";
import { LeadQueue } from "@/components/leads/lead-queue";
import { cn } from "@/lib/cn";
import { formatDate, formatDuree, formatNumber } from "@/lib/format";
import { ACTIONS_EN_RETARD, MARCHES, OBJECTIF_ATC, POUR_VOUS, SIGNAUX, VISITES_DU_JOUR } from "@/lib/mock/commercial";
import { LEADS, LEADS_CLIENT, PROS_EN_RETARD, STATS_LEADS } from "@/lib/mock/leads";
import { isClient } from "@/lib/roles";
import { useSession } from "@/lib/session";

const aujourdhui = () => {
  const s = formatDate(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function AccueilParRole() {
  const { persona } = useSession();
  if (persona.role === "repartiteur") return <AccueilRepartiteur />;
  if (persona.role === "atc") return <AccueilCommercial />;
  if (isClient(persona.role)) return <AccueilClient />;
  return <AccueilDirection />;
}

function AccueilRepartiteur() {
  const s = STATS_LEADS;
  return (
    <>
      <PageHeader
        title={aujourdhui()}
        description={`${s.aValider} leads attendent votre validation, dont ${s.sansProProche} sans professionnel à proximité.`}
        actions={
          <ButtonLink href="/leads" variant="primary">
            Traiter les leads
          </ButtonLink>
        }
      />
      <StatBand
        items={[
          { label: "À valider", value: s.aValider, note: "9 de plus depuis 8 h", tone: "negative" },
          { label: "Délai moyen de prise en charge", value: formatDuree(s.delaiMoyenMin), note: "18 min de moins qu’en octobre", tone: "positive" },
          { label: "Acceptés en moins de 24 h", value: `${s.accepteesSous24h} %`, note: "4 points de plus", tone: "positive" },
          { label: "Statut renseigné par les pros", value: `${s.statutRenseigne} %`, note: `Objectif ${s.objectifStatutRenseigne} %` },
        ]}
      />
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title="À valider en priorité"
            description="Les plus anciens d’abord"
            actions={
              <Link href="/leads" className="text-sm font-medium text-accent hover:underline">
                Toute la file
              </Link>
            }
          />
          <LeadQueue leads={LEADS.slice(0, 3)} compact />
        </Panel>
        <Panel>
          <PanelHeader title="Professionnels en retard" description="Délai d’acceptation dépassé" />
          <ul>
            {PROS_EN_RETARD.map((p) => (
              <li key={p.nom} className="border-t border-line px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">{p.nom}</span>
                  <NiveauBadge type={p.type} />
                </div>
                <p className="mt-1 text-sm text-text-2">{p.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function AccueilClient() {
  const { persona } = useSession();
  return (
    <>
      <PageHeader
        title={persona.societe}
        meta={persona.niveau ? <NiveauBadge type={persona.niveau} /> : null}
        description={`${LEADS_CLIENT.length} leads attendent votre réponse. Acceptez-les dans les délais pour garder votre priorité sur votre secteur.`}
        actions={
          <ButtonLink href="/configurateur" variant="secondary">
            Configurer une porte
          </ButtonLink>
        }
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Leads à accepter" />
          <LeadInbox leads={LEADS_CLIENT} />
        </Panel>
        <div className="flex flex-col gap-8">
          <Panel>
            <PanelHeader title="Vos points" description="Prochain palier : coffret outils de pose" />
            <PanelBody>
              <p className="tabular text-2xl font-bold text-text">{formatNumber(4820)}</p>
              <Cote
                className="mt-4"
                label="Progression vers le prochain palier"
                value={4820}
                max={6500}
                valueLabel="74 %"
                startLabel="0"
                endLabel="6 500 points"
              />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Pour vous cette semaine" />
            <ul>
              {POUR_VOUS.map((p) => (
                <li key={p.titre} className="border-t border-line px-6 py-4">
                  <Link href={p.href} className="group block">
                    <span className="font-semibold text-text group-hover:text-accent">{p.titre}</span>
                    <span className="mt-1 block text-sm text-text-2">{p.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

function AccueilCommercial() {
  const o = OBJECTIF_ATC;
  return (
    <>
      <PageHeader
        title={aujourdhui()}
        description={`${VISITES_DU_JOUR.length} visites aujourd’hui et ${ACTIONS_EN_RETARD.length} actions en retard.`}
        actions={
          <ButtonLink href="/crm" variant="primary">
            Préparer ma tournée
          </ButtonLink>
        }
      />
      <Panel>
        <PanelHeader title="Objectif annuel" description={`Il reste ${o.semainesRestantes} semaines`} />
        <PanelBody className="grid gap-8 md:grid-cols-2">
          <Cote
            label="Chiffre d’affaires réalisé par rapport à l’objectif"
            value={o.realiseKEur}
            max={o.objectifKEur}
            valueLabel={`${o.realiseKEur} k€`}
            startLabel="Chiffre d’affaires"
            endLabel={`${o.objectifKEur} k€`}
          />
          <Cote
            label="Visites réalisées ce trimestre"
            value={o.visites}
            max={o.visitesObjectif}
            valueLabel={`${o.visites} visites`}
            startLabel="Visites du trimestre"
            endLabel={`${o.visitesObjectif}`}
          />
        </PanelBody>
      </Panel>
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Ma journée" />
          <ol>
            {VISITES_DU_JOUR.map((v) => (
              <li key={v.compte} className="grid grid-cols-[64px_1fr] gap-4 border-t border-line px-6 py-4">
                <span className="tabular pt-0.5 text-sm font-semibold text-text">{v.heure}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-text">{v.compte}</span>
                    <NiveauBadge type={v.type} />
                    <span className="text-sm text-text-3">{v.ville}</span>
                  </div>
                  <p className="mt-1 text-sm text-text-2">{v.objet}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel>
          <PanelHeader title="Actions en retard" />
          <ul>
            {ACTIONS_EN_RETARD.map((a) => (
              <li key={a.action} className="border-t border-line px-6 py-4">
                <p className="font-semibold text-text">{a.action}</p>
                <p className="mt-1 text-sm text-text-2">
                  {a.compte}, <span className="text-danger">en retard de {a.retardJours} jours</span>
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function AccueilDirection() {
  return (
    <>
      <PageHeader title="Semaine 48" description="Activité commerciale et santé du réseau." />
      <StatBand
        items={[
          { label: "Chiffre d’affaires cumulé", value: "4,82 M€", note: "87 % de l’objectif annuel" },
          { label: "Leads reçus ce mois", value: "612", note: "14 % de plus qu’en octobre", tone: "positive" },
          { label: "Taux de transformation", value: "31 %", note: "2 points de plus", tone: "positive" },
          { label: "Portefeuille visité", value: "78 %", note: "4 points de moins", tone: "negative" },
        ]}
      />
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Objectifs par marché" description="Chiffre d’affaires cumulé, en millions d’euros" />
          <PanelBody className="flex flex-col gap-4">
            {MARCHES.map((m) => {
              const pct = Math.round((m.realise / m.objectif) * 100);
              return (
                <div key={m.nom}>
                  <Cote
                    label={`Marché ${m.nom}`}
                    value={Math.min(m.realise, m.objectif)}
                    max={m.objectif}
                    tone={pct >= 100 ? "success" : pct < 80 ? "danger" : "accent"}
                    valueLabel={`${pct} %`}
                    startLabel={<span className="text-sm font-medium text-text">{m.nom}</span>}
                    endLabel={`Objectif ${m.objectif.toLocaleString("fr-FR")} M€`}
                  />
                </div>
              );
            })}
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader title="Signaux à surveiller" />
          <ul>
            {SIGNAUX.map((s) => (
              <li key={s.titre} className="border-t border-line px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", s.niveau === "danger" ? "bg-danger" : "bg-warning")} aria-hidden />
                  <span className="font-semibold text-text">{s.titre}</span>
                  <Badge variant={s.niveau} className="sr-only">
                    {s.niveau === "danger" ? "Critique" : "À surveiller"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-text-2">{s.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
