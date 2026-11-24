"use client";

import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { DEPARTEMENTS, HAUTEUR_CARTE, LARGEUR_CARTE, PAYS_VOISINS } from "@/lib/carte-zones";
import type { LeadGestion } from "@/lib/data/types";
import { ilYa } from "@/lib/temps";
import { STATUTS_LEAD } from "./statuts";

type Mesure = "recus" | "a_traiter" | "gagnes";
type Periode = "30" | "90" | "365";

const A_TRAITER = ["a_valider", "attribue"];
const GAGNES = ["signe", "pose"];

const mesurer = (l: LeadGestion, m: Mesure) => (m === "recus" ? true : m === "a_traiter" ? A_TRAITER.includes(l.statut) : GAGNES.includes(l.statut));

/** Code de zone d'un lead : département français, ou pays voisin (BE, CH, LU) si renseigné. */
const zoneDe = (l: LeadGestion) => l.departement ?? null;

/** Carte des leads : France par département, Belgique, Suisse et Luxembourg. */
export function CarteLeads({ leads }: { leads: LeadGestion[] }) {
  const [mesure, setMesure] = useState<Mesure>("recus");
  const [periode, setPeriode] = useState<Periode>("90");
  const [survol, setSurvol] = useState<{ code: string; x: number; y: number } | null>(null);
  const [choisi, setChoisi] = useState<string | null>(null);

  const dansPeriode = useMemo(() => {
    const depuis = Date.now() - Number(periode) * 86400000;
    return leads.filter((l) => new Date(l.recuLe).getTime() >= depuis);
  }, [leads, periode]);

  const parZone = useMemo(() => {
    const m = new Map<string, { total: number; mesure: number; chauds: number; aTraiter: number; gagnes: number }>();
    for (const l of dansPeriode) {
      const z = zoneDe(l);
      if (!z) continue;
      const v = m.get(z) ?? { total: 0, mesure: 0, chauds: 0, aTraiter: 0, gagnes: 0 };
      v.total += 1;
      if (mesurer(l, mesure)) v.mesure += 1;
      if (A_TRAITER.includes(l.statut)) v.aTraiter += 1;
      if (A_TRAITER.includes(l.statut) && l.temperature === "chaud") v.chauds += 1;
      if (GAGNES.includes(l.statut)) v.gagnes += 1;
      m.set(z, v);
    }
    return m;
  }, [dansPeriode, mesure]);

  const max = Math.max(1, ...Array.from(parZone.values()).map((v) => v.mesure));
  const remplissage = (code: string) => {
    const v = parZone.get(code)?.mesure ?? 0;
    if (!v) return "var(--surface)";
    const part = Math.round(18 + (v / max) * 72);
    const teinte = mesure === "gagnes" ? "var(--success)" : mesure === "a_traiter" ? "var(--cta)" : "var(--accent)";
    return `color-mix(in srgb, ${teinte} ${part}%, var(--surface))`;
  };

  const zones = [...DEPARTEMENTS, ...PAYS_VOISINS];
  const nomZone = (code: string) => zones.find((z) => z.code === code)?.nom ?? code;
  const classement = Array.from(parZone.entries())
    .filter(([, v]) => v.mesure > 0)
    .sort((a, b) => b[1].mesure - a[1].mesure)
    .slice(0, 8);
  const leadsChoisis = choisi ? dansPeriode.filter((l) => zoneDe(l) === choisi).sort((a, b) => b.recuLe.localeCompare(a.recuLe)) : [];
  const totalMesure = dansPeriode.filter((l) => mesurer(l, mesure)).length;
  const infoSurvol = survol ? parZone.get(survol.code) : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Panel>
        <PanelHeader title="Carte des leads" description={`${totalMesure} lead${totalMesure > 1 ? "s" : ""}, France, Belgique, Suisse et Luxembourg`} />
        <div className="flex flex-wrap gap-3 px-6 pb-4">
          <Segmented
            size="sm"
            label="Mesure"
            value={mesure}
            onChange={setMesure}
            options={[
              { value: "recus", label: "Reçus" },
              { value: "a_traiter", label: "À traiter" },
              { value: "gagnes", label: "Gagnés" },
            ]}
          />
          <Segmented
            size="sm"
            label="Période"
            value={periode}
            onChange={setPeriode}
            options={[
              { value: "30", label: "30 jours" },
              { value: "90", label: "90 jours" },
              { value: "365", label: "12 mois" },
            ]}
          />
        </div>
        <div className="relative px-4 pb-6" onMouseLeave={() => setSurvol(null)}>
          <svg viewBox={`0 0 ${LARGEUR_CARTE} ${HAUTEUR_CARTE}`} className="mx-auto h-auto w-full max-w-2xl" role="img" aria-label="Carte des leads par département et par pays">
            {PAYS_VOISINS.map((p) => (
              <path
                key={p.code}
                d={p.d}
                fill={parZone.get(p.code)?.mesure ? remplissage(p.code) : "var(--surface-sunken)"}
                stroke="var(--line-strong)"
                strokeWidth={0.8}
                className="cursor-pointer transition-[fill] duration-300 hover:brightness-95"
                onMouseMove={(e) => setSurvol({ code: p.code, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
                onClick={() => setChoisi(p.code)}
              />
            ))}
            {DEPARTEMENTS.map((d) => (
              <path
                key={d.code}
                d={d.d}
                fill={remplissage(d.code)}
                stroke={choisi === d.code ? "var(--cta)" : "var(--line-strong)"}
                strokeWidth={choisi === d.code ? 2.5 : 0.6}
                className="cursor-pointer transition-[fill] duration-300 hover:brightness-95"
                onMouseMove={(e) => setSurvol({ code: d.code, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
                onClick={() => setChoisi(choisi === d.code ? null : d.code)}
              >
                <title>{`${d.nom} (${d.code})`}</title>
              </path>
            ))}
            {/* Bulles des leads chauds à traiter */}
            {DEPARTEMENTS.map((d) => {
              const v = parZone.get(d.code);
              if (!v?.chauds) return null;
              const r = 4 + Math.sqrt(v.chauds) * 4;
              return (
                <g key={`b-${d.code}`} pointerEvents="none">
                  <circle cx={d.cx} cy={d.cy} r={r + 4} fill="var(--danger)" opacity={0.18} className="animate-ping" style={{ transformOrigin: `${d.cx}px ${d.cy}px`, animationDuration: "2.4s" }} />
                  <circle cx={d.cx} cy={d.cy} r={r} fill="var(--danger)" stroke="var(--surface)" strokeWidth={1.5} />
                </g>
              );
            })}
            {PAYS_VOISINS.map((p) => (
              <text
                key={`t-${p.code}`}
                x={p.code === "LU" ? p.cx + 8 : p.cx}
                y={p.code === "LU" ? p.cy - 10 : p.cy}
                textAnchor={p.code === "LU" ? "start" : "middle"}
                fontSize={11}
                fill="var(--text-3)"
                pointerEvents="none"
              >
                {p.code === "LU" ? "Lux." : p.nom}
              </text>
            ))}
          </svg>

          {survol ? (
            <div className="pointer-events-none absolute z-10 min-w-40 rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-card" style={{ left: survol.x + 16, top: survol.y + 8 }}>
              <p className="font-semibold text-text">
                {nomZone(survol.code)} <span className="font-normal text-text-3">{survol.code}</span>
              </p>
              <p className="text-text-2">
                {infoSurvol?.total ?? 0} reçu{(infoSurvol?.total ?? 0) > 1 ? "s" : ""}, {infoSurvol?.aTraiter ?? 0} à traiter, {infoSurvol?.gagnes ?? 0} gagné{(infoSurvol?.gagnes ?? 0) > 1 ? "s" : ""}
              </p>
              {infoSurvol?.chauds ? <p className="font-semibold text-danger">{infoSurvol.chauds} chaud{infoSurvol.chauds > 1 ? "s" : ""} à traiter</p> : null}
            </div>
          ) : null}

          <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-2 px-2 text-xs text-text-2">
            <span className="flex items-center gap-2">
              <span className="text-text-3">0</span>
              <span
                aria-hidden
                className="h-2 w-24 rounded-full"
                style={{ background: `linear-gradient(90deg, var(--surface), ${mesure === "gagnes" ? "var(--success)" : mesure === "a_traiter" ? "var(--cta)" : "var(--accent)"})` }}
              />
              <span className="text-text-3">{max}</span>
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-full bg-danger" />
              Leads chauds à traiter
            </span>
            <span className="text-text-3">Cliquez sur un département pour voir ses leads</span>
          </div>
        </div>
      </Panel>

      <Panel>
        {choisi ? (
          <>
            <PanelHeader
              title={nomZone(choisi)}
              description={`${leadsChoisis.length} lead${leadsChoisis.length > 1 ? "s" : ""} sur la période`}
              actions={
                <button type="button" onClick={() => setChoisi(null)} aria-label="Fermer" className="rounded-md p-2 text-text-3 hover:bg-sunken hover:text-text">
                  <X className="size-4" />
                </button>
              }
            />
            {leadsChoisis.length === 0 ? (
              <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun lead dans cette zone sur la période.</p>
            ) : (
              <ul className="max-h-[560px] overflow-y-auto">
                {leadsChoisis.map((l) => (
                  <li key={l.id} className="group relative flex items-center gap-3 border-t border-line px-6 py-3 transition-colors hover:bg-sunken">
                    <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: l.temperature === "chaud" ? "var(--danger)" : l.temperature === "tiede" ? "var(--warning)" : l.temperature === "froid" ? "var(--bleu-400)" : "var(--line-strong)" }} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/leads/${l.id}`} className="block truncate text-sm font-semibold text-text after:absolute after:inset-0">
                        {l.contact}
                      </Link>
                      <p className="truncate text-xs text-text-3" suppressHydrationWarning>
                        {l.projet}, {l.ville ?? l.cp}, {ilYa(l.recuLe)}
                      </p>
                    </div>
                    <Badge variant={STATUTS_LEAD[l.statut].badge}>{STATUTS_LEAD[l.statut].label}</Badge>
                    <ChevronRight aria-hidden className="size-4 text-text-3" />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <PanelHeader title="Zones les plus actives" description={mesure === "recus" ? "Leads reçus" : mesure === "a_traiter" ? "Leads à traiter" : "Leads gagnés"} />
            <PanelBody>
              {classement.length === 0 ? (
                <p className="text-sm text-text-2">Aucun lead sur la période.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {classement.map(([code, v], i) => (
                    <li key={code}>
                      <button type="button" onClick={() => setChoisi(code)} className="group w-full text-left">
                        <span className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-text group-hover:text-accent">
                            <span className="tabular mr-2 text-text-3">{i + 1}</span>
                            {nomZone(code)} <span className="text-text-3">{code}</span>
                          </span>
                          <span className="tabular font-semibold text-text">{v.mesure}</span>
                        </span>
                        <span className="mt-1 block h-1 rounded-full bg-sunken">
                          <span className="block h-full rounded-full bg-accent" style={{ width: `${(v.mesure / max) * 100}%` }} />
                        </span>
                        {v.chauds ? <span className="mt-1 block text-xs text-danger">{v.chauds} chaud{v.chauds > 1 ? "s" : ""} à traiter</span> : null}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-6 text-xs text-text-3">
                Belgique, Suisse et Luxembourg s’alimenteront dès que les leads de ces pays arriveront avec leur code pays.
              </p>
            </PanelBody>
          </>
        )}
      </Panel>
    </div>
  );
}
