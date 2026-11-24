"use client";

import {
  Award,
  CalendarClock,
  CircleCheck,
  Coins,
  FileText,
  Handshake,
  Hourglass,
  Inbox,
  Megaphone,
  Route,
  ShoppingBag,
  Target,
  Timer,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LeadInbox } from "@/components/leads/lead-inbox";
import { LeadQueue } from "@/components/leads/lead-queue";
import { LeadQueueReel } from "@/components/leads/lead-queue-reel";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Cote } from "@/components/ui/cote";
import { Jauge } from "@/components/ui/jauge";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { formatDate, formatDuree, formatNumber } from "@/lib/format";
import type { LeadReel, StatsLeads } from "@/lib/data/types";
import { ACTIONS_EN_RETARD, MARCHES, OBJECTIF_ATC, SIGNAUX, VISITES_DU_JOUR } from "@/lib/mock/commercial";
import { LEADS, LEADS_CLIENT, PROS_EN_RETARD, STATS_LEADS } from "@/lib/mock/leads";
import { isClient } from "@/lib/roles";
import { useSession } from "@/lib/session";

type Reel = { leads: LeadReel[]; stats: StatsLeads | null; peutAttribuer: boolean; prenom: string | null } | null;

const aujourdhui = () => {
  const s = formatDate(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function AccueilParRole({ reel }: { reel: Reel }) {
  const { persona } = useSession();
  if (persona.role === "repartiteur") return <AccueilRepartiteur reel={reel} />;
  if (persona.role === "atc") return <AccueilCommercial />;
  if (isClient(persona.role)) return <AccueilClient />;
  return <AccueilDirection />;
}

/* ─────────────────────────── Répartition ─────────────────────────── */
function AccueilRepartiteur({ reel }: { reel: Reel }) {
  const s = reel?.stats;
  const aValider = s?.a_valider ?? STATS_LEADS.aValider;
  const sansPro = s?.sans_pro ?? STATS_LEADS.sansProProche;
  return (
    <>
      <PageHeader
        title={aujourdhui()}
        meta={reel ? <Badge variant="success">Données en direct</Badge> : null}
        description={`${aValider} leads attendent votre validation${sansPro ? `, dont ${sansPro} sans professionnel à proximité` : ""}.`}
        actions={
          <ButtonLink href="/leads" variant="primary" size="lg">
            <Inbox aria-hidden />
            Traiter les leads
          </ButtonLink>
        }
      />
      <KpiBand
        items={[
          { label: "À valider", value: aValider, icon: Inbox, tone: "cta", delta: { text: "+9 depuis 8 h", sens: "up", bon: false }, trend: [22, 25, 19, 28, 31, 27, aValider] },
          {
            label: "Délai moyen de prise en charge",
            value: formatDuree(s?.delai_moyen_min ?? STATS_LEADS.delaiMoyenMin),
            icon: Timer,
            delta: { text: "−18 min", sens: "down", bon: true },
            trend: [190, 176, 168, 160, 151, 142, s?.delai_moyen_min ?? 134],
          },
          { label: "Acceptés en moins de 24 h", value: s?.acceptes_24h_pct ?? STATS_LEADS.accepteesSous24h, unit: "%", icon: Hourglass, tone: "success", delta: { text: "+4 pts", sens: "up", bon: true }, trend: [81, 84, 83, 87, 88, 90, 92] },
          { label: "Statuts renseignés par les pros", value: s?.statut_renseigne_pct ?? STATS_LEADS.statutRenseigne, unit: "%", icon: CircleCheck, note: "Objectif 95 %", trend: [70, 74, 79, 80, 84, 86, 88] },
        ]}
      />
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
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
          {reel ? <LeadQueueReel leads={reel.leads} peutAttribuer={reel.peutAttribuer} compact /> : <LeadQueue leads={LEADS.slice(0, 3)} compact />}
        </Panel>
        <Panel className="self-start">
          <PanelHeader title="Professionnels en retard" description="Délai d’acceptation dépassé" />
          <ul>
            {PROS_EN_RETARD.map((p) => (
              <li key={p.nom} className="flex gap-3 border-t border-line px-6 py-4">
                <Picto icon={TriangleAlert} tone="warning" size="sm" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-text">{p.nom}</span>
                    <NiveauBadge type={p.type} />
                  </div>
                  <p className="mt-0.5 text-sm text-text-2">{p.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

/* ─────────────────────────── Client IAP ─────────────────────────── */
function AccueilClient() {
  const { persona } = useSession();
  return (
    <>
      <PageHeader
        title={persona.societe}
        meta={persona.niveau ? <NiveauBadge type={persona.niveau} /> : null}
        description={`${LEADS_CLIENT.length} leads attendent votre réponse. Acceptez-les dans les délais pour garder votre priorité sur votre secteur.`}
        actions={
          <ButtonLink href="/configurateur" variant="primary" size="lg">
            Configurer une porte
          </ButtonLink>
        }
      />
      <KpiBand
        items={[
          { label: "Mes points", value: formatNumber(4820), icon: Coins, tone: "cta", delta: { text: "+350 ce mois", sens: "up", bon: true }, trend: [3600, 3820, 4010, 4150, 4380, 4470, 4820] },
          { label: "Taux de transformation", value: 38, unit: "%", icon: Handshake, tone: "success", note: "Réseau : 31 %", trend: [29, 31, 33, 32, 35, 36, 38] },
          { label: "Leads reçus cette année", value: 64, icon: Inbox, delta: { text: "+22 %", sens: "up", bon: true } },
          { label: "Note de vos clients", value: "4,8", unit: "/ 5", icon: Award, note: "23 avis" },
        ]}
      />
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Leads à accepter" />
          <LeadInbox leads={LEADS_CLIENT} />
        </Panel>
        <div className="flex flex-col gap-8">
          <Panel>
            <PanelHeader title="Prochain palier" description="Coffret outils de pose, à 6 500 points" />
            <PanelBody className="flex justify-center">
              <Jauge value={4820} max={6500} label="Progression vers le prochain palier" valueLabel="4 820 pts" sousTitre="Encore 1 680 points" tone="cta" size={240} />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Pour vous cette semaine" />
            <ul>
              {[
                { icon: FileText, tone: "accent" as const, titre: "Notice de pose Altitude, version 3", detail: "Modifiée hier. Vous aviez la version 2.", href: "/mediatheque" },
                { icon: Megaphone, tone: "cta" as const, titre: "Opération « Mois de la sécurité »", detail: "Supports prêts, campagne co-financée à 50 %.", href: "/marketing" },
                { icon: ShoppingBag, tone: "success" as const, titre: "Veste softshell brodée", detail: "1 900 points. Vous en avez assez.", href: "/boutique" },
              ].map((p) => (
                <li key={p.titre} className="border-t border-line">
                  <Link href={p.href} className="group flex gap-3 px-6 py-4 transition-colors hover:bg-sunken">
                    <Picto icon={p.icon} tone={p.tone} size="sm" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-text group-hover:text-accent">{p.titre}</span>
                      <span className="mt-0.5 block text-sm text-text-2">{p.detail}</span>
                    </span>
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

/* ─────────────────────────── Commercial ─────────────────────────── */
function AccueilCommercial() {
  const o = OBJECTIF_ATC;
  const pct = Math.round((o.realiseKEur / o.objectifKEur) * 100);
  return (
    <>
      <PageHeader
        title={aujourdhui()}
        description={`${VISITES_DU_JOUR.length} visites aujourd’hui et ${ACTIONS_EN_RETARD.length} actions en retard.`}
        actions={
          <ButtonLink href="/crm" variant="primary" size="lg">
            <Route aria-hidden />
            Préparer ma tournée
          </ButtonLink>
        }
      />
      <Panel>
        <PanelHeader title="Objectif annuel" description={`Il reste ${o.semainesRestantes} semaines`} />
        <PanelBody className="grid items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
          <Jauge value={o.realiseKEur} max={o.objectifKEur} target={o.objectifKEur * 0.9} label="Chiffre d’affaires par rapport à l’objectif" valueLabel={`${pct} %`} sousTitre={`${o.realiseKEur} k€ sur ${o.objectifKEur} k€`} size={240} />
          <div className="flex flex-col gap-6">
            <Cote label="Visites du trimestre" value={o.visites} max={o.visitesObjectif} valueLabel={`${o.visites} visites`} startLabel="Visites du trimestre" endLabel={`Objectif ${o.visitesObjectif}`} />
            <Cote label="Nouveaux IAP" value={3} max={4} tone="success" valueLabel="3 nouveaux IAP" startLabel="Recrutement IAP" endLabel="Objectif 4" />
          </div>
        </PanelBody>
      </Panel>
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Ma journée" />
          <ol>
            {VISITES_DU_JOUR.map((v) => (
              <li key={v.compte} className="grid grid-cols-[auto_1fr] gap-4 border-t border-line px-6 py-4">
                <span className="tabular inline-flex h-8 items-center rounded-md bg-sunken px-3 text-sm font-semibold text-text">{v.heure}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-text">{v.compte}</span>
                    <NiveauBadge type={v.type} />
                    <span className="text-sm text-text-3">{v.ville}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-2">{v.objet}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel className="self-start">
          <PanelHeader title="Actions en retard" />
          <ul>
            {ACTIONS_EN_RETARD.map((a) => (
              <li key={a.action} className="flex gap-3 border-t border-line px-6 py-4">
                <Picto icon={CalendarClock} tone="danger" size="sm" />
                <div>
                  <p className="font-semibold text-text">{a.action}</p>
                  <p className="mt-0.5 text-sm text-text-2">
                    {a.compte}, <span className="font-medium text-danger">{a.retardJours} jours de retard</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

/* ─────────────────────────── Direction ─────────────────────────── */
function AccueilDirection() {
  return (
    <>
      <PageHeader title="Semaine 48" description="Activité commerciale et santé du réseau." />
      <KpiBand
        items={[
          { label: "Chiffre d’affaires cumulé", value: "4,82", unit: "M€", icon: Target, tone: "cta", note: "87 % de l’objectif annuel", trend: [3.1, 3.4, 3.7, 4.0, 4.3, 4.6, 4.82] },
          { label: "Leads reçus ce mois", value: 612, icon: Inbox, delta: { text: "+14 %", sens: "up", bon: true }, trend: [480, 510, 530, 560, 540, 590, 612] },
          { label: "Taux de transformation", value: 31, unit: "%", icon: Handshake, tone: "success", delta: { text: "+2 pts", sens: "up", bon: true }, trend: [26, 27, 29, 28, 30, 29, 31] },
          { label: "Portefeuille visité", value: 78, unit: "%", icon: Users, tone: "warning", delta: { text: "−4 pts", sens: "down", bon: false }, trend: [84, 83, 82, 82, 80, 79, 78] },
        ]}
      />
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Objectifs par marché" description="Chiffre d’affaires cumulé" />
          <PanelBody className="grid items-start gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
            <Jauge value={4.82} max={5.55} target={5.0} label="Objectif annuel global" valueLabel="87 %" sousTitre="4,82 M€ sur 5,55 M€" size={220} />
            <div className="flex flex-col gap-5">
              {MARCHES.map((m) => {
                const pct = Math.round((m.realise / m.objectif) * 100);
                return (
                  <Cote
                    key={m.nom}
                    label={`Marché ${m.nom}`}
                    value={Math.min(m.realise, m.objectif)}
                    max={m.objectif}
                    tone={pct >= 100 ? "success" : pct < 80 ? "danger" : "accent"}
                    valueLabel={`${pct} %`}
                    startLabel={<span className="text-sm font-medium text-text">{m.nom}</span>}
                    endLabel={`${m.objectif.toLocaleString("fr-FR")} M€`}
                  />
                );
              })}
            </div>
          </PanelBody>
        </Panel>
        <Panel className="self-start">
          <PanelHeader title="Signaux à surveiller" />
          <ul>
            {SIGNAUX.map((s) => (
              <li key={s.titre} className="flex gap-3 border-t border-line px-6 py-4">
                <Picto icon={TriangleAlert} tone={s.niveau} size="sm" />
                <div>
                  <p className="font-semibold text-text">{s.titre}</p>
                  <p className="mt-0.5 text-sm text-text-2">{s.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
