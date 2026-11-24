"use client";

import { Check, ChevronRight, CircleCheck, Hourglass, Inbox, Lock, Smile, Timer, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { accepterLead, refuserLead } from "@/app/(app)/leads/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Cote } from "@/components/ui/cote";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { LeadPro, LigneReleve } from "@/lib/data/leads";
import type { StatsPro } from "@/lib/data/types";
import { formatDuree } from "@/lib/format";
import { ilYa } from "@/lib/temps";
import { BoutonNouveauLead } from "./formulaire-lead";
import { SourcePicto } from "./source-picto";
import { MOTIFS_REFUS, STATUTS_LEAD } from "./statuts";

type Onglet = "ouverts" | "archives";

const dateCourte = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
const moisLong = (iso: string) => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(iso));

/** Leads d'un installateur (actions) ou du portefeuille d'un commercial (lecture). */
export function LeadsPro({
  leads,
  lectureSeule,
  stats,
  releve,
  peutCreer,
}: {
  leads: LeadPro[];
  lectureSeule: boolean;
  stats: StatsPro | null;
  releve: LigneReleve[];
  peutCreer: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [refus, setRefus] = useState<{ id: string; motif: string } | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("ouverts");

  const aAccepter = leads.filter((l) => l.statut === "attribue");
  const ouverts = leads.filter((l) => ["accepte", "contacte", "rdv", "devis", "signe"].includes(l.statut));
  const archives = leads.filter((l) => l.statut === "pose" || l.statut === "perdu");
  const liste = onglet === "ouverts" ? ouverts : archives;
  const tauxAcceptation = stats && stats.recus ? Math.round((stats.acceptes / stats.recus) * 100) : null;

  const agir = (id: string, f: () => Promise<{ ok: boolean; message: string }>) => {
    setEnCours(id);
    start(async () => {
      const r = await f();
      setEnCours(null);
      setRefus(null);
      toast(r.message);
    });
  };

  return (
    <>
      <PageHeader
        title={lectureSeule ? "Leads de mes clients" : "Mes leads"}
        description={
          lectureSeule
            ? "La réactivité de votre portefeuille. Un lead en attente est un bon sujet d’appel ou de visite."
            : "Acceptez vos leads dans les 24 h, puis faites-les avancer jusqu’à la pose. Votre réactivité compte pour les prochains leads."
        }
        actions={peutCreer ? <BoutonNouveauLead pourInstallateur /> : null}
      />
      <KpiBand
        items={
          lectureSeule
            ? [
                { label: "En attente d’acceptation", value: aAccepter.length, icon: Inbox, tone: aAccepter.length ? "cta" : "neutral" },
                { label: "En cours", value: ouverts.length, icon: Hourglass, tone: "accent" },
                { label: "Posés", value: archives.filter((l) => l.statut === "pose").length, icon: CircleCheck, tone: "success" },
                { label: "Perdus", value: archives.filter((l) => l.statut === "perdu").length, icon: X, tone: "neutral" },
              ]
            : [
                { label: "À accepter", value: aAccepter.length, icon: Inbox, tone: aAccepter.length ? "cta" : "neutral" },
                { label: "Temps de réponse moyen", value: stats?.temps_reponse_min ? formatDuree(stats.temps_reponse_min) : "–", icon: Timer, tone: "accent" },
                { label: "Taux d’acceptation", value: tauxAcceptation ?? "–", unit: tauxAcceptation === null ? undefined : "%", icon: Check, tone: "accent", note: "Sur les 12 derniers mois" },
                { label: "Projets terminés", value: stats?.termines ?? 0, icon: CircleCheck, tone: "success", note: stats?.nps !== null && stats?.nps !== undefined ? `Satisfaction client : ${stats.nps}` : undefined },
              ]
        }
      />

      {/* À accepter */}
      <Panel className="mt-8">
        <PanelHeader title="À accepter" description={aAccepter.length ? "Au-delà du délai, le lead retourne au Lead Manager" : undefined} />
        {aAccepter.length === 0 ? (
          <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun lead en attente. Vous recevez un e-mail et un SMS dès qu’un lead vous est attribué.</p>
        ) : (
          <ul>
            {aAccepter.map((l) => {
              const ecoule = l.attribueLe ? (Date.now() - new Date(l.attribueLe).getTime()) / 60000 : 0;
              const reste = Math.max(0, l.delaiMin - ecoule);
              return (
                <li key={l.id} className={cn("relative border-t border-line px-6 py-5", enCours === l.id && "opacity-60")}>
                  <span aria-hidden className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-danger" />
                  <div className="flex gap-3">
                    <SourcePicto source={l.source} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/leads/${l.id}`} className="text-base font-semibold text-text hover:underline">
                        {l.projet}
                      </Link>
                      <p className="mt-0.5 text-sm text-text-2">
                        {l.ville ?? ""} {l.cp}
                        {lectureSeule && l.compte ? `, attribué à ${l.compte}` : ""}
                      </p>
                      {l.message ? <p className="mt-2 line-clamp-2 text-sm text-text-2">« {l.message} »</p> : null}
                    </div>
                    <Badge>{l.reference}</Badge>
                  </div>
                  {!lectureSeule ? (
                    <p className="mt-3 flex items-center gap-2 text-xs text-text-3">
                      <Lock aria-hidden className="size-4" />
                      Coordonnées du client visibles après acceptation
                    </p>
                  ) : null}
                  <Cote
                    className="mt-4 max-w-xl"
                    label={`Délai d’acceptation du lead ${l.reference}`}
                    value={Math.min(ecoule, l.delaiMin)}
                    max={l.delaiMin}
                    tone={reste < l.delaiMin * 0.3 ? "warning" : "accent"}
                    valueLabel={reste > 0 ? `Encore ${formatDuree(reste)}` : "Délai dépassé"}
                    startLabel="Attribué"
                    endLabel="Retour au Lead Manager"
                  />
                  {!lectureSeule ? (
                    refus?.id === l.id ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Combobox
                          id={`motif-${l.id}`}
                          size="sm"
                          label="Motif du refus"
                          className="w-full sm:w-80"
                          value={refus.motif}
                          onChange={(v) => setRefus({ id: l.id, motif: v })}
                          options={MOTIFS_REFUS.map((m) => ({ value: m, label: m }))}
                        />
                        <Button size="sm" variant="danger" disabled={pending} onClick={() => agir(l.id, () => refuserLead(l.id, refus.motif))}>
                          Confirmer le refus
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRefus(null)}>
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="primary" disabled={pending || reste <= 0} onClick={() => agir(l.id, () => accepterLead(l.id))}>
                          <Check aria-hidden />
                          Accepter
                        </Button>
                        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRefus({ id: l.id, motif: MOTIFS_REFUS[0] })}>
                          <X aria-hidden />
                          Refuser
                        </Button>
                      </div>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* Projets */}
      <Panel className="mt-8">
        <PanelHeader
          title="Projets"
          actions={
            <Segmented
              size="sm"
              label="Projets affichés"
              value={onglet}
              onChange={setOnglet}
              options={[
                { value: "ouverts", label: "En cours", count: ouverts.length },
                { value: "archives", label: "Archivés", count: archives.length },
              ]}
            />
          }
        />
        {liste.length === 0 ? (
          <p className="border-t border-line px-6 py-8 text-sm text-text-2">{onglet === "ouverts" ? "Aucun projet en cours." : "Aucun projet archivé pour l’instant."}</p>
        ) : (
          <ul>
            <li className="hidden grid-cols-[96px_104px_minmax(0,1fr)_minmax(0,1fr)_88px_136px_16px] gap-4 border-t border-line px-6 py-2 text-xs text-text-3 lg:grid">
              <span>Référence</span>
              <span>Date</span>
              <span>Projet</span>
              <span>Client</span>
              <span>Code postal</span>
              <span>Statut</span>
              <span />
            </li>
            {liste.map((l) => (
              <li key={l.id} className="group relative grid gap-1 border-t border-line px-6 py-3 transition-colors hover:bg-sunken lg:grid-cols-[96px_104px_minmax(0,1fr)_minmax(0,1fr)_88px_136px_16px] lg:items-center lg:gap-4">
                <span className="text-sm font-medium text-text">{l.reference}</span>
                <span className="text-sm text-text-2">{dateCourte(l.recuLe)}</span>
                <Link href={`/leads/${l.id}`} className="truncate text-sm font-semibold text-text after:absolute after:inset-0 focus-visible:outline-none">
                  {l.projet}
                </Link>
                <span className="truncate text-sm text-text-2">
                  {l.contact ?? "Client"}
                  {lectureSeule && l.compte ? `, ${l.compte}` : ""}
                </span>
                <span className="text-sm text-text-2">{l.cp}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant={STATUTS_LEAD[l.statut].badge}>{STATUTS_LEAD[l.statut].label}</Badge>
                  {l.creeParPro ? <span className="text-xs text-text-3">Créé par vous</span> : null}
                </span>
                <ChevronRight aria-hidden className="hidden size-4 text-text-3 transition-transform group-hover:translate-x-0.5 lg:block" />
                <span className="text-xs text-text-3 lg:hidden" suppressHydrationWarning>
                  Reçu {ilYa(l.recuLe)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Relevé (gérant uniquement) */}
      {releve.length ? (
        <Panel className="mt-8">
          <PanelHeader title="Relevé des leads" description="Facturé en fin de mois. Un lead est remboursé quand la commande Picard correspondante est validée." />
          <ul>
            {releve.map((r) => (
              <li key={r.mois} className="grid grid-cols-2 gap-2 border-t border-line px-6 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_repeat(4,auto)] sm:gap-8">
                <span className="font-semibold capitalize text-text">{moisLong(r.mois)}</span>
                <span className="text-text-2">{r.leads} lead{r.leads > 1 ? "s" : ""}</span>
                <span className="text-text-2">{r.offerts} offert{r.offerts > 1 ? "s" : ""}</span>
                <span className="text-text-2">{r.rembourses} remboursé{r.rembourses > 1 ? "s" : ""}</span>
                <span className="tabular text-right font-semibold text-text">{r.montant.toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {!lectureSeule && stats?.nps !== null && stats?.nps !== undefined ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-text-3">
          <Smile aria-hidden className="size-4" />
          Vos clients sont interrogés après la pose : leur note de recommandation compte pour l’attribution des leads.
        </p>
      ) : null}
    </>
  );
}
