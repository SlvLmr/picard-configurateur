"use client";

import { Check, CircleCheck, Handshake, Inbox, Phone, Ruler, Send, X } from "lucide-react";
import { useState, useTransition } from "react";
import { accepterLead, changerStatutLead, refuserLead } from "@/app/(app)/leads/actions";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Cote } from "@/components/ui/cote";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { LeadPro } from "@/lib/data/leads";
import { formatDuree } from "@/lib/format";
import { ilYa } from "@/lib/temps";
import { SourcePicto } from "./source-picto";

const ETAPES = [
  { statut: "contacte", label: "Contacté" },
  { statut: "devis", label: "Devis envoyé" },
  { statut: "signe", label: "Signé" },
] as const;

const MOTIFS = ["Hors de ma zone d’intervention", "Planning complet", "Projet hors de mon activité", "Autre"];

const LIBELLE: Record<LeadPro["statut"], string> = {
  a_valider: "À valider",
  attribue: "À accepter",
  accepte: "Accepté",
  contacte: "Contacté",
  devis: "Devis envoyé",
  signe: "Signé",
  perdu: "Perdu",
};

type Vue = "en_cours" | "termines";

/** Leads d'un installateur (actions) ou du portefeuille d'un commercial (lecture). */
export function LeadsPro({ leads, lectureSeule }: { leads: LeadPro[]; lectureSeule: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [refus, setRefus] = useState<{ id: string; motif: string } | null>(null);
  const [vue, setVue] = useState<Vue>("en_cours");

  const aAccepter = leads.filter((l) => l.statut === "attribue");
  const suivis = leads.filter((l) => ["accepte", "contacte", "devis"].includes(l.statut));
  const termines = leads.filter((l) => l.statut === "signe" || l.statut === "perdu");
  const signes = termines.filter((l) => l.statut === "signe").length;
  const transfo = suivis.length + termines.length ? Math.round((signes / (suivis.length + termines.length)) * 100) : 0;

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
            ? "La réactivité de votre portefeuille. Un lead en attente est un bon sujet de visite."
            : "Acceptez vos leads dans les délais pour garder votre priorité, puis renseignez leur avancement : chaque statut rapporte des points."
        }
      />
      <KpiBand
        items={[
          { label: "À accepter", value: aAccepter.length, icon: Inbox, tone: aAccepter.length ? "cta" : "neutral" },
          { label: "En cours de suivi", value: suivis.length, icon: Phone, tone: "accent" },
          { label: "Signés", value: signes, icon: Handshake, tone: "success" },
          { label: "Taux de transformation", value: transfo, unit: "%", icon: CircleCheck, tone: "accent" },
        ]}
      />

      <Panel className="mt-8">
        <PanelHeader title="À accepter" description={aAccepter.length ? "Au-delà du délai, le lead est proposé à un autre professionnel" : undefined} />
        {aAccepter.length === 0 ? (
          <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun lead en attente d’acceptation. Vous serez prévenu dès qu’un nouveau lead vous est attribué.</p>
        ) : (
          <ul>
            {aAccepter.map((l) => {
              const ecoule = l.attribueLe ? (Date.now() - new Date(l.attribueLe).getTime()) / 60000 : 0;
              const reste = Math.max(0, l.delaiMin - ecoule);
              return (
                <li key={l.id} className={cn("border-t border-line px-6 py-5", enCours === l.id && "opacity-60")}>
                  <div className="flex gap-3">
                    <SourcePicto source={l.source} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-text">{l.projet}</p>
                      <p className="mt-0.5 text-sm text-text-2">
                        {l.ville} ({l.departement}){lectureSeule && l.compte ? `, attribué à ${l.compte}` : ""}
                      </p>
                    </div>
                    <Badge>{l.reference}</Badge>
                  </div>
                  {l.configurationMaPorte ? (
                    <p className="mt-3 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent-strong">
                      Le client a déjà configuré sa porte dans Ma Porte : {Object.values(l.configurationMaPorte).join(", ")}.
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
                    endLabel="Réattribution"
                  />
                  {!lectureSeule ? (
                    refus?.id === l.id ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <label htmlFor={`motif-${l.id}`} className="text-sm font-medium text-text">
                          Motif du refus
                        </label>
                        <select
                          id={`motif-${l.id}`}
                          value={refus.motif}
                          onChange={(e) => setRefus({ id: l.id, motif: e.target.value })}
                          className="h-8 cursor-pointer appearance-none rounded-md border border-line-strong bg-surface pl-3 pr-8 text-sm text-text"
                          style={{ backgroundImage: "var(--chevron)", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                        >
                          {MOTIFS.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
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
                        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRefus({ id: l.id, motif: MOTIFS[0] })}>
                          <X aria-hidden />
                          Refuser
                        </Button>
                        <span className="ml-auto text-xs text-text-3">+20 points à l’acceptation</span>
                      </div>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel className="mt-8">
        <PanelHeader
          title="Suivi"
          actions={
            <Segmented
              size="sm"
              label="Leads affichés"
              value={vue}
              onChange={setVue}
              options={[
                { value: "en_cours", label: "En cours", count: suivis.length },
                { value: "termines", label: "Terminés", count: termines.length },
              ]}
            />
          }
        />
        {(vue === "en_cours" ? suivis : termines).length === 0 ? (
          <p className="border-t border-line px-6 py-8 text-sm text-text-2">{vue === "en_cours" ? "Aucun lead en cours de suivi." : "Aucun lead terminé pour l’instant."}</p>
        ) : (
          <ul>
            {(vue === "en_cours" ? suivis : termines).map((l) => {
              const rang = ETAPES.findIndex((e) => e.statut === l.statut);
              return (
                <li key={l.id} className={cn("grid gap-4 border-t border-line px-6 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center", enCours === l.id && "opacity-60")}>
                  <div className="flex min-w-0 gap-3">
                    <SourcePicto source={l.source} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-text">{l.contact}</span>
                        <span className="text-text-3">{l.ville}</span>
                        <Badge variant={l.statut === "signe" ? "success" : l.statut === "perdu" ? "danger" : "accent"}>{LIBELLE[l.statut]}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-text-2">{l.projet}</p>
                      <p className="mt-0.5 text-xs text-text-3" suppressHydrationWarning>
                        {l.reference}, reçu {ilYa(l.recuLe)}
                        {l.telephone ? `, ${l.telephone}` : ""}
                        {lectureSeule && l.compte ? `, ${l.compte}` : ""}
                      </p>
                    </div>
                  </div>
                  {!lectureSeule && vue === "en_cours" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {ETAPES.map((e, i) => (
                        <Button
                          key={e.statut}
                          size="sm"
                          variant={i === rang + 1 ? "primary" : "secondary"}
                          disabled={pending || i <= rang}
                          onClick={() => agir(l.id, () => changerStatutLead(l.id, e.statut))}
                        >
                          {i <= rang ? <Check aria-hidden /> : e.statut === "devis" ? <Send aria-hidden /> : null}
                          {e.label}
                        </Button>
                      ))}
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => agir(l.id, () => changerStatutLead(l.id, "perdu"))}>
                        Perdu
                      </Button>
                      <ButtonLink size="sm" variant="ghost" href={`/configurateur?lead=${l.id}`}>
                        <Ruler aria-hidden />
                        Configurer
                      </ButtonLink>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
