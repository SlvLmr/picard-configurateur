"use client";

import { ChevronLeft, ChevronRight, Globe, MousePointerClick, PencilLine, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { enregistrerMois } from "@/app/(app)/digital/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { KpiBand, type KpiItem } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Sparkline } from "@/components/ui/sparkline";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Mesures } from "@/lib/data/digital";
import { CANAUX, calcules, type Canal, type Indicateur } from "@/lib/digital";

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const moisFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${iso}T12:00:00`));
const decaler = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + n, 1);
  return d.toISOString().slice(0, 10).replace(/-\d\d$/, "-01");
};
const valeurFr = (v: number | null | undefined, unite?: Indicateur["unite"]) =>
  v === null || v === undefined ? "–" : unite === "€" ? `${nf.format(v)} €` : unite === "%" ? `${nf.format(v)} %` : unite === "s" ? `${nf.format(v)} s` : nf.format(v);
const ICONES: Record<Canal, typeof Globe> = { ads: MousePointerClick, site: Globe, seo: Search, geo: Sparkles };

function variation(actuel: number | undefined, precedent: number | undefined, hausseBonne = true): KpiItem["delta"] | undefined {
  if (actuel === undefined || precedent === undefined || precedent === 0) return undefined;
  const pct = ((actuel - precedent) / Math.abs(precedent)) * 100;
  const sens = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
  return { text: `${pct > 0 ? "+" : ""}${nf.format(pct)} %`, sens, bon: sens === "flat" ? true : (pct > 0) === hausseBonne };
}

/** Pilotage du marketing digital : Google Ads, site, référencement naturel et moteurs d'IA, mois par mois. */
export function PilotageDigital({ mesures, modifiable }: { mesures: Mesures; modifiable: boolean }) {
  const moisAvecDonnees = Object.keys(mesures).sort();
  const moisCourant = new Date().toISOString().slice(0, 7) + "-01";
  const [mois, setMois] = useState(moisAvecDonnees.at(-1) ?? decaler(moisCourant, -1));
  const [saisie, setSaisie] = useState(false);
  const precedent = decaler(mois, -1);
  const m = (c: Canal) => mesures[mois]?.[c] ?? {};
  const p = (c: Canal) => mesures[precedent]?.[c] ?? {};
  const serie = (c: Canal, i: string) =>
    Array.from({ length: 12 }, (_, k) => mesures[decaler(mois, k - 11)]?.[c]?.[i]).filter((v): v is number => v !== undefined);
  const vide = !mesures[mois];

  const kpis: KpiItem[] = [
    { label: "Conversions Google Ads", value: valeurFr(m("ads").conversions), icon: MousePointerClick, tone: "cta", delta: variation(m("ads").conversions, p("ads").conversions), note: (() => { const c = calcules(m("ads")).cpa; return c === null ? undefined : `${nf.format(c)} € par conversion`; })(), trend: serie("ads", "conversions") },
    { label: "Visites du site", value: valeurFr(m("site").visites), icon: Globe, tone: "accent", delta: variation(m("site").visites, p("site").visites), trend: serie("site", "visites") },
    { label: "Clics organiques", value: valeurFr(m("seo").clics), icon: Search, tone: "success", delta: variation(m("seo").clics, p("seo").clics), trend: serie("seo", "clics") },
    { label: "Part de voix IA", value: valeurFr(m("geo").part_voix, "%"), icon: Sparkles, tone: "neutral", delta: variation(m("geo").part_voix, p("geo").part_voix), trend: serie("geo", "part_voix") },
  ];

  return (
    <>
      <PageHeader
        title="Métriques & Analytics"
        description="Google Ads, fréquentation du site, référencement naturel et visibilité dans les moteurs d’IA, mois par mois."
        actions={
          modifiable ? (
            <Button variant="primary" onClick={() => setSaisie(true)}>
              <PencilLine aria-hidden />
              Saisir les chiffres du mois
            </Button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Mois précédent" onClick={() => setMois(decaler(mois, -1))} className="rounded-md p-2 text-text-2 hover:bg-sunken hover:text-text">
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="min-w-40 text-center font-display text-lg font-semibold capitalize text-text">{moisFr(mois)}</h2>
          <button type="button" aria-label="Mois suivant" disabled={mois >= moisCourant} onClick={() => setMois(decaler(mois, 1))} className="rounded-md p-2 text-text-2 hover:bg-sunken hover:text-text disabled:opacity-40">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <span className="text-sm text-text-3">Comparé à {moisFr(precedent)}</span>
      </div>

      {vide ? (
        <p className="mb-6 rounded-md border border-dashed border-line-strong px-4 py-3 text-sm text-text-2">
          Aucun chiffre pour {moisFr(mois)}.{modifiable ? " Utilisez « Saisir les chiffres du mois » pour les renseigner." : ""}
        </p>
      ) : null}

      <KpiBand items={kpis} className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-2">
        {CANAUX.map((c) => {
          const Icone = ICONES[c.id];
          const calc = c.id === "ads" ? calcules(m("ads")) : null;
          return (
            <Panel key={c.id}>
              <PanelHeader
                title={
                  <span className="flex items-center gap-2">
                    <Icone aria-hidden className="size-4 text-accent" />
                    {c.label}
                  </span>
                }
                description={c.description}
                actions={<span className="rounded-full bg-sunken px-2 py-0.5 text-xs text-text-3">Source : {c.source}</span>}
              />
              <PanelBody>
                <ul className="divide-y divide-line">
                  {c.indicateurs.map((i) => {
                    const v = m(c.id)[i.cle];
                    const d = variation(v, p(c.id)[i.cle], i.hausseBonne ?? true);
                    return (
                      <li key={i.cle} className="flex items-center gap-4 py-3">
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-text">{i.label}</span>
                          <span className="block truncate text-xs text-text-3">{i.aide}</span>
                        </span>
                        <Sparkline values={serie(c.id, i.cle)} tone={d ? (d.bon ? "success" : "danger") : "accent"} />
                        <span className="w-24 text-right">
                          <span className="block font-display tabular text-base font-bold text-text">{valeurFr(v, i.unite)}</span>
                          {d ? <span className={cn("block text-xs font-semibold", d.bon ? "text-success" : "text-danger")}>{d.text}</span> : null}
                        </span>
                      </li>
                    );
                  })}
                  {calc ? (
                    <li className="grid grid-cols-2 gap-4 py-3 text-sm">
                      <span>
                        <span className="block text-xs text-text-3">Taux de clic</span>
                        <span className="font-display tabular font-bold text-text">{calc.ctr === null ? "–" : `${nf.format(calc.ctr)} %`}</span>
                      </span>
                      <span>
                        <span className="block text-xs text-text-3">Coût par conversion</span>
                        <span className="font-display tabular font-bold text-text">{calc.cpa === null ? "–" : `${nf.format(calc.cpa)} €`}</span>
                      </span>
                    </li>
                  ) : null}
                </ul>
              </PanelBody>
            </Panel>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-text-3">Les chiffres sont saisis chaque mois en attendant la connexion directe à Google Ads, Google Analytics et Search Console.</p>

      {saisie ? <Saisie mois={mois} mesures={mesures} onFermer={() => setSaisie(false)} /> : null}
    </>
  );
}

/** Saisie mensuelle des indicateurs (administrateur). */
function Saisie({ mois: depart, mesures, onFermer }: { mois: string; mesures: Mesures; onFermer: () => void }) {
  const toast = useToast();
  const [mois, setMois] = useState(depart);
  const initial = useMemo(
    () => Object.fromEntries(CANAUX.map((c) => [c.id, Object.fromEntries(c.indicateurs.map((i) => [i.cle, mesures[mois]?.[c.id]?.[i.cle]?.toString() ?? ""]))])) as Record<Canal, Record<string, string>>,
    [mois, mesures],
  );
  const [valeurs, setValeurs] = useState(initial);
  const [pending, start] = useTransition();

  const enregistrer = () =>
    start(async () => {
      const charge = Object.fromEntries(
        CANAUX.map((c) => [c.id, Object.fromEntries(c.indicateurs.map((i) => {
          const brut = valeurs[c.id][i.cle].replace(/\s/g, "").replace(",", ".");
          return [i.cle, brut === "" || Number.isNaN(Number(brut)) ? null : Number(brut)];
        }))]),
      );
      const r = await enregistrerMois(mois, charge);
      toast(r.message);
      if (r.ok) onFermer();
    });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a33]/40 p-4" onMouseDown={onFermer}>
      <div role="dialog" aria-modal="true" aria-label="Saisir les chiffres du mois" onMouseDown={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-surface shadow-2xl">
        <header className="flex items-center gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-text">Chiffres du mois</h2>
            <p className="mt-0.5 text-sm text-text-3">Laissez vide un indicateur non suivi.</p>
          </div>
          <input
            type="month"
            aria-label="Mois"
            value={mois.slice(0, 7)}
            onChange={(e) => {
              const m = `${e.target.value}-01`;
              setMois(m);
              setValeurs(Object.fromEntries(CANAUX.map((c) => [c.id, Object.fromEntries(c.indicateurs.map((i) => [i.cle, mesures[m]?.[c.id]?.[i.cle]?.toString() ?? ""]))])) as Record<Canal, Record<string, string>>);
            }}
            className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm text-text"
          />
          <Button variant="ghost" size="sm" iconOnly aria-label="Fermer" onClick={onFermer}>
            <X />
          </Button>
        </header>
        <div className="grid gap-6 overflow-y-auto px-6 py-6 sm:grid-cols-2">
          {CANAUX.map((c) => (
            <fieldset key={c.id} className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-semibold text-text">{c.label}</legend>
              {c.indicateurs.map((i) => (
                <Field key={i.cle} label={`${i.label}${i.unite && i.unite !== "rang" ? ` (${i.unite})` : ""}`} htmlFor={`d-${c.id}-${i.cle}`}>
                  <Input
                    id={`d-${c.id}-${i.cle}`}
                    inputMode="decimal"
                    value={valeurs[c.id][i.cle]}
                    onChange={(e) => setValeurs((v) => ({ ...v, [c.id]: { ...v[c.id], [i.cle]: e.target.value } }))}
                  />
                </Field>
              ))}
            </fieldset>
          ))}
        </div>
        <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <Button variant="ghost" onClick={onFermer}>
            Annuler
          </Button>
          <Button variant="primary" disabled={pending} onClick={enregistrer}>
            Enregistrer
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
