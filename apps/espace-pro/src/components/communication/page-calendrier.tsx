"use client";

import { CalendarPlus, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TYPES_AGENDA } from "@/components/accueil/calendrier";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import type { ElementAgenda, TypeAgenda } from "@/lib/data/accueil";

/** Types montrés sur la frise : les temps forts du réseau (pas les visites ni les échéances individuelles). */
const LIGNES: { type: TypeAgenda; label: string }[] = [
  { type: "salon", label: "Salons" },
  { type: "operation", label: "Opérations" },
  { type: "formation", label: "Formations" },
  { type: "webinaire", label: "Webinaires" },
  { type: "reunion", label: "Réunions" },
];
const TYPES_FRISE = new Set(LIGNES.map((l) => l.type));

type Echelle = "annee" | "trimestre" | "mois";
type Fenetre = { debut: Date; fin: Date };

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOUR = 86400000;

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(d);
const finDe = (e: ElementAgenda) => new Date(e.fin ?? e.debut);

function fenetreDe(echelle: Echelle, annee: number, index: number): Fenetre {
  if (echelle === "annee") return { debut: new Date(annee, 0, 1), fin: new Date(annee + 1, 0, 1) };
  if (echelle === "trimestre") return { debut: new Date(annee, index * 3, 1), fin: new Date(annee, index * 3 + 3, 1) };
  return { debut: new Date(annee, index, 1), fin: new Date(annee, index + 1, 1) };
}

/** Calendrier du réseau en frise : année, trimestre ou mois, avec zoom animé. */
export function PageCalendrier({ elements, admin }: { elements: ElementAgenda[]; admin: boolean }) {
  const maintenant = new Date();
  const [echelle, setEchelle] = useState<Echelle>("annee");
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [index, setIndex] = useState(maintenant.getMonth()); // mois (0-11) ou trimestre (0-3) selon l'échelle
  const [actifs, setActifs] = useState<Set<TypeAgenda>>(() => new Set(LIGNES.map((l) => l.type)));
  const [choisi, setChoisi] = useState<ElementAgenda | null>(null);
  const [survol, setSurvol] = useState<string | null>(null);

  const evenements = useMemo(() => elements.filter((e) => TYPES_FRISE.has(e.type)), [elements]);
  const f = fenetreDe(echelle, annee, echelle === "trimestre" ? Math.floor(index / 3) : index);
  const duree = f.fin.getTime() - f.debut.getTime();
  const pos = (d: Date) => ((d.getTime() - f.debut.getTime()) / duree) * 100;

  /** Graduations selon l'échelle */
  const graduations = useMemo(() => {
    const g: { label: string; debut: Date; fin: Date; clic?: () => void; fort?: boolean }[] = [];
    if (echelle === "mois") {
      for (let d = new Date(f.debut); d < f.fin; d = new Date(d.getTime() + JOUR)) {
        const n = new Date(d.getTime() + JOUR);
        g.push({ label: String(d.getDate()), debut: d, fin: n, fort: d.getDay() === 1 });
      }
    } else {
      const nb = echelle === "annee" ? 12 : 3;
      for (let i = 0; i < nb; i++) {
        const m = f.debut.getMonth() + i;
        const d = new Date(annee, m, 1);
        g.push({ label: echelle === "annee" ? MOIS[d.getMonth()] : MOIS_LONGS[d.getMonth()], debut: d, fin: new Date(annee, m + 1, 1), clic: () => zoomer("mois", d.getMonth()) });
      }
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echelle, annee, f.debut.getTime()]);

  const zoomer = (e: Echelle, i: number) => {
    setEchelle(e);
    setIndex(i);
  };
  const decaler = (sens: 1 | -1) => {
    if (echelle === "annee") return setAnnee((a) => a + sens);
    const pasMois = echelle === "trimestre" ? 3 : 1;
    let m = index + sens * pasMois;
    let a = annee;
    if (m < 0) {
      m += 12;
      a -= 1;
    } else if (m > 11) {
      m -= 12;
      a += 1;
    }
    setAnnee(a);
    setIndex(m);
  };

  const titre =
    echelle === "annee" ? String(annee) : echelle === "trimestre" ? `T${Math.floor(index / 3) + 1} ${annee}` : `${MOIS_LONGS[index]} ${annee}`;

  const aujourdhui = pos(maintenant);
  const aVenir = evenements
    .filter((e) => finDe(e) >= maintenant && actifs.has(e.type))
    .sort((a, b) => a.debut.localeCompare(b.debut))
    .slice(0, 8);

  const basculer = (t: TypeAgenda) =>
    setActifs((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });

  return (
    <>
      <PageHeader
        title="Calendrier"
        description="Les temps forts du réseau sur l’année : salons, opérations, formations, webinaires et réunions."
        actions={admin ? <ButtonLink href="/administration/contenus" variant="primary"><CalendarPlus aria-hidden />Ajouter un événement</ButtonLink> : null}
      />

      {/* À venir */}
      {aVenir.length ? (
        <div className="scroll-nav -mx-4 mb-8 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {aVenir.map((e) => {
            const d = new Date(e.debut);
            const jours = Math.ceil((d.getTime() - maintenant.getTime()) / JOUR);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  setChoisi(e);
                  setAnnee(d.getFullYear());
                  zoomer("mois", d.getMonth());
                }}
                className="group relative w-64 shrink-0 snap-start overflow-hidden rounded-lg border border-line bg-surface p-4 text-left shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: TYPES_AGENDA[e.type].couleur }} />
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: TYPES_AGENDA[e.type].couleur }}>{TYPES_AGENDA[e.type].label}</span>
                  <span className="tabular text-xs font-semibold text-text">{jours <= 0 ? "En cours" : jours === 1 ? "Demain" : `Dans ${jours} jours`}</span>
                </span>
                <span className="mt-1 block truncate font-semibold text-text">{e.titre}</span>
                <span className="mt-1 block text-xs text-text-3">
                  {dateFr(d)}
                  {e.lieu ? `, ${e.lieu}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        {/* Barre d'outils */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Période précédente" onClick={() => decaler(-1)} className="rounded-md p-2 text-text-2 hover:bg-sunken hover:text-text">
              <ChevronLeft className="size-4" />
            </button>
            <h2 className="min-w-40 text-center font-display text-lg font-semibold capitalize text-text">{titre}</h2>
            <button type="button" aria-label="Période suivante" onClick={() => decaler(1)} className="rounded-md p-2 text-text-2 hover:bg-sunken hover:text-text">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <Segmented
            size="sm"
            label="Échelle"
            value={echelle}
            onChange={(e) => {
              // en quittant la vue année, on se place sur le mois en cours (ou janvier d'une autre année)
              if (echelle === "annee") setIndex(annee === maintenant.getFullYear() ? maintenant.getMonth() : 0);
              setEchelle(e);
            }}
            options={[
              { value: "annee", label: "Année" },
              { value: "trimestre", label: "Trimestre" },
              { value: "mois", label: "Mois" },
            ]}
          />
          <button
            type="button"
            onClick={() => {
              setAnnee(maintenant.getFullYear());
              setIndex(maintenant.getMonth());
            }}
            className="text-sm font-medium text-accent hover:underline"
          >
            Aujourd’hui
          </button>
          <div className="flex flex-wrap gap-2 lg:ml-auto" role="group" aria-label="Types affichés">
            {LIGNES.map((l) => {
              const on = actifs.has(l.type);
              return (
                <button
                  key={l.type}
                  type="button"
                  aria-pressed={on}
                  onClick={() => basculer(l.type)}
                  className={cn("inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors", on ? "border-line-strong bg-surface text-text" : "border-line bg-sunken text-text-3 line-through")}
                >
                  <span aria-hidden className="size-2 rounded-full" style={{ background: TYPES_AGENDA[l.type].couleur, opacity: on ? 1 : 0.4 }} />
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trimestres (vue année) */}
        {echelle === "annee" ? (
          <div className="grid grid-cols-[112px_minmax(0,1fr)] border-b border-line">
            <span />
            <div className="grid grid-cols-4">
              {[0, 1, 2, 3].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => zoomer("trimestre", t * 3)}
                  className="border-l border-line py-2 text-xs font-semibold text-text-2 transition-colors first:border-l-0 hover:bg-sunken hover:text-accent"
                >
                  T{t + 1}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <div className={cn("relative", echelle === "mois" ? "min-w-[960px]" : "min-w-[720px]")}>
            {/* Graduations */}
            <div className="grid grid-cols-[112px_minmax(0,1fr)] border-b border-line">
              <span />
              <div className="relative h-10">
                {graduations.map((g) => (
                  <button
                    key={g.debut.toISOString()}
                    type="button"
                    disabled={!g.clic}
                    onClick={g.clic}
                    className={cn(
                      "absolute inset-y-0 flex items-center justify-center border-l border-line text-xs capitalize transition-colors",
                      g.clic ? "font-semibold text-text-2 hover:bg-sunken hover:text-accent" : g.fort ? "font-semibold text-text-2" : "text-text-3",
                      g.debut.toDateString() === maintenant.toDateString() && "text-cta-deep",
                    )}
                    style={{ left: `${pos(g.debut)}%`, width: `${pos(g.fin) - pos(g.debut)}%` }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lignes par type */}
            {LIGNES.filter((l) => actifs.has(l.type)).map((l) => {
              const items = evenements.filter((e) => e.type === l.type && new Date(e.debut) < f.fin && finDe(e) >= f.debut);
              // répartition en sous-lignes pour éviter les chevauchements
              const pistes: number[] = [];
              const places = items
                .sort((a, b) => a.debut.localeCompare(b.debut))
                .map((e) => {
                  const g = Math.max(0, pos(new Date(e.debut)));
                  const dte = Math.min(100, Math.max(pos(new Date(finDe(e).getTime() + JOUR)), g + (echelle === "annee" ? 1.2 : 3)));
                  let piste = pistes.findIndex((fin) => fin <= g);
                  if (piste === -1) {
                    piste = pistes.length;
                    pistes.push(dte);
                  } else pistes[piste] = dte;
                  return { e, g, d: dte, piste };
                });
              const hauteur = Math.max(1, pistes.length) * 36 + 16;
              return (
                <div key={l.type} className="grid grid-cols-[112px_minmax(0,1fr)] border-b border-line last:border-b-0">
                  <div className="flex items-center gap-2 border-r border-line px-4 text-sm font-semibold text-text">
                    <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: TYPES_AGENDA[l.type].couleur }} />
                    {l.label}
                  </div>
                  <div className="relative" style={{ height: hauteur }}>
                    {/* fond : colonnes */}
                    {graduations.map((g, i) => (
                      <span
                        key={g.debut.toISOString()}
                        aria-hidden
                        className={cn("absolute inset-y-0 border-l border-line/60", i % 2 === 1 && "bg-sunken/40", echelle === "mois" && (g.debut.getDay() === 0 || g.debut.getDay() === 6) && "bg-sunken/70")}
                        style={{ left: `${pos(g.debut)}%`, width: `${pos(g.fin) - pos(g.debut)}%` }}
                      />
                    ))}
                    {places.map(({ e, g, d, piste }) => {
                      const actif = choisi?.id === e.id || survol === e.id;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setChoisi(e)}
                          onMouseEnter={() => setSurvol(e.id)}
                          onMouseLeave={() => setSurvol(null)}
                          title={`${e.titre}, ${dateFr(new Date(e.debut))}`}
                          className={cn(
                            "absolute flex h-8 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-xs font-semibold text-white shadow-card transition-[left,width,transform,box-shadow] duration-500 ease-out",
                            actif && "z-10 -translate-y-0.5 shadow-lg ring-2 ring-surface",
                          )}
                          style={{ left: `${g}%`, width: `${d - g}%`, top: 8 + piste * 36, background: TYPES_AGENDA[e.type].couleur }}
                        >
                          <span className="truncate">{e.titre}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Repère aujourd'hui */}
            {aujourdhui >= 0 && aujourdhui <= 100 ? (
              <div className="pointer-events-none absolute inset-y-0 grid w-full grid-cols-[112px_minmax(0,1fr)]">
                <span />
                <div className="relative">
                  <span className="absolute inset-y-0 w-0.5 bg-cta transition-[left] duration-500" style={{ left: `${aujourdhui}%` }}>
                    <span className="absolute -left-2 top-0 size-4 rounded-full border-2 border-surface bg-cta shadow-card" />
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {evenements.length === 0 ? <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun événement programmé pour le moment.</p> : null}
      </section>

      {/* Détail */}
      {choisi ? (
        <aside className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-lg sm:inset-x-auto sm:right-6">
          <span aria-hidden className="block h-1" style={{ background: TYPES_AGENDA[choisi.type].couleur }} />
          <div className="flex items-start gap-3 p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold" style={{ color: TYPES_AGENDA[choisi.type].couleur }}>{TYPES_AGENDA[choisi.type].label}</p>
              <h3 className="mt-1 text-lg font-semibold text-text">{choisi.titre}</h3>
              <p className="mt-1 text-sm text-text-2">
                {dateFr(new Date(choisi.debut))}
                {choisi.fin && choisi.fin.slice(0, 10) !== choisi.debut.slice(0, 10) ? ` au ${dateFr(new Date(choisi.fin))}` : ""}
              </p>
              {choisi.lieu ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-text-2">
                  <MapPin aria-hidden className="size-4 text-text-3" />
                  {choisi.lieu}
                </p>
              ) : null}
              {choisi.description ? <p className="mt-3 text-sm text-text">{choisi.description}</p> : null}
              {choisi.href ? (
                <Link href={choisi.href} className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
                  En savoir plus
                </Link>
              ) : null}
            </div>
            <button type="button" aria-label="Fermer" onClick={() => setChoisi(null)} className="rounded-md p-2 text-text-3 hover:bg-sunken hover:text-text">
              <X className="size-4" />
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
