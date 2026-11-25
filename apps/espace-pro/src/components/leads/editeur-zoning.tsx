"use client";

import { ChevronLeft, MapPinned } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { enregistrerZoning } from "@/app/(app)/lead-management/zoning/actions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { DEPARTEMENTS, HAUTEUR_CARTE, LARGEUR_CARTE, PAYS_VOISINS } from "@/lib/carte-zones";
import { cn } from "@/lib/cn";
import type { Secteur } from "@/lib/data/zoning";

const FORCES = [
  { value: "serruriers", label: "Serruriers" },
  { value: "menuisiers", label: "Menuisiers" },
  { value: "marches", label: "Marchés" },
];
const DOM = [
  { code: "971", nom: "Guadeloupe" },
  { code: "972", nom: "Martinique" },
  { code: "973", nom: "Guyane" },
  { code: "974", nom: "La Réunion" },
  { code: "976", nom: "Mayotte" },
];
/** Une teinte par secteur, dans l'ordre de la liste */
const TEINTES = ["#7c5cff", "#0ea5a0", "#f2643d", "#3b82f6", "#d9468f", "#e3a52f", "#16a34a", "#0891b2", "#9333ea", "#ea580c", "#4f46e5", "#be123c", "#65a30d", "#64748b"];

/**
 * Zoning des secteurs commerciaux : un secteur est choisi, puis chaque clic sur un département
 * le lui attribue (ou le lui retire). Lecture seule pour les autres rôles internes.
 */
export function EditeurZoning({ secteurs, modifiable }: { secteurs: Secteur[]; modifiable: boolean }) {
  const toast = useToast();
  const [force, setForce] = useState("serruriers");
  const [actif, setActif] = useState<string | null>(null);
  const [survol, setSurvol] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const initial = useMemo(
    () => Object.fromEntries(FORCES.map((f) => [f.value, Object.fromEntries(secteurs.filter((s) => s.force === f.value).map((s) => [s.code, s.departements]))])) as Record<string, Record<string, string[]>>,
    [secteurs],
  );
  const [zoning, setZoning] = useState(initial);

  const liste = secteurs.filter((s) => s.force === force);
  const couleur = (code: string) => TEINTES[Math.max(0, liste.findIndex((s) => s.code === code)) % TEINTES.length];
  const secteurDe = (dep: string) => Object.entries(zoning[force] ?? {}).find(([, deps]) => deps.includes(dep))?.[0] ?? null;
  const modifie = JSON.stringify(zoning[force]) !== JSON.stringify(initial[force]);
  const total = Object.values(zoning[force] ?? {}).reduce((n, d) => n + d.length, 0);

  const basculer = (dep: string) => {
    if (!modifiable || !actif) return;
    setZoning((z) => {
      const f = { ...z[force] };
      const deja = f[actif]?.includes(dep);
      // Un département n'appartient qu'à un secteur : on le retire des autres
      for (const k of Object.keys(f)) f[k] = f[k].filter((d) => d !== dep);
      if (!deja) f[actif] = [...(f[actif] ?? []), dep].sort();
      return { ...z, [force]: f };
    });
  };

  const enregistrer = () =>
    start(async () => {
      const res = await enregistrerZoning(force, zoning[force]);
      toast(res.message);
    });

  const zoneSurvol = survol ? [...DEPARTEMENTS, ...PAYS_VOISINS].find((d) => d.code === survol) : null;
  const secteurSurvol = survol ? liste.find((s) => s.code === secteurDe(survol)) : null;

  return (
    <>
      <Link href="/lead-management" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        <ChevronLeft aria-hidden className="size-4" />
        Lead Management
      </Link>
      <PageHeader
        title="Zoning des secteurs"
        description="Départements de chaque secteur commercial, par force de vente. Il sert à orienter les leads vers le bon ATC."
        actions={
          modifiable ? (
            <Button variant="primary" disabled={!modifie || pending} onClick={enregistrer}>
              Enregistrer le zoning
            </Button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Segmented
          label="Force de vente"
          value={force}
          onChange={(v) => {
            setForce(v);
            setActif(null);
          }}
          options={FORCES.map((f) => ({ ...f, count: secteurs.filter((s) => s.force === f.value).length }))}
        />
        <span className="text-sm text-text-3">{total} départements affectés</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Secteurs */}
        <section className="rounded-lg border border-line bg-surface p-4 shadow-card" aria-label="Secteurs">
          <p className="mb-2 px-2 text-sm text-text-3">{modifiable ? "Choisissez un secteur, puis cliquez sur la carte pour lui attribuer des départements." : "Secteurs et départements."}</p>
          <ul className="flex flex-col gap-1">
            {liste.map((s) => {
              const deps = zoning[force]?.[s.code] ?? [];
              const choisi = actif === s.code;
              return (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => setActif(choisi ? null : s.code)}
                    aria-pressed={choisi}
                    className={cn("flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors", choisi ? "bg-sunken ring-2" : "hover:bg-sunken")}
                    style={choisi ? { ["--tw-ring-color" as string]: couleur(s.code) } : undefined}
                  >
                    <span aria-hidden className="mt-1 size-3 shrink-0 rounded-full" style={{ background: couleur(s.code) }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-text">{s.nom}</span>
                        <span className="tabular text-xs text-text-3">{deps.length}</span>
                      </span>
                      <span className="block truncate text-xs text-text-3">{s.commercial ?? "Commercial à affecter"}</span>
                      {deps.length ? <span className="mt-1 block text-xs text-text-2">{deps.join(", ")}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Carte */}
        <section className="relative rounded-lg border border-line bg-surface p-4 shadow-card" aria-label="Carte du zoning">
          <svg viewBox={`0 0 ${LARGEUR_CARTE} ${HAUTEUR_CARTE}`} className="h-auto w-full" role="img" aria-label="Départements colorés par secteur">
            {[...PAYS_VOISINS, ...DEPARTEMENTS].map((d) => {
              const sec = secteurDe(d.code);
              return (
                <path
                  key={d.code}
                  d={d.d}
                  fill={sec ? couleur(sec) : "var(--surface-sunken)"}
                  fillOpacity={sec ? (actif && sec !== actif ? 0.35 : 0.85) : 1}
                  stroke="var(--surface)"
                  strokeWidth={survol === d.code ? 2 : 0.8}
                  vectorEffect="non-scaling-stroke"
                  className={cn("transition-[fill,fill-opacity] duration-200", modifiable && actif && "cursor-pointer")}
                  onMouseEnter={() => setSurvol(d.code)}
                  onMouseLeave={() => setSurvol(null)}
                  onClick={() => basculer(d.code)}
                >
                  <title>{`${d.nom} (${d.code})`}</title>
                </path>
              );
            })}
          </svg>
          {zoneSurvol ? (
            <p className="pointer-events-none absolute left-4 top-4 rounded-md bg-surface/95 px-3 py-2 text-sm shadow-card backdrop-blur">
              <span className="font-semibold text-text">
                {zoneSurvol.nom} ({zoneSurvol.code})
              </span>
              <span className="block text-xs text-text-3">{secteurSurvol ? secteurSurvol.nom : "Sans secteur"}</span>
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <MapPinned aria-hidden className="size-4 text-text-3" />
            <span className="text-xs text-text-3">Outre-mer :</span>
            {DOM.map((d) => {
              const sec = secteurDe(d.code);
              return (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => basculer(d.code)}
                  disabled={!modifiable || !actif}
                  className="inline-flex h-8 items-center gap-2 rounded-full border border-line px-3 text-xs font-medium text-text-2 disabled:cursor-default"
                  style={sec ? { background: `color-mix(in srgb, ${couleur(sec)} 18%, transparent)`, borderColor: couleur(sec) } : undefined}
                >
                  {d.nom}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
