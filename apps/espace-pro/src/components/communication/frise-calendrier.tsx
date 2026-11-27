"use client";

import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TYPES_AGENDA } from "@/components/accueil/calendrier";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import type { ElementAgenda, TypeAgenda } from "@/lib/data/accueil";
import { ANNEE_DEPART, ANNEES } from "@/lib/periode-calendrier";

/*
 * Frise du réseau
 * Une seule frise continue sur trois ans, un couloir par type d'événement.
 * Le zoom (année, trimestre, mois) s'anime en gardant la date au centre ;
 * la frise se parcourt en glissant, avec les flèches ou par la mini-carte.
 * Toutes les positions sont exprimées en jours et multipliées par la variable
 * CSS --px (pixels par jour) : le zoom ne déclenche aucun rendu React.
 * Couleurs : neutre pour le passé, sombre pour l'à venir, orange pour la sélection et aujourd'hui.
 */

const LIGNES: { type: TypeAgenda; label: string }[] = [
  { type: "salon", label: "Salons et foires" },
  { type: "campagne", label: "Campagnes" },
  { type: "digital", label: "Digital" },
  { type: "ressource", label: "Ressources" },
  { type: "pos", label: "POS IAP et Fen" },
  { type: "reseau", label: "Réseau IAP" },
];
const TYPES_FRISE = new Set(LIGNES.map((l) => l.type));

type Echelle = "annee" | "trimestre" | "mois";
const JOURS_VISIBLES: Record<Echelle, number> = { annee: 365, trimestre: 91, mois: 31 };
/** Place minimale d'une pastille (environ 160 px) exprimée en jours, selon le zoom */
const PLACE_PASTILLE: Record<Echelle, number> = { annee: 60, trimestre: 15, mois: 5 };

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOUR = 86400000;
const HAUT_AXE = 56;
const HAUT_RANG = 48;
const MARGE_COULOIR = 12;

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(d);
const finDe = (e: ElementAgenda) => new Date(e.fin ?? e.debut);
const periode = (e: ElementAgenda) => {
  const d = new Date(e.debut);
  const f = finDe(e);
  return f.toDateString() !== d.toDateString() ? `${dateFr(d)} au ${dateFr(f)}` : dateFr(d);
};
const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
const px = (jours: number) => `calc(var(--px) * ${jours} * 1px)`;
const adoucir = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Place = { e: ElementAgenda; j0: number; duree: number; rang: number; espace: number };

/** Agenda du réseau : une frise animée et interactive, intégrée à l’accueil. */
export function FriseCalendrier({ elements }: { elements: ElementAgenda[] }) {
  const maintenant = useMemo(() => new Date(), []);
  // La frise démarre en janvier 2027 (ou l'année en cours si elle est postérieure) et couvre deux ans
  const origine = useMemo(() => new Date(Math.max(ANNEE_DEPART, maintenant.getFullYear()), 0, 1), [maintenant]);
  const total = useMemo(() => Math.round((utc(new Date(origine.getFullYear() + ANNEES, 0, 1)) - utc(origine)) / JOUR), [origine]);
  const jourDe = useCallback((d: Date) => (utc(d) - utc(origine)) / JOUR, [origine]);
  const jAujourdhui = jourDe(maintenant) + (maintenant.getHours() * 60 + maintenant.getMinutes()) / 1440;

  const [echelle, setEchelle] = useState<Echelle>("trimestre");
  const [actifs, setActifs] = useState<Set<TypeAgenda>>(() => new Set(LIGNES.map((l) => l.type)));
  const [choisi, setChoisi] = useState<ElementAgenda | null>(null);
  const [titre, setTitre] = useState("");
  const [pret, setPret] = useState(false);
  const [position, setPosition] = useState(0);

  const defilant = useRef<HTMLDivElement>(null);
  const contenu = useRef<HTMLDivElement>(null);
  const fenetreCarte = useRef<HTMLDivElement>(null);
  const pxJour = useRef(4);
  const echelleRef = useRef<Echelle>("trimestre");
  const animation = useRef<number | null>(null);

  const evenements = useMemo(() => elements.filter((e) => TYPES_FRISE.has(e.type) && actifs.has(e.type)), [elements, actifs]);

  /* Placement : rangs dans chaque couloir pour éviter les chevauchements */
  const couloirs = useMemo(() => {
    let haut = HAUT_AXE;
    return LIGNES.filter((l) => actifs.has(l.type)).map((l) => {
      const fins: number[] = [];
      const places: Place[] = evenements
        .filter((e) => e.type === l.type)
        .map((e) => ({ e, j0: jourDe(new Date(e.debut)), duree: Math.max(1, jourDe(finDe(e)) - jourDe(new Date(e.debut)) + 1) }))
        .filter((p) => p.j0 + p.duree >= 0 && p.j0 < total)
        .sort((a, b) => a.j0 - b.j0)
        .map((p) => {
          // Une pastille occupe une place minimale avant la suivante sur le même rang
          let rang = fins.findIndex((f) => f <= p.j0);
          if (rang === -1) rang = fins.length;
          fins[rang] = p.j0 + Math.max(p.duree, PLACE_PASTILLE[echelle]);
          return { ...p, rang, espace: total - p.j0 };
        });
      // Place disponible pour le titre : jusqu'au prochain événement du même rang
      places.forEach((p) => {
        const suivant = places.find((q) => q.rang === p.rang && q.j0 > p.j0);
        if (suivant) p.espace = suivant.j0 - p.j0;
      });
      const rangs = Math.max(1, ...places.map((p) => p.rang + 1));
      const c = { ...l, places, haut, hauteur: rangs * HAUT_RANG + MARGE_COULOIR * 2 };
      haut += c.hauteur;
      return c;
    });
  }, [evenements, actifs, jourDe, total, echelle]);
  const hauteurTotale = couloirs.reduce((s, c) => s + c.hauteur, HAUT_AXE);

  /* Synchronise le titre et la fenêtre de la mini-carte avec la position */
  const synchroniser = useCallback(() => {
    const el = defilant.current;
    if (!el) return;
    const largeurTotale = total * pxJour.current;
    const centre = (el.scrollLeft + el.clientWidth / 2) / pxJour.current;
    const d = new Date(origine.getTime() + centre * JOUR);
    setTitre(echelleRef.current === "annee" ? String(d.getFullYear()) : `${MOIS_LONGS[d.getMonth()]} ${d.getFullYear()}`);
    setPosition(Math.round((centre / total) * 100));
    if (fenetreCarte.current) {
      fenetreCarte.current.style.left = `${(el.scrollLeft / largeurTotale) * 100}%`;
      fenetreCarte.current.style.width = `${Math.min(100, (el.clientWidth / largeurTotale) * 100)}%`;
    }
  }, [origine, total]);

  const appliquer = useCallback((valeur: number) => {
    pxJour.current = valeur;
    contenu.current?.style.setProperty("--px", String(valeur));
  }, []);

  /** Zoom animé autour d'un jour (le centre actuel par défaut). */
  const zoomer = useCallback(
    (cible: Echelle, centreJour?: number, anime = true) => {
      const el = defilant.current;
      if (!el) return;
      echelleRef.current = cible;
      setEchelle(cible);
      const depart = pxJour.current;
      const arrivee = el.clientWidth / JOURS_VISIBLES[cible];
      const centre = centreJour ?? (el.scrollLeft + el.clientWidth / 2) / depart;
      if (animation.current) cancelAnimationFrame(animation.current);
      if (!anime || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        appliquer(arrivee);
        el.scrollLeft = centre * arrivee - el.clientWidth / 2;
        synchroniser();
        return;
      }
      const t0 = performance.now();
      const pas = (t: number) => {
        const k = Math.min(1, (t - t0) / 550);
        const v = depart + (arrivee - depart) * adoucir(k);
        appliquer(v);
        el.scrollLeft = centre * v - el.clientWidth / 2;
        synchroniser();
        if (k < 1) animation.current = requestAnimationFrame(pas);
      };
      animation.current = requestAnimationFrame(pas);
    },
    [appliquer, synchroniser],
  );

  const allerA = useCallback((jour: number, position = 0.3) => {
    const el = defilant.current;
    if (el) el.scrollTo({ left: jour * pxJour.current - el.clientWidth * position, behavior: "smooth" });
  }, []);

  /* Installation : trimestre centré sur aujourd'hui, puis suivi des redimensionnements */
  useEffect(() => {
    const el = defilant.current;
    if (!el) return;
    appliquer(el.clientWidth / JOURS_VISIBLES.trimestre);
    el.scrollLeft = Math.max(0, jAujourdhui * pxJour.current - el.clientWidth * 0.3);
    synchroniser();
    setPret(true);
    const obs = new ResizeObserver(() => zoomer(echelleRef.current, undefined, false));
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (animation.current) cancelAnimationFrame(animation.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Glisser pour parcourir */
  const glisse = useRef<{ x: number; gauche: number; bouge: boolean } | null>(null);
  const surPointeurBas = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.pointerType !== "mouse" || (ev.target as HTMLElement).closest("button")) return;
    glisse.current = { x: ev.clientX, gauche: ev.currentTarget.scrollLeft, bouge: false };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };
  const surPointeurDeplace = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (!glisse.current) return;
    const dx = ev.clientX - glisse.current.x;
    if (Math.abs(dx) > 3) glisse.current.bouge = true;
    ev.currentTarget.scrollLeft = glisse.current.gauche - dx;
  };
  const surPointeurHaut = () => {
    glisse.current = null;
  };

  /* Mini-carte : cliquer ou glisser pour se déplacer */
  const carte = useRef<HTMLDivElement>(null);
  const deplacerParCarte = (clientX: number) => {
    const el = defilant.current;
    const c = carte.current?.getBoundingClientRect();
    if (!el || !c) return;
    const part = Math.max(0, Math.min(1, (clientX - c.left) / c.width));
    el.scrollLeft = part * total * pxJour.current - el.clientWidth / 2;
  };

  const decaler = (sens: 1 | -1) => {
    const el = defilant.current;
    if (!el) return;
    const centre = new Date(origine.getTime() + ((el.scrollLeft + el.clientWidth / 2) / pxJour.current) * JOUR);
    const debut =
      echelle === "annee"
        ? new Date(centre.getFullYear() + sens, 0, 1)
        : echelle === "trimestre"
          ? new Date(centre.getFullYear(), Math.floor(centre.getMonth() / 3) * 3 + sens * 3, 1)
          : new Date(centre.getFullYear(), centre.getMonth() + sens, 1);
    allerA(jourDe(debut), 0);
  };


  const basculer = (t: TypeAgenda) =>
    setActifs((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });

  /* Graduations : mois toujours, semaines au trimestre, jours au mois */
  const mois = useMemo(() => {
    const r: { j: number; d: Date }[] = [];
    for (let m = 0; m < 12 * ANNEES; m++) {
      const d = new Date(origine.getFullYear(), m, 1);
      r.push({ j: jourDe(d), d });
    }
    return r;
  }, [origine, jourDe]);
  const jours = useMemo(() => {
    if (echelle === "annee") return [];
    return Array.from({ length: total }, (_, j) => {
      const d = new Date(origine.getFullYear(), origine.getMonth(), origine.getDate() + j);
      return { j, d, we: d.getDay() === 0 || d.getDay() === 6 };
    }).filter((x) => echelle === "mois" || x.d.getDay() === 1);
  }, [echelle, total, origine]);


  return (
    <>
      <div className="overflow-hidden rounded-md border border-line">
        {/* Barre d'outils */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Période précédente" onClick={() => decaler(-1)} className="rounded-md p-2 text-text-2 hover:bg-sunken hover:text-text">
              <ChevronLeft className="size-4" />
            </button>
            <h2 className="min-w-40 text-center font-display text-lg font-semibold capitalize text-text" aria-live="polite">
              {titre}
            </h2>
            <button type="button" aria-label="Période suivante" onClick={() => decaler(1)} className="rounded-md p-2 text-text-2 hover:bg-sunken hover:text-text">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <Segmented
            size="sm"
            label="Zoom"
            value={echelle}
            onChange={(v) => zoomer(v)}
            options={[
              { value: "annee", label: "Année" },
              { value: "trimestre", label: "Trimestre" },
              { value: "mois", label: "Mois" },
            ]}
          />
          <button type="button" onClick={() => allerA(Math.max(0, jAujourdhui))} className="text-sm font-medium text-text-2 underline-offset-4 hover:text-text hover:underline">
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
                  className={cn("inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors", on ? "border-transparent text-text" : "border-line text-text-3 hover:text-text")}
                  style={on ? { background: `color-mix(in srgb, ${TYPES_AGENDA[l.type].couleur} 16%, transparent)` } : undefined}
                >
                  <span aria-hidden className="size-2 rounded-full" style={{ background: on ? TYPES_AGENDA[l.type].couleur : "var(--line-strong)" }} />
                  {l.label}
                  <span className={cn("tabular", on ? "opacity-60" : "")}>{elements.filter((e) => e.type === l.type).length}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Frise */}
        <div className="flex">
          <div className="w-40 shrink-0 border-r border-line bg-surface" style={{ height: hauteurTotale }}>
            <div style={{ height: HAUT_AXE }} className="flex items-end border-b border-line px-4 pb-2">
              <span className="text-xs text-text-3">{evenements.length} temps forts</span>
            </div>
            {couloirs.map((c, k) => (
              <div
                key={c.type}
                className="flex items-center justify-between gap-2 border-b border-line px-4 last:border-b-0"
                style={{ height: c.hauteur, background: k % 2 ? "color-mix(in srgb, var(--text) 2.5%, transparent)" : undefined }}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-text">
                  <span aria-hidden className="h-4 w-1 rounded-full" style={{ background: TYPES_AGENDA[c.type].couleur }} />
                  {c.label}
                </span>
                <span className="tabular flex h-6 min-w-6 items-center justify-center rounded-full bg-sunken px-2 text-xs font-semibold text-text-2">{c.places.length}</span>
              </div>
            ))}
          </div>

          <div
            ref={defilant}
            onScroll={synchroniser}
            onPointerDown={surPointeurBas}
            onPointerMove={surPointeurDeplace}
            onPointerUp={surPointeurHaut}
            onPointerCancel={surPointeurHaut}
            className={cn("scroll-nav min-w-0 flex-1 cursor-grab select-none overflow-x-auto overflow-y-hidden transition-opacity duration-300 active:cursor-grabbing", pret ? "opacity-100" : "opacity-0")}
          >
            <div ref={contenu} className="relative" style={{ width: px(total), height: hauteurTotale, ["--px" as string]: pxJour.current }}>
              {/* Couloirs alternés */}
              {couloirs.map((c, k) => (
                <div
                  key={`fond-${c.type}`}
                  aria-hidden
                  className="absolute inset-x-0 border-b border-line last:border-b-0"
                  style={{ top: c.haut, height: c.hauteur, background: k % 2 ? "color-mix(in srgb, var(--text) 2.5%, transparent)" : undefined }}
                />
              ))}

              {/* Jours (zoom mois) ou semaines (zoom trimestre) */}
              {jours.map(({ j, d, we }) => (
                <div key={j} className="absolute inset-y-0" style={{ left: px(j), width: px(echelle === "mois" ? 1 : 7) }}>
                  {we ? <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ top: HAUT_AXE, background: "color-mix(in srgb, var(--text) 3%, transparent)" }} /> : null}
                  <span aria-hidden className="absolute bottom-0 left-0 border-l border-dashed" style={{ top: HAUT_AXE, borderColor: "var(--line)" }} />
                  <span className={cn("tabular absolute left-2 whitespace-nowrap text-xs", we ? "text-text-3/70" : "text-text-3")} style={{ top: 30 }}>
                    {echelle === "mois" ? `${"dlmmjvs"[d.getDay()]} ${d.getDate()}` : d.getDate()}
                  </span>
                </div>
              ))}

              {/* Mois et années */}
              {mois.map(({ j, d }) => {
                const courant = d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear();
                return (
                  <div key={j} className="absolute inset-y-0" style={{ left: px(j) }}>
                    <span aria-hidden className="absolute bottom-0 left-0 border-l" style={{ top: d.getMonth() === 0 ? 0 : 8, borderColor: d.getMonth() === 0 ? "var(--line-strong)" : "var(--line)" }} />
                    <span className={cn("absolute left-2 top-2 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", courant ? "bg-text text-surface" : "text-text-2")}>
                      {echelle === "annee" ? MOIS[d.getMonth()] : MOIS_LONGS[d.getMonth()]}
                      {d.getMonth() === 0 || echelle !== "annee" ? <span className={cn("ml-1 font-normal", courant ? "opacity-70" : "text-text-3")}>{d.getFullYear()}</span> : null}
                    </span>
                  </div>
                );
              })}
              <div aria-hidden className="absolute inset-x-0 border-b border-line" style={{ top: HAUT_AXE - 1 }} />

              {/* Événements : une bande pour la durée, une pastille flottante pour le titre */}
              {couloirs.map((c) => (
                <div key={c.type} className="absolute inset-x-0" style={{ top: c.haut, height: c.hauteur }}>
                  {c.places.map((p, i) => {
                    const fin = finDe(p.e);
                    const passe = fin < maintenant;
                    const enCours = !passe && new Date(p.e.debut) <= maintenant;
                    const actif = choisi?.id === p.e.id;
                    const haut = MARGE_COULOIR + p.rang * HAUT_RANG;
                    const teinte = TYPES_AGENDA[p.e.type].couleur;
                    return (
                      <div
                        key={p.e.id}
                        className="frise-evenement absolute"
                        style={{ left: px(p.j0), top: haut, width: `max(40px, ${px(p.duree)})`, animationDelay: `${Math.min(i, 12) * 35}ms` }}
                      >
                        {/* La bande de durée n'apparaît que pour les événements de plusieurs jours */}
                        <span
                          aria-hidden
                          className="absolute left-0 top-0 h-10 origin-left rounded-full transition-colors"
                          style={{ width: p.duree >= 3 ? "100%" : 0, background: `color-mix(in srgb, ${teinte} ${actif ? 30 : passe ? 8 : 16}%, transparent)` }}
                        />
                        {/* La pastille reste accrochée au bord gauche tant que l'événement est à l'écran */}
                        <button
                          type="button"
                          onClick={() => setChoisi(actif ? null : p.e)}
                          title={`${p.e.titre}, ${periode(p.e)}`}
                          className={cn(
                            "sticky left-2 top-1 mt-1 ml-1 flex h-8 w-max items-center gap-2 overflow-hidden whitespace-nowrap rounded-full border bg-surface pl-2 pr-3 text-left shadow-card transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                            passe && !actif && "opacity-70",
                          )}
                          style={{ maxWidth: `max(32px, calc(var(--px) * ${p.espace} * 1px - 12px))`, borderColor: actif ? teinte : `color-mix(in srgb, ${teinte} 35%, var(--line))` }}
                        >
                          <span aria-hidden className="relative flex size-4 shrink-0 items-center justify-center">
                            {enCours ? <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: teinte }} /> : null}
                            <span className="relative size-2 rounded-full" style={{ background: teinte }} />
                          </span>
                          <span className={cn("truncate text-sm font-semibold", passe && !actif ? "text-text-3" : "text-text")}>{p.e.titre}</span>
                          {echelle !== "annee" ? <span className="shrink-0 text-xs text-text-3">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(p.e.debut))}</span> : null}
                        </button>
                      </div>
                    );
                  })}
                  {!c.places.length ? <span className="sr-only">Aucun événement</span> : null}
                </div>
              ))}

              {/* Aujourd'hui */}
              {jAujourdhui >= 0 && jAujourdhui < total ? (
                <div aria-hidden className="pointer-events-none absolute inset-y-0 z-10" style={{ left: px(jAujourdhui) }}>
                  <span className="frise-aujourdhui absolute bottom-0 w-0.5 -translate-x-1/2 rounded-full" style={{ top: HAUT_AXE - 4, background: "linear-gradient(180deg, var(--cta), color-mix(in srgb, var(--cta) 15%, transparent))" }} />
                  <span className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-cta px-2 py-0.5 text-xs font-semibold text-cta-text shadow-cta" style={{ top: HAUT_AXE - 14 }}>
                    Aujourd’hui
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mini-carte des années couvertes */}
        <div className="border-t border-line bg-sunken/50 px-6 py-4">
          <div
            ref={carte}
            className="relative h-12 cursor-pointer touch-none overflow-hidden rounded-md border border-line bg-surface"
            onPointerDown={(ev) => {
              ev.currentTarget.setPointerCapture(ev.pointerId);
              deplacerParCarte(ev.clientX);
            }}
            onPointerMove={(ev) => {
              if (ev.buttons === 1) deplacerParCarte(ev.clientX);
            }}
            role="slider"
            aria-label="Position dans la frise"
            aria-valuetext={titre}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={position}
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "ArrowLeft") decaler(-1);
              if (ev.key === "ArrowRight") decaler(1);
            }}
          >
            {Array.from({ length: ANNEES - 1 }, (_, k) => k + 1).map((a) => (
              <span key={a} aria-hidden className="absolute inset-y-0 border-l border-line" style={{ left: `${(a / ANNEES) * 100}%` }} />
            ))}
            {Array.from({ length: ANNEES }, (_, k) => k).map((a) => (
              <span key={a} aria-hidden className="absolute bottom-1 text-xs font-semibold text-text-3" style={{ left: `calc(${(a / ANNEES) * 100}% + 8px)` }}>
                {origine.getFullYear() + a}
              </span>
            ))}
            {couloirs.flatMap((c, k) =>
              c.places.map((p) => (
                <span
                  key={p.e.id}
                  aria-hidden
                  className="absolute h-1 rounded-full"
                  style={{
                    left: `${(p.j0 / total) * 100}%`,
                    width: `max(3px, ${(p.duree / total) * 100}%)`,
                    top: 6 + k * 5,
                    background: TYPES_AGENDA[p.e.type].couleur,
                    opacity: finDe(p.e) < maintenant && choisi?.id !== p.e.id ? 0.45 : 1,
                  }}
                />
              )),
            )}
            {jAujourdhui >= 0 && jAujourdhui < total ? <span aria-hidden className="absolute inset-y-0 w-0.5 bg-cta" style={{ left: `${(jAujourdhui / total) * 100}%` }} /> : null}
            <div ref={fenetreCarte} aria-hidden className="pointer-events-none absolute inset-y-0 rounded-md border-2 border-text" style={{ background: "color-mix(in srgb, var(--text) 6%, transparent)" }} />
          </div>
          <p className="mt-2 text-xs text-text-3">Glissez la frise ou la fenêtre pour vous déplacer. Cliquez sur un événement pour le détail.</p>
        </div>
      </div>

      {/* Détail */}
      {choisi ? (
        <aside className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-lg rounded-lg border border-line bg-surface shadow-lg sm:inset-x-auto sm:right-6">
          <div className="flex items-start gap-3 p-6">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-xs font-semibold" style={{ color: TYPES_AGENDA[choisi.type].couleur }}>
                <span aria-hidden className="size-2 rounded-full" style={{ background: TYPES_AGENDA[choisi.type].couleur }} />
                {TYPES_AGENDA[choisi.type].label}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-text">{choisi.titre}</h3>
              <p className="mt-1 text-sm text-text-2">{periode(choisi)}</p>
              {choisi.lieu ? (
                <p className="mt-1 flex items-center gap-1 text-sm text-text-2">
                  <MapPin aria-hidden className="size-4 text-text-3" />
                  {choisi.lieu}
                </p>
              ) : null}
              {choisi.description ? <p className="mt-3 text-sm text-text">{choisi.description}</p> : null}
              {choisi.href ? (
                <Link href={choisi.href} className="mt-3 inline-block text-sm font-semibold text-text underline underline-offset-4">
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
