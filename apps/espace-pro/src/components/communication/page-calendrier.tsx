"use client";

import { CalendarPlus, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TYPES_AGENDA } from "@/components/accueil/calendrier";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import type { ElementAgenda, TypeAgenda } from "@/lib/data/accueil";

/** Les temps forts du réseau (pas les visites ni les échéances individuelles). */
const LIGNES: { type: TypeAgenda; label: string }[] = [
  { type: "salon", label: "Salons" },
  { type: "operation", label: "Opérations" },
  { type: "formation", label: "Formations" },
  { type: "webinaire", label: "Webinaires" },
  { type: "reunion", label: "Réunions" },
];
const TYPES_FRISE = new Set(LIGNES.map((l) => l.type));

type Echelle = "annee" | "trimestre" | "mois";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOUR = 86400000;

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(d);
const finDe = (e: ElementAgenda) => new Date(e.fin ?? e.debut);
const periode = (e: ElementAgenda) => {
  const d = new Date(e.debut);
  const f = finDe(e);
  return f.toDateString() !== d.toDateString() ? `${dateFr(d)} au ${dateFr(f)}` : dateFr(d);
};

/* ───────────────────────────── Roue de l'année ───────────────────────────── */

const C = 320;
const R_MOIS_EXT = 306;
const R_MOIS_INT = 276;
const R_PISTE_EXT = 262;
const LARGEUR_PISTE = 22;
const ECART = 5;

function polaire(r: number, angle: number) {
  const a = ((angle - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
}

/** Secteur d'anneau entre deux angles (degrés, 0 = haut, sens horaire). */
function secteur(rExt: number, rInt: number, a0: number, a1: number) {
  const grand = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polaire(rExt, a0);
  const [x1, y1] = polaire(rExt, a1);
  const [x2, y2] = polaire(rInt, a1);
  const [x3, y3] = polaire(rInt, a0);
  return `M${x0} ${y0}A${rExt} ${rExt} 0 ${grand} 1 ${x1} ${y1}L${x2} ${y2}A${rInt} ${rInt} 0 ${grand} 0 ${x3} ${y3}Z`;
}

function RoueAnnee({
  annee,
  evenements,
  lignes,
  choisi,
  onChoisir,
  onMois,
}: {
  annee: number;
  evenements: ElementAgenda[];
  lignes: typeof LIGNES;
  choisi: ElementAgenda | null;
  onChoisir: (e: ElementAgenda) => void;
  onMois: (m: number) => void;
}) {
  const [survol, setSurvol] = useState<ElementAgenda | null>(null);
  const [moisSurvol, setMoisSurvol] = useState<number | null>(null);
  const [pret, setPret] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPret(true), 60);
    return () => clearTimeout(t);
  }, []);

  const debut = new Date(annee, 0, 1).getTime();
  const total = new Date(annee + 1, 0, 1).getTime() - debut;
  const angle = (d: Date) => Math.max(0, Math.min(360, ((d.getTime() - debut) / total) * 360));
  const maintenant = new Date();
  const angleAuj = maintenant.getFullYear() === annee ? angle(maintenant) : null;
  const focus = survol ?? choisi;
  const prochain = evenements.filter((e) => finDe(e) >= maintenant).sort((a, b) => a.debut.localeCompare(b.debut))[0];

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <svg viewBox="0 0 640 640" className="h-auto w-full" role="img" aria-label={`Roue des événements ${annee}`}>
        <defs>
          <radialGradient id="roue-fond">
            <stop offset="0.55" stopColor="var(--surface)" />
            <stop offset="1" stopColor="color-mix(in srgb, var(--accent) 6%, var(--surface))" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R_MOIS_EXT + 8} fill="url(#roue-fond)" />

        {/* Mois */}
        {MOIS.map((m, i) => {
          const a0 = (i / 12) * 360 + 0.6;
          const a1 = ((i + 1) / 12) * 360 - 0.6;
          const [tx, ty] = polaire((R_MOIS_EXT + R_MOIS_INT) / 2, (a0 + a1) / 2);
          const actif = moisSurvol === i || (angleAuj !== null && maintenant.getMonth() === i);
          return (
            <g key={m} className="cursor-pointer" onMouseEnter={() => setMoisSurvol(i)} onMouseLeave={() => setMoisSurvol(null)} onClick={() => onMois(i)}>
              <path
                d={secteur(R_MOIS_EXT, R_MOIS_INT, a0, a1)}
                fill={actif ? "var(--accent)" : Math.floor(i / 3) % 2 ? "var(--surface-sunken)" : "color-mix(in srgb, var(--accent) 10%, var(--surface))"}
                className="transition-[fill] duration-300"
              />
              <text x={tx} y={ty} dy="0.35em" textAnchor="middle" fontSize={12} fontWeight={600} fill={actif ? "#fff" : "var(--text-2)"} pointerEvents="none">
                {m}
              </text>
            </g>
          );
        })}
        {/* Trimestres */}
        {[0, 1, 2, 3].map((t) => {
          const [x0, y0] = polaire(R_MOIS_EXT + 6, t * 90);
          const [x1, y1] = polaire(70, t * 90);
          const [lx, ly] = polaire(R_MOIS_EXT + 22, t * 90 + 45);
          return (
            <g key={t}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--line-strong)" strokeDasharray="2 4" />
              <text x={lx} y={ly} dy="0.35em" textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text-3)">
                T{t + 1}
              </text>
            </g>
          );
        })}

        {/* Pistes par type */}
        {lignes.map((l, k) => {
          const rExt = R_PISTE_EXT - k * (LARGEUR_PISTE + ECART);
          const rInt = rExt - LARGEUR_PISTE;
          const couleur = TYPES_AGENDA[l.type].couleur;
          const items = evenements.filter((e) => e.type === l.type);
          return (
            <g key={l.type}>
              <circle cx={C} cy={C} r={(rExt + rInt) / 2} fill="none" stroke={couleur} strokeOpacity={0.12} strokeWidth={LARGEUR_PISTE} />
              {items.map((e, i) => {
                const a0 = angle(new Date(e.debut));
                const a1 = Math.max(a0 + 2.2, angle(new Date(finDe(e).getTime() + JOUR)));
                const actif = focus?.id === e.id;
                return (
                  <path
                    key={e.id}
                    d={secteur(rExt + (actif ? 4 : 0), rInt - (actif ? 4 : 0), a0, Math.min(a1, 359.9))}
                    fill={couleur}
                    stroke="var(--surface)"
                    strokeWidth={1.5}
                    className="cursor-pointer transition-[opacity,d] duration-500"
                    style={{ opacity: pret ? (focus && !actif ? 0.45 : 1) : 0, transitionDelay: pret ? "0ms" : `${i * 40 + k * 80}ms` }}
                    onMouseEnter={() => setSurvol(e)}
                    onMouseLeave={() => setSurvol(null)}
                    onClick={() => onChoisir(e)}
                  >
                    <title>{`${e.titre}, ${periode(e)}`}</title>
                  </path>
                );
              })}
            </g>
          );
        })}

        {/* Aiguille du jour */}
        {angleAuj !== null ? (
          <g style={{ transform: `rotate(${pret ? angleAuj : 0}deg)`, transformOrigin: `${C}px ${C}px`, transition: "transform 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)" }} pointerEvents="none">
            <line x1={C} y1={C - 80} x2={C} y2={C - R_MOIS_EXT - 4} stroke="var(--cta)" strokeWidth={3} strokeLinecap="round" />
            <circle cx={C} cy={C - R_MOIS_EXT - 6} r={7} fill="var(--cta)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        ) : null}

        {/* Cœur */}
        <circle cx={C} cy={C} r={84} fill="var(--surface)" stroke="var(--line)" />
      </svg>

      {/* Centre : détail */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[26%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
        {focus ? (
          <>
            <span className="text-xs font-semibold" style={{ color: TYPES_AGENDA[focus.type].couleur }}>{TYPES_AGENDA[focus.type].label}</span>
            <span className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-text">{focus.titre}</span>
            <span className="mt-1 text-xs text-text-3">{periode(focus)}</span>
          </>
        ) : (
          <>
            <span className="font-display text-2xl font-bold text-text sm:text-3xl">{annee}</span>
            <span className="text-xs text-text-3">{evenements.length} temps forts</span>
            {prochain ? <span className="mt-2 line-clamp-2 text-xs text-text-2">Prochain : {prochain.titre}</span> : null}
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Ruban trimestre / mois ───────────────────────────── */

function Ruban({ debut, fin, evenements, choisi, onChoisir }: { debut: Date; fin: Date; evenements: ElementAgenda[]; choisi: ElementAgenda | null; onChoisir: (e: ElementAgenda) => void }) {
  const jours = Math.round((fin.getTime() - debut.getTime()) / JOUR);
  const pasJour = jours > 40 ? 14 : 40;
  const largeur = jours * pasJour;
  const x = (d: Date) => ((d.getTime() - debut.getTime()) / JOUR) * pasJour;
  const maintenant = new Date();
  const AXE = 220;
  const LARGEUR_CARTE = 200;

  // Cartes alternées au-dessus et au-dessous de l'axe, empilées si elles se chevauchent
  const places = useMemo(() => {
    const finsHaut: number[] = [];
    const finsBas: number[] = [];
    return evenements
      .slice()
      .sort((a, b) => a.debut.localeCompare(b.debut))
      .map((e, i) => {
        const cx = Math.max(0, x(new Date(e.debut)));
        const haut = i % 2 === 0;
        const fins = haut ? finsHaut : finsBas;
        let niveau = fins.findIndex((f) => f <= cx);
        if (niveau === -1) {
          niveau = fins.length;
          fins.push(cx + LARGEUR_CARTE + 12);
        } else fins[niveau] = cx + LARGEUR_CARTE + 12;
        return { e, cx, haut, niveau: Math.min(niveau, 1) };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evenements, debut.getTime(), pasJour]);

  return (
    <div className="scroll-nav overflow-x-auto">
      <div className="relative" style={{ width: Math.max(largeur + LARGEUR_CARTE, 640), height: AXE * 2 }}>
        {/* Jours et week-ends */}
        {Array.from({ length: jours }, (_, i) => {
          const d = new Date(debut.getTime() + i * JOUR + JOUR / 2);
          const we = d.getDay() === 0 || d.getDay() === 6;
          const premier = d.getDate() === 1;
          return (
            <div key={i} className="absolute inset-y-0" style={{ left: i * pasJour, width: pasJour }}>
              {we ? <span aria-hidden className="absolute inset-y-0 w-full bg-sunken/70" /> : null}
              {premier ? <span aria-hidden className="absolute inset-y-0 left-0 border-l border-dashed border-line-strong" /> : null}
              {premier || pasJour >= 30 ? (
                <span className={cn("absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs", premier ? "font-semibold capitalize text-text-2" : "tabular text-text-3")} style={{ top: AXE + 14 }}>
                  {premier && pasJour < 30 ? MOIS_LONGS[d.getMonth()] : d.getDate()}
                </span>
              ) : null}
            </div>
          );
        })}
        {/* Axe */}
        <div aria-hidden className="absolute h-1 rounded-full" style={{ top: AXE - 2, left: 0, width: largeur, background: "linear-gradient(90deg, var(--bleu-300), var(--accent), var(--bleu-300))" }} />
        {/* Aujourd'hui */}
        {maintenant >= debut && maintenant < fin ? (
          <div aria-hidden className="absolute inset-y-4" style={{ left: x(maintenant) }}>
            <span className="absolute inset-y-0 w-0.5 bg-cta" />
            <span className="absolute -left-8 top-0 rounded-full bg-cta px-2 text-xs font-bold text-cta-text">Aujourd’hui</span>
          </div>
        ) : null}

        {places.map(({ e, cx, haut, niveau }, i) => {
          const couleur = TYPES_AGENDA[e.type].couleur;
          const xFin = Math.min(largeur, x(new Date(finDe(e).getTime() + JOUR)));
          const decalage = 26 + niveau * 92;
          const actif = choisi?.id === e.id;
          return (
            <div key={e.id}>
              {/* Bande de durée sur l'axe */}
              <span aria-hidden className="absolute h-2 rounded-full" style={{ top: AXE - 4, left: cx, width: Math.max(8, xFin - cx), background: couleur }} />
              {/* Liaison */}
              <span
                aria-hidden
                className="absolute w-px border-l border-dashed"
                style={{ left: cx + 4, borderColor: couleur, top: haut ? AXE - decalage : AXE + 4, height: decalage - 4 }}
              />
              <span aria-hidden className="absolute size-3 rounded-full border-2 border-surface" style={{ left: cx - 1, top: AXE - 6, background: couleur }} />
              {/* Carte */}
              <button
                type="button"
                onClick={() => onChoisir(e)}
                className={cn(
                  "ruban-carte absolute overflow-hidden rounded-lg border bg-surface p-3 text-left shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                  actif ? "border-transparent ring-2" : "border-line",
                )}
                style={{
                  left: cx - 8,
                  width: LARGEUR_CARTE,
                  top: haut ? AXE - decalage - 76 : AXE + decalage,
                  animationDelay: `${i * 50}ms`,
                  ["--tw-ring-color" as string]: couleur,
                }}
              >
                <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: couleur }} />
                <span className="block text-xs font-semibold" style={{ color: couleur }}>{TYPES_AGENDA[e.type].label}</span>
                <span className="block truncate text-sm font-semibold text-text">{e.titre}</span>
                <span className="block truncate text-xs text-text-3">
                  {periode(e)}
                  {e.lieu ? `, ${e.lieu}` : ""}
                </span>
              </button>
            </div>
          );
        })}
        {places.length === 0 ? <p className="absolute left-1/2 top-1/3 -translate-x-1/2 text-sm text-text-3">Aucun événement sur cette période.</p> : null}
      </div>
    </div>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */

/** Calendrier du réseau : roue de l'année, puis ruban du trimestre ou du mois. */
export function PageCalendrier({ elements, admin }: { elements: ElementAgenda[]; admin: boolean }) {
  const maintenant = new Date();
  const [echelle, setEchelle] = useState<Echelle>("annee");
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [mois, setMois] = useState(maintenant.getMonth());
  const [actifs, setActifs] = useState<Set<TypeAgenda>>(() => new Set(LIGNES.map((l) => l.type)));
  const [choisi, setChoisi] = useState<ElementAgenda | null>(null);

  const evenements = useMemo(() => elements.filter((e) => TYPES_FRISE.has(e.type) && actifs.has(e.type)), [elements, actifs]);
  const lignes = LIGNES.filter((l) => actifs.has(l.type));

  const debutT = Math.floor(mois / 3) * 3;
  const fenetre =
    echelle === "annee"
      ? { debut: new Date(annee, 0, 1), fin: new Date(annee + 1, 0, 1) }
      : echelle === "trimestre"
        ? { debut: new Date(annee, debutT, 1), fin: new Date(annee, debutT + 3, 1) }
        : { debut: new Date(annee, mois, 1), fin: new Date(annee, mois + 1, 1) };
  const dansFenetre = evenements.filter((e) => new Date(e.debut) < fenetre.fin && finDe(e) >= fenetre.debut);

  const decaler = (sens: 1 | -1) => {
    if (echelle === "annee") return setAnnee((a) => a + sens);
    const pas = echelle === "trimestre" ? 3 : 1;
    const total = annee * 12 + (echelle === "trimestre" ? debutT : mois) + sens * pas;
    setAnnee(Math.floor(total / 12));
    setMois(((total % 12) + 12) % 12);
  };
  const titre = echelle === "annee" ? String(annee) : echelle === "trimestre" ? `T${debutT / 3 + 1} ${annee}` : `${MOIS_LONGS[mois]} ${annee}`;

  const aVenir = evenements
    .filter((e) => finDe(e) >= maintenant)
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
        <div className="scroll-nav -mx-4 mb-8 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
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
                  setMois(d.getMonth());
                  setEchelle("mois");
                }}
                className="group relative w-64 shrink-0 snap-start overflow-hidden rounded-lg border border-line bg-surface p-4 text-left shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: TYPES_AGENDA[e.type].couleur }} />
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: TYPES_AGENDA[e.type].couleur }}>{TYPES_AGENDA[e.type].label}</span>
                  <span className="tabular font-display text-sm font-bold text-text">{jours <= 0 ? "En cours" : jours === 1 ? "Demain" : `J-${jours}`}</span>
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
            onChange={(v) => {
              if (echelle === "annee" && annee !== maintenant.getFullYear()) setMois(0);
              setEchelle(v);
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
              setMois(maintenant.getMonth());
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
                  className={cn("inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors", on ? "text-white" : "border-line bg-sunken text-text-3")}
                  style={on ? { background: TYPES_AGENDA[l.type].couleur, borderColor: TYPES_AGENDA[l.type].couleur } : undefined}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6">
          {echelle === "annee" ? (
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <RoueAnnee
                key={annee}
                annee={annee}
                evenements={dansFenetre}
                lignes={lignes}
                choisi={choisi}
                onChoisir={setChoisi}
                onMois={(m) => {
                  setMois(m);
                  setEchelle("mois");
                }}
              />
              <div className="flex flex-col gap-4">
                <p className="text-sm text-text-2">De l’extérieur vers le centre :</p>
                <ul className="flex flex-col gap-2">
                  {lignes.map((l) => {
                    const n = dansFenetre.filter((e) => e.type === l.type).length;
                    return (
                      <li key={l.type} className="flex items-center gap-3 rounded-md bg-sunken px-3 py-2">
                        <span aria-hidden className="h-3 w-6 rounded-full" style={{ background: TYPES_AGENDA[l.type].couleur }} />
                        <span className="flex-1 text-sm font-medium text-text">{l.label}</span>
                        <span className="tabular text-sm font-semibold text-text">{n}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-text-3">Survolez un arc pour le détail, cliquez sur un mois pour zoomer. L’aiguille dorée marque aujourd’hui.</p>
              </div>
            </div>
          ) : (
            <Ruban key={`${echelle}-${annee}-${mois}`} debut={fenetre.debut} fin={fenetre.fin} evenements={dansFenetre} choisi={choisi} onChoisir={setChoisi} />
          )}
        </div>
      </section>

      {/* Détail */}
      {choisi ? (
        <aside className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-lg sm:inset-x-auto sm:right-6">
          <span aria-hidden className="block h-1" style={{ background: TYPES_AGENDA[choisi.type].couleur }} />
          <div className="flex items-start gap-3 p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold" style={{ color: TYPES_AGENDA[choisi.type].couleur }}>{TYPES_AGENDA[choisi.type].label}</p>
              <h3 className="mt-1 text-lg font-semibold text-text">{choisi.titre}</h3>
              <p className="mt-1 text-sm text-text-2">{periode(choisi)}</p>
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
