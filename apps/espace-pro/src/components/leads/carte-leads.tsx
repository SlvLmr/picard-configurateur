"use client";

import { ChevronRight, Locate, Minus, Plus, X } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import { DEPARTEMENTS, HAUTEUR_CARTE, LARGEUR_CARTE, PAYS_VOISINS, type Zone } from "@/lib/carte-zones";
import type { LeadGestion } from "@/lib/data/types";
import { ilYa } from "@/lib/temps";
import { STATUTS_LEAD } from "./statuts";

type Mesure = "recus" | "a_traiter" | "gagnes";
type Periode = "30" | "90" | "365";
type Rendu = "aplats" | "bulles";
type Vue = { x: number; y: number; w: number; h: number };
type Info = { total: number; mesure: number; chauds: number; aTraiter: number; gagnes: number };

const A_TRAITER = ["a_valider", "attribue"];
const GAGNES = ["signe", "pose"];
const TEINTE: Record<Mesure, string> = { recus: "var(--accent)", a_traiter: "var(--cta)", gagnes: "var(--success)" };
const VUE_INITIALE: Vue = { x: 0, y: 0, w: LARGEUR_CARTE, h: HAUTEUR_CARTE };
const RATIO = HAUTEUR_CARTE / LARGEUR_CARTE;
const ZONES: Zone[] = [...DEPARTEMENTS, ...PAYS_VOISINS];
const PAR_CODE = new Map(ZONES.map((z) => [z.code, z]));

const mesurer = (l: LeadGestion, m: Mesure) => (m === "recus" ? true : m === "a_traiter" ? A_TRAITER.includes(l.statut) : GAGNES.includes(l.statut));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const versTexte = (v: Vue) => `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`;

/** Boîte englobante d'un tracé SVG à coordonnées absolues. */
function boite(d: string) {
  const n = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]);
    x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]);
    y1 = Math.max(y1, n[i + 1]);
  }
  return { x0, y0, x1, y1 };
}
const BOITES = new Map(ZONES.map((z) => [z.code, boite(z.d)]));

/**
 * Fond de carte : ne se redessine que si les couleurs ou la sélection changent,
 * jamais pendant un zoom ou un déplacement (la caméra agit directement sur le viewBox).
 */
const FondCarte = memo(function FondCarte({
  remplissages,
  choisi,
  pret,
  onSurvol,
  onClic,
}: {
  remplissages: Map<string, string>;
  choisi: string | null;
  pret: boolean;
  onSurvol: (code: string) => void;
  onClic: (code: string) => void;
}) {
  return (
    <>
      {/* Ombre légère, sans filtre */}
      <g transform="translate(0 5)" fill="#0b2545" opacity={0.1} pointerEvents="none">
        {DEPARTEMENTS.map((d) => (
          <path key={d.code} d={d.d} />
        ))}
      </g>
      {PAYS_VOISINS.map((p) => (
        <path
          key={p.code}
          d={p.d}
          fill={remplissages.get(p.code) ?? "color-mix(in srgb, var(--surface-sunken) 75%, var(--surface))"}
          stroke="var(--surface)"
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
          onPointerEnter={() => onSurvol(p.code)}
          onClick={() => onClic(p.code)}
        />
      ))}
      {DEPARTEMENTS.map((d, i) => (
        <path
          key={d.code}
          d={d.d}
          fill={remplissages.get(d.code) ?? "var(--surface)"}
          stroke="var(--surface)"
          strokeWidth={0.9}
          vectorEffect="non-scaling-stroke"
          className="transition-[fill,opacity] duration-500 ease-out"
          style={{ opacity: pret ? (choisi && choisi !== d.code ? 0.5 : 1) : 0, transitionDelay: pret && !choisi ? `${(i % 24) * 12}ms` : "0ms" }}
          onPointerEnter={() => onSurvol(d.code)}
          onClick={() => onClic(d.code)}
        />
      ))}
    </>
  );
});

function TroisChiffres({ info, grand = false }: { info: Info | null | undefined; grand?: boolean }) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      {(
        [
          ["Reçus", info?.total ?? 0, "var(--accent)"],
          ["À traiter", info?.aTraiter ?? 0, "var(--cta)"],
          ["Gagnés", info?.gagnes ?? 0, "var(--success)"],
        ] as const
      ).map(([l, v, c]) => (
        <div key={l} className={cn("flex flex-col-reverse rounded-md bg-sunken", grand ? "py-3" : "px-1 py-2")}>
          <dt className="text-xs text-text-3">{l}</dt>
          <dd className={cn("font-display tabular font-bold", grand ? "text-xl" : "text-base")} style={{ color: c }}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Carte interactive des leads : France par département, Belgique, Suisse et Luxembourg. */
export function CarteLeads({ leads }: { leads: LeadGestion[] }) {
  const [mesure, setMesure] = useState<Mesure>("recus");
  const [periode, setPeriode] = useState<Periode>("90");
  const [rendu, setRendu] = useState<Rendu>("aplats");
  const [survol, setSurvol] = useState<string | null>(null);
  const [choisi, setChoisi] = useState<string | null>(null);
  /** Vue « posée » : ne change qu'à la fin d'un mouvement (étiquettes, tailles des bulles) */
  const [vue, setVue] = useState<Vue>(VUE_INITIALE);
  const [pret, setPret] = useState(false);
  const [deplacement, setDeplacement] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const cadreRef = useRef<HTMLDivElement>(null);
  const bulleRef = useRef<HTMLDivElement>(null);
  const anim = useRef<number>(0);
  const fin = useRef<ReturnType<typeof setTimeout>>();
  const vueCourante = useRef<Vue>(VUE_INITIALE);
  const glisse = useRef<{ x: number; y: number; vue: Vue; bouge: boolean } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPret(true), 40);
    return () => clearTimeout(t);
  }, []);

  const dansPeriode = useMemo(() => {
    const depuis = Date.now() - Number(periode) * 86400000;
    return leads.filter((l) => new Date(l.recuLe).getTime() >= depuis);
  }, [leads, periode]);

  const parZone = useMemo(() => {
    const m = new Map<string, Info>();
    for (const l of dansPeriode) {
      const z = l.departement;
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

  const remplissages = useMemo(() => {
    const m = new Map<string, string>();
    if (rendu === "bulles") return m;
    parZone.forEach((v, code) => {
      if (!v.mesure) return;
      const part = Math.round(14 + Math.pow(v.mesure / max, 0.7) * 76);
      m.set(code, `color-mix(in srgb, ${TEINTE[mesure]} ${part}%, var(--surface))`);
    });
    return m;
  }, [parZone, max, mesure, rendu]);

  /* ── Caméra : le viewBox est modifié directement, sans rendu React à chaque image ── */
  const poser = useCallback((v: Vue, immediat = false) => {
    vueCourante.current = v;
    svgRef.current?.setAttribute("viewBox", versTexte(v));
    clearTimeout(fin.current);
    if (immediat) setVue(v);
    else fin.current = setTimeout(() => setVue({ ...vueCourante.current }), 120);
  }, []);

  const allerA = useCallback(
    (cible: Vue) => {
      cancelAnimationFrame(anim.current);
      const depart = { ...vueCourante.current };
      const t0 = performance.now();
      const pas = (t: number) => {
        const k = ease(Math.min(1, (t - t0) / 600));
        poser({
          x: depart.x + (cible.x - depart.x) * k,
          y: depart.y + (cible.y - depart.y) * k,
          w: depart.w + (cible.w - depart.w) * k,
          h: depart.h + (cible.h - depart.h) * k,
        });
        if (k < 1) anim.current = requestAnimationFrame(pas);
      };
      anim.current = requestAnimationFrame(pas);
    },
    [poser],
  );

  const zoomer = useCallback(
    (facteur: number, cx?: number, cy?: number) => {
      const v = vueCourante.current;
      const w = Math.min(LARGEUR_CARTE * 1.15, Math.max(70, v.w / facteur));
      const h = w * RATIO;
      const px = cx ?? v.x + v.w / 2;
      const py = cy ?? v.y + v.h / 2;
      allerA({ x: px - ((px - v.x) / v.w) * w, y: py - ((py - v.y) / v.h) * h, w, h });
    },
    [allerA],
  );

  const versCarte = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const v = vueCourante.current;
    return { x: v.x + ((clientX - r.left) / r.width) * v.w, y: v.y + ((clientY - r.top) / r.height) * v.h };
  };

  // Molette : zoom progressif autour du curseur, sans faire défiler la page
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const roue = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(anim.current);
      const r = svg.getBoundingClientRect();
      const v = vueCourante.current;
      const facteur = Math.exp(-e.deltaY * 0.0022);
      const w = Math.min(LARGEUR_CARTE * 1.15, Math.max(70, v.w / facteur));
      const h = w * RATIO;
      const px = v.x + ((e.clientX - r.left) / r.width) * v.w;
      const py = v.y + ((e.clientY - r.top) / r.height) * v.h;
      poser({ x: px - ((px - v.x) / v.w) * w, y: py - ((py - v.y) / v.h) * h, w, h });
    };
    svg.addEventListener("wheel", roue, { passive: false });
    return () => svg.removeEventListener("wheel", roue);
  }, [poser]);

  const recentrer = () => {
    setChoisi(null);
    allerA(VUE_INITIALE);
  };

  const choisiRef = useRef<string | null>(null);
  choisiRef.current = choisi;
  const onClic = useCallback(
    (code: string) => {
      if (glisse.current?.bouge) return;
      if (choisiRef.current === code) {
        setChoisi(null);
        allerA(VUE_INITIALE);
      } else {
        setChoisi(code);
        const b = BOITES.get(code);
        if (!b) return;
        const w = Math.max(b.x1 - b.x0 + 120, (b.y1 - b.y0 + 120) / RATIO, 150);
        const h = w * RATIO;
        allerA({ x: (b.x0 + b.x1) / 2 - w / 2, y: (b.y0 + b.y1) / 2 - h / 2, w, h });
      }
    },
    [allerA],
  );
  const onSurvol = useCallback((code: string) => {
    if (!glisse.current?.bouge) setSurvol(code);
  }, []);

  /** L'infobulle suit le curseur sans rendu React (position modifiée directement). */
  const suivre = (e: React.PointerEvent) => {
    const c = cadreRef.current;
    const b = bulleRef.current;
    if (!c || !b) return;
    const r = c.getBoundingClientRect();
    const x = Math.max(8, Math.min(e.clientX - r.left + 16, r.width - 248));
    b.style.transform = `translate(${x}px, ${e.clientY - r.top + 16}px)`;
  };

  const zoom = LARGEUR_CARTE / vue.w;
  const trait = 1 / zoom;
  const nomZone = (code: string) => PAR_CODE.get(code)?.nom ?? code;
  const classement = Array.from(parZone.entries())
    .filter(([, v]) => v.mesure > 0)
    .sort((a, b) => b[1].mesure - a[1].mesure)
    .slice(0, 10);
  const leadsChoisis = choisi ? dansPeriode.filter((l) => l.departement === choisi).sort((a, b) => b.recuLe.localeCompare(a.recuLe)) : [];
  const totalMesure = dansPeriode.filter((l) => mesurer(l, mesure)).length;
  const zSurvol = survol ? PAR_CODE.get(survol) ?? null : null;
  const zChoisi = choisi ? PAR_CODE.get(choisi) ?? null : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Panel className="overflow-hidden">
        <PanelHeader title="Carte des leads" description={`${totalMesure} lead${totalMesure > 1 ? "s" : ""}, France, Belgique, Suisse et Luxembourg`} />
        <div className="flex flex-wrap gap-3 px-6 pb-4">
          <Segmented size="sm" label="Mesure" value={mesure} onChange={setMesure} options={[{ value: "recus", label: "Reçus" }, { value: "a_traiter", label: "À traiter" }, { value: "gagnes", label: "Gagnés" }]} />
          <Segmented size="sm" label="Période" value={periode} onChange={setPeriode} options={[{ value: "30", label: "30 jours" }, { value: "90", label: "90 jours" }, { value: "365", label: "12 mois" }]} />
          <Segmented size="sm" label="Affichage" value={rendu} onChange={setRendu} options={[{ value: "aplats", label: "Aplats" }, { value: "bulles", label: "Bulles" }]} />
        </div>

        <div ref={cadreRef} className="relative mx-4 mb-3 overflow-hidden rounded-lg border border-line" onMouseLeave={() => setSurvol(null)}>
          <svg
            ref={svgRef}
            viewBox={versTexte(VUE_INITIALE)}
            className={cn("block h-auto w-full touch-none select-none", deplacement ? "cursor-grabbing" : "cursor-grab")}
            style={{ aspectRatio: `${LARGEUR_CARTE} / ${HAUTEUR_CARTE}` }}
            role="img"
            aria-label="Carte interactive des leads par département et par pays"
            onPointerDown={(e) => {
              cancelAnimationFrame(anim.current);
              glisse.current = { x: e.clientX, y: e.clientY, vue: { ...vueCourante.current }, bouge: false };
            }}
            onPointerMove={(e) => {
              suivre(e);
              const g = glisse.current;
              if (!g) return;
              const dx = e.clientX - g.x;
              const dy = e.clientY - g.y;
              if (!g.bouge && Math.hypot(dx, dy) < 5) return;
              if (!g.bouge) {
                g.bouge = true;
                setDeplacement(true);
                setSurvol(null);
              }
              const r = svgRef.current!.getBoundingClientRect();
              poser({ ...g.vue, x: g.vue.x - (dx / r.width) * g.vue.w, y: g.vue.y - (dy / r.height) * g.vue.h });
            }}
            onPointerUp={() => {
              setDeplacement(false);
              setTimeout(() => (glisse.current = null), 0);
            }}
            onPointerLeave={() => {
              setDeplacement(false);
              glisse.current = null;
            }}
            onDoubleClick={(e) => {
              const p = versCarte(e.clientX, e.clientY);
              zoomer(1.8, p.x, p.y);
            }}
          >
            <defs>
              <radialGradient id="carte-mer" cx="45%" cy="40%" r="80%">
                <stop offset="0" stopColor="color-mix(in srgb, var(--accent) 7%, var(--surface))" />
                <stop offset="1" stopColor="color-mix(in srgb, var(--accent) 20%, var(--surface-sunken))" />
              </radialGradient>
              <pattern id="carte-grille" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M30 0H0V30" fill="none" stroke="var(--accent)" strokeOpacity="0.08" strokeWidth="0.6" />
              </pattern>
              <radialGradient id="carte-bulle" cx="35%" cy="30%" r="70%">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x={-700} y={-700} width={LARGEUR_CARTE + 1400} height={HAUTEUR_CARTE + 1400} fill="url(#carte-mer)" />
            <rect x={-700} y={-700} width={LARGEUR_CARTE + 1400} height={HAUTEUR_CARTE + 1400} fill="url(#carte-grille)" />

            <FondCarte remplissages={remplissages} choisi={choisi} pret={pret} onSurvol={onSurvol} onClic={onClic} />

            {/* Contours choisi et survolé */}
            {zChoisi ? (
              <g pointerEvents="none">
                <path d={zChoisi.d} fill="none" stroke="var(--cta)" strokeOpacity={0.3} strokeWidth={9} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                <path d={zChoisi.d} fill="none" stroke="var(--cta)" strokeWidth={2.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </g>
            ) : null}
            {zSurvol && zSurvol.code !== choisi ? (
              <path d={zSurvol.d} fill="var(--text)" fillOpacity={0.07} stroke="var(--text)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" />
            ) : null}

            {/* Bulles et alertes (taille recalculée à la fin du mouvement) */}
            {DEPARTEMENTS.map((d) => {
              const v = parZone.get(d.code);
              if (!v) return null;
              const bulle = rendu === "bulles" && v.mesure > 0;
              const rBulle = (6 + Math.sqrt(v.mesure / max) * 20) / Math.sqrt(zoom);
              const rChaud = (3 + Math.sqrt(v.chauds) * 2.5) * trait * 1.5;
              return (
                <g key={`b-${d.code}`} pointerEvents="none" style={{ opacity: pret ? 1 : 0, transition: "opacity 500ms" }}>
                  {bulle ? (
                    <>
                      <circle cx={d.cx} cy={d.cy + 2 * trait} r={rBulle} fill="#0b2545" opacity={0.18} />
                      <circle cx={d.cx} cy={d.cy} r={rBulle} fill={TEINTE[mesure]} stroke="var(--surface)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                      <circle cx={d.cx} cy={d.cy} r={rBulle} fill="url(#carte-bulle)" />
                      <text x={d.cx} y={d.cy} dy="0.35em" textAnchor="middle" fontSize={Math.max(7 * trait, rBulle * 0.8)} fontWeight={700} fill="#fff">
                        {v.mesure}
                      </text>
                    </>
                  ) : null}
                  {v.chauds ? (
                    <g transform={bulle ? `translate(${rBulle * 0.75} ${-rBulle * 0.75})` : undefined}>
                      <circle cx={d.cx} cy={d.cy} r={rChaud} fill="var(--danger)" opacity={0.3}>
                        <animate attributeName="r" values={`${rChaud};${rChaud * 2.8};${rChaud}`} dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0;0.4" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={d.cx} cy={d.cy} r={rChaud} fill="var(--danger)" stroke="var(--surface)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
                    </g>
                  ) : null}
                </g>
              );
            })}

            {/* Noms des départements, visibles en zoomant */}
            {zoom >= 2
              ? DEPARTEMENTS.filter((d) => d.cx > vue.x && d.cx < vue.x + vue.w && d.cy > vue.y && d.cy < vue.y + vue.h).map((d) => {
                  const m = parZone.get(d.code)?.mesure ?? 0;
                  const decale = rendu === "bulles" && m ? (6 + Math.sqrt(m / max) * 20) / Math.sqrt(zoom) + 9 * trait : 0;
                  return (
                    <text key={`l-${d.code}`} x={d.cx} y={d.cy + decale} dy="0.35em" textAnchor="middle" fontSize={10 * trait} fontWeight={600} fill="var(--text)" stroke="var(--surface)" strokeWidth={3 * trait} paintOrder="stroke" pointerEvents="none">
                      {d.nom}
                    </text>
                  );
                })
              : null}
            {PAYS_VOISINS.map((p) => (
              <text
                key={`t-${p.code}`}
                x={p.code === "LU" ? p.cx + 8 : p.cx}
                y={p.code === "LU" ? p.cy - 10 : p.cy}
                textAnchor={p.code === "LU" ? "start" : "middle"}
                fontSize={11 * Math.max(trait, 0.5)}
                fill="var(--text-3)"
                fontStyle="italic"
                pointerEvents="none"
              >
                {p.code === "LU" ? "Lux." : p.nom}
              </text>
            ))}
          </svg>

          {/* Fil d'Ariane */}
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs shadow-card backdrop-blur">
            <button type="button" onClick={recentrer} className={cn("font-semibold", choisi ? "text-accent hover:underline" : "text-text")}>
              Vue d’ensemble
            </button>
            {choisi ? (
              <>
                <ChevronRight aria-hidden className="size-3 text-text-3" />
                <span className="font-semibold text-text">{nomZone(choisi)}</span>
              </>
            ) : null}
          </div>

          {/* Zoom */}
          <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-card">
            <button type="button" aria-label="Zoomer" onClick={() => zoomer(1.5)} className="flex size-10 items-center justify-center text-text-2 transition-colors hover:bg-sunken hover:text-text">
              <Plus className="size-4" />
            </button>
            <button type="button" aria-label="Dézoomer" onClick={() => zoomer(1 / 1.5)} className="flex size-10 items-center justify-center border-t border-line text-text-2 transition-colors hover:bg-sunken hover:text-text">
              <Minus className="size-4" />
            </button>
            <button type="button" aria-label="Recentrer la carte" onClick={recentrer} className="flex size-10 items-center justify-center border-t border-line text-text-2 transition-colors hover:bg-sunken hover:text-text">
              <Locate className="size-4" />
            </button>
          </div>

          {/* Légende */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-2 rounded-md border border-line bg-surface/90 px-3 py-2 text-xs text-text-2 shadow-card backdrop-blur">
            <span className="flex items-center gap-2">
              <span className="tabular text-text-3">0</span>
              <span aria-hidden className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${TEINTE[mesure]} 14%, var(--surface)), ${TEINTE[mesure]})` }} />
              <span className="tabular text-text-3">{max}</span>
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-full bg-danger" />
              Leads chauds à traiter
            </span>
          </div>

          {/* Infobulle (suit le curseur) */}
          <div
            ref={bulleRef}
            className={cn("pointer-events-none absolute left-0 top-0 z-10 w-60 rounded-lg border border-line bg-surface p-3 shadow-card transition-opacity duration-150", survol && !deplacement ? "opacity-100" : "opacity-0")}
          >
            {survol ? (
              <>
                <p className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-text">{nomZone(survol)}</span>
                  <span className="text-xs text-text-3">{survol}</span>
                </p>
                <TroisChiffres info={parZone.get(survol)} />
                {parZone.get(survol)?.chauds ? <p className="mt-2 text-xs font-semibold text-danger">{parZone.get(survol)!.chauds} chaud(s) en attente</p> : null}
                <p className="mt-2 text-xs text-text-3">Cliquez pour zoomer et voir les leads</p>
              </>
            ) : null}
          </div>
        </div>
        <p className="px-6 pb-5 text-xs text-text-3">Molette ou double-clic pour zoomer, glisser pour se déplacer, clic sur un département pour le détail.</p>
      </Panel>

      <Panel>
        {choisi ? (
          <>
            <PanelHeader
              title={nomZone(choisi)}
              description={`${choisi.length <= 3 ? `Département ${choisi}, ` : ""}${leadsChoisis.length} lead${leadsChoisis.length > 1 ? "s" : ""} sur la période`}
              actions={
                <button type="button" onClick={recentrer} aria-label="Fermer" className="rounded-md p-2 text-text-3 hover:bg-sunken hover:text-text">
                  <X className="size-4" />
                </button>
              }
            />
            <div className="px-6 pb-4">
              <TroisChiffres info={parZone.get(choisi)} grand />
            </div>
            {leadsChoisis.length === 0 ? (
              <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun lead dans cette zone sur la période.</p>
            ) : (
              <ul className="max-h-[520px] overflow-y-auto">
                {leadsChoisis.map((l) => (
                  <li key={l.id} className="group relative flex items-center gap-3 border-t border-line px-6 py-3 transition-colors hover:bg-sunken">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: l.temperature === "chaud" ? "var(--danger)" : l.temperature === "tiede" ? "var(--warning)" : l.temperature === "froid" ? "var(--bleu-400)" : "var(--line-strong)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <Link href={`/leads/${l.id}`} className="block truncate text-sm font-semibold text-text after:absolute after:inset-0">
                        {l.contact}
                      </Link>
                      <p className="truncate text-xs text-text-3" suppressHydrationWarning>
                        {l.projet}, {l.ville ?? l.cp}, {ilYa(l.recuLe)}
                      </p>
                    </div>
                    <Badge variant={STATUTS_LEAD[l.statut].badge}>{STATUTS_LEAD[l.statut].label}</Badge>
                    <ChevronRight aria-hidden className="size-4 text-text-3 transition-transform group-hover:translate-x-0.5" />
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
                <ol className="flex flex-col gap-1">
                  {classement.map(([code, v], i) => (
                    <li key={code}>
                      <button
                        type="button"
                        onClick={() => onClic(code)}
                        onMouseEnter={() => setSurvol(code)}
                        onMouseLeave={() => setSurvol(null)}
                        className="group w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-sunken"
                      >
                        <span className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-text group-hover:text-accent">
                            <span className="tabular mr-2 text-text-3">{i + 1}</span>
                            {nomZone(code)} <span className="text-text-3">{code}</span>
                          </span>
                          <span className="tabular font-semibold text-text">{v.mesure}</span>
                        </span>
                        <span className="mt-1 block h-1 rounded-full bg-sunken group-hover:bg-surface">
                          <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(v.mesure / max) * 100}%`, background: TEINTE[mesure] }} />
                        </span>
                        {v.chauds ? <span className="mt-1 block text-xs text-danger">{v.chauds} chaud{v.chauds > 1 ? "s" : ""} à traiter</span> : null}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-6 text-xs text-text-3">Belgique, Suisse et Luxembourg s’alimenteront dès que les leads de ces pays arriveront avec leur code pays.</p>
            </PanelBody>
          </>
        )}
      </Panel>
    </div>
  );
}
