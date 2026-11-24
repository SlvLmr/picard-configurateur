"use client";

import { useState, useTransition } from "react";
import { chargerEntonnoir } from "@/app/(app)/leads/actions";
import { Combobox } from "@/components/ui/combobox";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import type { Entonnoir as DonneesEntonnoir } from "@/lib/data/types";
import { SOURCES_LEAD } from "./statuts";

const ETAPES: { cle: keyof DonneesEntonnoir; label: string; couleur: string }[] = [
  { cle: "recus", label: "Reçus", couleur: "var(--bleu-300)" },
  { cle: "attribues", label: "Attribués", couleur: "var(--bleu-400)" },
  { cle: "acceptes", label: "Acceptés", couleur: "var(--bleu-500)" },
  { cle: "contactes", label: "Contactés", couleur: "var(--bleu-600)" },
  { cle: "devis", label: "Devis envoyés", couleur: "var(--bleu-700)" },
  { cle: "signes", label: "Signés", couleur: "var(--success)" },
];

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/**
 * Entonnoir de conversion : volume à chaque étape, taux de passage depuis l'étape précédente,
 * taux global (signés sur reçus) et leads perdus à part.
 */
export function Entonnoir({ donnees, className }: { donnees: DonneesEntonnoir; className?: string }) {
  const base = Math.max(donnees.recus, 1);
  return (
    <div className={cn("w-full", className)}>
      <ol className="flex flex-col gap-3">
        {ETAPES.map((e, i) => {
          const v = donnees[e.cle];
          const precedent = i > 0 ? donnees[ETAPES[i - 1].cle] : null;
          const largeur = Math.max((v / base) * 100, v ? 4 : 0);
          return (
            <li key={e.cle} className="grid grid-cols-1 gap-1 sm:grid-cols-[128px_minmax(0,1fr)_96px] sm:items-center sm:gap-4">
              <div className="flex items-baseline justify-between gap-2 sm:block">
                <span className="text-sm font-medium text-text">{e.label}</span>
                <span className="tabular text-xs text-text-3 sm:hidden">{precedent !== null ? `${pct(v, precedent)} % de l’étape précédente` : "Point de départ"}</span>
              </div>
              <div className="h-8 w-full rounded-md bg-sunken">
                <div
                  className="flex h-full items-center justify-end rounded-md px-2 transition-[width] duration-700 ease-out"
                  style={{ width: `${largeur}%`, background: e.couleur, minWidth: v ? 40 : 0 }}
                >
                  {v ? <span className="tabular text-sm font-bold text-white">{v}</span> : null}
                </div>
              </div>
              <span className="tabular hidden text-right text-sm text-text-2 sm:block">
                {precedent !== null ? (
                  <>
                    <span className="font-semibold text-text">{pct(v, precedent)} %</span> de passage
                  </>
                ) : (
                  "100 %"
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-text-3">Taux de conversion global</dt>
          <dd className="font-display tabular text-xl font-bold text-text">{pct(donnees.signes, donnees.recus)} %</dd>
        </div>
        <div>
          <dt className="text-xs text-text-3">Acceptés sur attribués</dt>
          <dd className="font-display tabular text-xl font-bold text-text">{pct(donnees.acceptes, donnees.attribues)} %</dd>
        </div>
        <div>
          <dt className="text-xs text-text-3">Perdus</dt>
          <dd className="font-display tabular text-xl font-bold text-danger">{donnees.perdus}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Panneau d'entonnoir avec choix de la période et de la source (recalcul côté serveur). */
export function PanneauEntonnoir({ initial }: { initial: DonneesEntonnoir }) {
  const [jours, setJours] = useState<"7" | "30" | "90">("30");
  const [source, setSource] = useState<string>("toutes");
  const [donnees, setDonnees] = useState(initial);
  const [pending, start] = useTransition();

  const recharger = (j: "7" | "30" | "90", s: string) =>
    start(async () => setDonnees(await chargerEntonnoir(Number(j), s === "toutes" ? null : s)));

  return (
    <Panel>
      <PanelHeader title="Entonnoir de conversion" description="De la réception à la signature" />
      <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
        <Segmented
          size="sm"
          label="Période"
          value={jours}
          onChange={(v) => {
            setJours(v);
            recharger(v, source);
          }}
          options={[
            { value: "7", label: "7 jours" },
            { value: "30", label: "30 jours" },
            { value: "90", label: "90 jours" },
          ]}
        />
        <Combobox
          size="sm"
          label="Source des leads"
          className="w-60"
          value={source}
          onChange={(v) => {
            setSource(v);
            recharger(jours, v);
          }}
          options={[{ value: "toutes", label: "Toutes les sources" }, ...SOURCES_LEAD.map((s) => ({ value: s, label: s }))]}
        />
      </div>
      <div className={cn("px-6 pb-6 transition-opacity", pending && "opacity-60")}>
        <Entonnoir donnees={donnees} />
      </div>
    </Panel>
  );
}
