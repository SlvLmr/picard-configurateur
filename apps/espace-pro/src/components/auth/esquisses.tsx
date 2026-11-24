"use client";

import { Fragment, useEffect, useRef, useState } from "react";

/**
 * Esquisses animées de la page de connexion : chaque scène se dessine au crayon,
 * reste un instant, puis laisse place à la suivante. Elles racontent ce que propose l'Espace Pro.
 * Respecte « réduire les animations » : la première scène s'affiche alors fixe.
 */
/** Une planche par module : position sur le grand plan et titre. */
const SCENES = [
  { module: "Configurateur", titre: "Chaque porte sur mesure", x: 0, y: 0 },
  { module: "Leads", titre: "Les leads au bon installateur", x: 560, y: -80 },
  { module: "Médiathèque", titre: "Brochures et notices en un clic", x: 1100, y: 60 },
  { module: "Ventes", titre: "Développez vos ventes", x: 260, y: 420 },
  { module: "Calendrier", titre: "Salons, formations et visites", x: 860, y: 460 },
] as const;

const DUREE = 3800;
const DESSINS = [Porte, Lead, Brochure, Pilotage, Calendrier];

/** Centre d'une planche sur le grand plan */
const centre = (k: number) => [SCENES[k].x + 200, SCENES[k].y + 150] as const;

export function Esquisses() {
  const [i, setI] = useState(0);
  const [prec, setPrec] = useState(0);
  const [reduit, setReduit] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [taille, setTaille] = useState({ l: 1000, h: 700 });
  const zone = useRef<HTMLDivElement>(null);

  // Le plan suit la taille réelle du panneau : la planche active en occupe l'essentiel.
  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const o = new ResizeObserver(([e]) => setTaille({ l: Math.max(1, e.contentRect.width), h: Math.max(1, e.contentRect.height) }));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduit(m.matches);
    if (m.matches) return;
    const t = setInterval(() => {
      setI((x) => {
        setPrec(x);
        return (x + 1) % SCENES.length;
      });
    }, DUREE);
    return () => clearInterval(t);
  }, [cycle]);

  const aller = (k: number) => {
    setPrec(i);
    setI(k);
    setCycle((c) => c + 1);
  };

  const scene = SCENES[i];
  const [cx, cy] = centre(i);
  const [px, py] = centre(prec);
  const echelle = Math.min((taille.l * 0.66) / 400, (taille.h * 0.86) / 330);
  const camera = `translate(${taille.l / 2 - echelle * cx}px, ${taille.h / 2 - echelle * cy}px) scale(${echelle})`;
  const trajet = `M${px} ${py}C${px + (cx - px) * 0.2} ${py - 160} ${cx - (cx - px) * 0.2} ${cy - 160} ${cx} ${cy}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Grand plan : toutes les planches, la caméra se déplace de l'une à l'autre */}
      <div ref={zone} className="plan-fondu relative min-h-0 flex-1">
      <svg viewBox={`0 0 ${taille.l} ${taille.h}`} className="esquisse absolute inset-0 size-full" role="img" aria-label={scene.titre}>
        <defs>
          <filter id="crayon" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="3" result="bruit" />
            <feDisplacementMap in="SourceGraphic" in2="bruit" scale="1.6" />
          </filter>
          <pattern id="quadrillage" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="0.8" />
          </pattern>
          <pattern id="quadrillage-fort" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M100 0H0V100" fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1" />
          </pattern>
        </defs>
        <g className="camera" style={{ transform: camera, transition: reduit ? "none" : undefined }}>
          <rect x="-2000" y="-2000" width="5600" height="4800" fill="url(#quadrillage)" />
          <rect x="-2000" y="-2000" width="5600" height="4800" fill="url(#quadrillage-fort)" />
          {/* Liaisons entre les modules */}
          {SCENES.slice(0, -1).map((_, k) => {
            const [ax, ay] = centre(k);
            const [bx, by] = centre(k + 1);
            return <path key={k} d={`M${ax} ${ay}Q${(ax + bx) / 2} ${Math.min(ay, by) - 140} ${bx} ${by}`} className="liaison" fill="none" stroke="#ebbc4e" strokeOpacity="0.18" strokeWidth="1.2" strokeDasharray="4 8" />;
          })}
          {SCENES.map((s, k) => {
            const Dessin = DESSINS[k];
            const actif = k === i;
            return (
              <g key={actif ? `actif-${i}-${cycle}` : k} transform={`translate(${s.x} ${s.y})`} className={actif ? "planche-active" : "fige"} filter="url(#crayon)">
                <Cartouche numero={k + 1} nom={s.module} actif={actif} />
                <Dessin />
              </g>
            );
          })}
          {/* Comète laiton qui file d'une planche à la suivante */}
          {!reduit && prec !== i ? (
            <g key={`comete-${i}-${cycle}`}>
              <path d={trajet} className="sillage" fill="none" stroke="#ebbc4e" strokeWidth="2" strokeLinecap="round" pathLength={1} />
              <circle r="5" fill="#ffd36b" className="comete">
                <animateMotion dur="0.85s" fill="freeze" path={trajet} keyTimes="0;1" keySplines="0.7 0 0.2 1" calcMode="spline" />
              </circle>
            </g>
          ) : null}
        </g>
      </svg>
      </div>

      {/* Balayage lumineux à chaque changement */}
      {!reduit ? <span key={`balayage-${i}-${cycle}`} className="balayage" /> : null}

      {/* Repères d'angle façon planche technique */}
      <span className="repere left-6 top-6 border-l border-t" />
      <span className="repere right-6 top-6 border-r border-t" />
      <span className="repere bottom-6 left-6 border-b border-l" />
      <span className="repere bottom-6 right-6 border-b border-r" />

      {/* Titre et modules */}
      <div className="relative px-12 pb-10 xl:px-16">
        <div className="flex items-end justify-between gap-8">
          <div key={`t-${i}-${cycle}`} className="min-w-0">
            <p className="kicker text-sm font-semibold text-cta">
              {String(i + 1).padStart(2, "0")} <span className="text-white/40">sur 05</span>, {scene.module}
            </p>
            <h2 className="mt-3 whitespace-nowrap font-display text-xl font-semibold text-white xl:text-2xl 2xl:text-3xl">
              {scene.titre.split(" ").map((mot, k) => (
                <Fragment key={k}>
                {k > 0 ? " " : null}
                <span className="mot-masque">
                  <span className="mot" style={{ animationDelay: `${0.25 + k * 0.05}s` }}>{mot}</span>
                </span>
                </Fragment>
              ))}
            </h2>
          </div>
        </div>

        <nav aria-label="Modules de l’Espace Pro" className="mt-10 grid grid-cols-5 gap-3">
          {SCENES.map((s, k) => (
            <button key={s.module} type="button" onClick={() => aller(k)} aria-current={k === i ? "step" : undefined} className="group flex flex-col gap-2 text-left">
              <span className="relative h-0.5 overflow-hidden rounded-full bg-white/15">
                {k === i ? <span key={`${i}-${cycle}`} className={reduit ? "absolute inset-0 bg-cta" : "progression absolute inset-y-0 left-0 bg-cta"} /> : null}
                {k < i ? <span className="absolute inset-0 bg-white/40" /> : null}
              </span>
              <span className={`truncate text-xs font-semibold transition-colors ${k === i ? "text-white" : "text-white/40 group-hover:text-white/70"}`}>{s.module}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

/** Cartouche de planche : numéro et nom du module */
function Cartouche({ numero, nom, actif }: { numero: number; nom: string; actif: boolean }) {
  return (
    <g className="cartouche" opacity={actif ? 1 : 0.6}>
      <path d="M-20 -20h120M-20 -20v40" fill="none" stroke="#ebbc4e" strokeOpacity="0.6" strokeWidth="1" />
      <text x="-12" y="-28" fill="#ebbc4e" fontSize="11" fontStyle="italic" fontFamily="Archivo, sans-serif">
        {`Planche ${String(numero).padStart(2, "0")}, ${nom.toLowerCase()}`}
      </text>
    </g>
  );
}

/* Tracé « crayon » : chaque élément se dessine avec un léger décalage. */
function T({ d, delai = 0, laiton = false, pointille = false, epais = 1.6 }: { d: string; delai?: number; laiton?: boolean; pointille?: boolean; epais?: number }) {
  return (
    <path
      d={d}
      pathLength={1}
      className={pointille ? "trait-fondu" : "trait"}
      style={{ animationDelay: `${0.45 + delai * 0.38}s` }}
      fill="none"
      stroke={laiton ? "#ebbc4e" : "#ffffff"}
      strokeOpacity={laiton ? 0.95 : 0.7}
      strokeWidth={epais}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={pointille ? "0.012 0.018" : undefined}
    />
  );
}

function Porte() {
  return (
    <g>
      <T d="M90 262h230" epais={1.4} />
      <T d="M140 260V38h132v222" epais={2.2} />
      {/* Lumière derrière le vantail qui s'ouvre */}
      <g className="esq-lumiere">
        <T d="M152 250V50h108v200" pointille />
        <T d="M206 150L330 110M206 150L340 150M206 150L330 190" laiton pointille />
      </g>
      <g className="esq-ouvrir">
        <T d="M150 252V48h112v204z" delai={0.4} epais={1.8} />
        <T d="M164 66h84v76h-84zM164 160h84v76h-84z" delai={0.8} />
        <T d="M244 146a6 6 0 1 0 0.1 0" delai={1} laiton epais={2} />
        <g className="esq-pene">
          <T d="M262 80h10M262 150h10M262 220h10" delai={1.1} laiton epais={3} />
        </g>
      </g>
      <T d="M140 280h132M140 273v14M272 273v14" delai={1.2} laiton />
      <T d="M116 38v222M109 38h14M109 260h14" delai={1.3} laiton />
    </g>
  );
}

const TRAJET_LEAD = "M40 70C110 40 170 150 262 168";

function Lead() {
  return (
    <g>
      {/* Carte de France esquissée */}
      <T d="M168 36l46-8 40 22 44 6 8 46-18 34 26 50-30 44-58 16-48-14-34 10-26-40 12-46-28-38 30-40 36-6z" epais={1.6} />
      <T d="M232 60l-10 70 40 60M180 80l30 90-40 50" delai={0.5} pointille />
      {/* Fiche du lead qui arrive */}
      <T d="M14 52h52v36H14z" delai={0.3} epais={1.6} />
      <T d="M22 62h28M22 72h36M22 80h18" delai={0.5} />
      <T d={TRAJET_LEAD} delai={0.6} laiton pointille />
      <circle r="5" fill="#ffd36b" className="esq-voyage" style={{ offsetPath: `path("${TRAJET_LEAD}")` }} />
      {/* Installateurs */}
      <g className="esq-clignote">
        <T d="M196 96c0-12 18-12 18 0 0 10-9 20-9 20s-9-10-9-20z" delai={0.8} />
      </g>
      <g className="esq-clignote" style={{ animationDelay: "0.4s" }}>
        <T d="M158 196c0-12 18-12 18 0 0 10-9 20-9 20s-9-10-9-20z" delai={0.9} />
      </g>
      <T d="M252 150c0-16 24-16 24 0 0 14-12 26-12 26s-12-12-12-26z" delai={1} laiton epais={2.2} />
      <Pulse cx={264} cy={152} delai={1.6} />
    </g>
  );
}

function Brochure() {
  const page = "M0 0h96l24 24v136H0z";
  return (
    <g>
      <g transform="translate(90 40)">
        <g className="esq-eventail-g">
          <T d={page} delai={0.2} />
        </g>
        <g className="esq-eventail-d">
          <T d={page} delai={0.3} />
        </g>
        <T d={page} delai={0.4} epais={2} />
        <T d="M96 0v24h24" delai={0.6} />
        <T d="M16 24h56M16 38h40" delai={0.7} />
        <T d="M16 56h88v48H16z" delai={0.8} />
        <T d="M24 96l18-20 14 12 12-10 28 18" delai={1} laiton />
        <T d="M16 120h88M16 132h70M16 144h80" delai={1.1} />
      </g>
      <g className="esq-rebond">
        <T d="M300 60v90M280 130l20 20 20-20" delai={0.9} laiton epais={2.4} />
      </g>
      <T d="M262 176v28h76v-28" delai={1.1} epais={1.8} />
      <T d="M262 228h76" delai={1.2} epais={1} />
      <g className="esq-remplir">
        <T d="M262 228h76" delai={1.3} laiton epais={3} />
      </g>
    </g>
  );
}

function Pilotage() {
  const barres = [70, 110, 90, 150, 130, 190];
  return (
    <g>
      <T d="M40 250V40M40 250h320" epais={1.6} />
      <T d="M40 190h320M40 130h320M40 70h320" delai={0.3} pointille />
      {barres.map((h, k) => (
        <g key={k} className="esq-barre" style={{ animationDelay: `${0.5 + k * 0.08}s` }}>
          <T d={`M${70 + k * 44} 250v-${h}`} delai={0.4} epais={14} />
        </g>
      ))}
      <T d="M60 200C110 196 130 150 170 160S240 110 280 90s50-30 74-50" delai={1} laiton epais={2.6} />
      <g className="esq-monte">
        <T d="M330 40h24v24" delai={1.4} laiton epais={2.6} />
      </g>
      <Pulse cx={354} cy={40} delai={1.4} />
    </g>
  );
}

function Calendrier() {
  const lignes = [110, 145, 180, 215];
  const colonnes = [100, 140, 180, 220, 260];
  const coches = [
    [2, 0], [4, 1], [1, 2], [3, 2], [0, 3],
  ];
  return (
    <g>
      <T d="M80 60h240v190H80z" epais={2} />
      <T d="M80 95h240" delai={0.3} epais={1.6} />
      <g className="esq-feuillette">
        <T d="M120 44v28M280 44v28" delai={0.4} epais={2.4} />
      </g>
      {lignes.map((y, k) => (
        <T key={y} d={`M80 ${y + 17}h240`} delai={0.5 + k * 0.05} pointille />
      ))}
      {colonnes.map((x, k) => (
        <T key={x} d={`M${x + 20} 95v155`} delai={0.5 + k * 0.05} pointille />
      ))}
      {coches.map(([c, l], k) => (
        <T key={k} d={`M${88 + c * 48} ${118 + l * 35}l8 8 16-16`} delai={1 + k * 0.25} laiton epais={2.2} />
      ))}
      <g className="esq-chute">
        <T d="M178 228v-30l22 9-22 9" delai={1.8} laiton epais={2} />
      </g>
      <Pulse cx={178} cy={230} delai={2.2} />
    </g>
  );
}

/* Onde laiton qui pulse autour d'un point clé une fois le dessin terminé. */
function Pulse({ cx, cy, delai = 0 }: { cx: number; cy: number; delai?: number }) {
  return <circle cx={cx} cy={cy} r={10} className="pulse" style={{ animationDelay: `${0.45 + delai * 0.38}s` }} fill="none" stroke="#ebbc4e" strokeWidth={1.2} />;
}
