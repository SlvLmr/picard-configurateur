"use client";

import { Fragment, useEffect, useRef, useState } from "react";

/**
 * Esquisses animées de la page de connexion : chaque scène se dessine au crayon,
 * reste un instant, puis laisse place à la suivante. Elles racontent ce que propose l'Espace Pro.
 * Respecte « réduire les animations » : la première scène s'affiche alors fixe.
 */
/** Une planche par module : position sur le grand plan, titre, chiffre clé. */
const SCENES = [
  { module: "Configurateur", titre: "Chaque porte au millimètre", texte: "Cotes, sécurité, finitions : le devis est prêt en quelques étapes.", x: 0, y: 0, chiffre: 930, suffixe: " mm", legende: "largeur de passage" },
  { module: "Leads", titre: "Vos leads en temps réel", texte: "Chaque demande part vers l’installateur le plus proche.", x: 560, y: -80, chiffre: 12, suffixe: " min", legende: "pour accepter un lead" },
  { module: "Médiathèque", titre: "Brochures et notices à jour", texte: "Documents commerciaux et techniques, en un clic.", x: 1100, y: 60, chiffre: 248, suffixe: "", legende: "téléchargements ce mois" },
  { module: "Ventes", titre: "Développez vos ventes", texte: "Chiffre, objectifs et campagnes, zone par zone.", x: 260, y: 420, chiffre: 18, suffixe: " %", prefixe: "+", legende: "de chiffre sur un an" },
  { module: "Calendrier", titre: "Aucun rendez-vous manqué", texte: "Salons, formations et visites dans un seul calendrier.", x: 860, y: 460, chiffre: 14, suffixe: " mars", legende: "prochain salon régional" },
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
              <circle r="5" fill="#ffd36b">
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

      {/* Texte, chiffre clé et modules */}
      <div className="relative px-12 pb-10 xl:px-16">
        <div className="flex items-end justify-between gap-8">
          <div key={`t-${i}-${cycle}`} className="flex min-h-40 min-w-0 flex-col justify-end">
            <p className="kicker text-sm font-semibold text-cta">
              {String(i + 1).padStart(2, "0")} <span className="text-white/40">sur 05</span>, {scene.module}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-white xl:text-3xl">
              {scene.titre.split(" ").map((mot, k) => (
                <Fragment key={k}>
                {k > 0 ? " " : null}
                <span className="mot-masque">
                  <span className="mot" style={{ animationDelay: `${0.25 + k * 0.05}s` }}>{mot}</span>
                </span>
                </Fragment>
              ))}
            </h2>
            <p className="sous-titre mt-3 max-w-md text-base text-nav-muted">{scene.texte}</p>
          </div>
          <Compteur key={`c-${i}-${cycle}`} valeur={scene.chiffre} prefixe={"prefixe" in scene ? scene.prefixe : ""} suffixe={scene.suffixe} legende={scene.legende} reduit={reduit} />
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

/** Chiffre clé qui défile jusqu'à sa valeur */
function Compteur({ valeur, prefixe, suffixe, legende, reduit }: { valeur: number; prefixe: string; suffixe: string; legende: string; reduit: boolean }) {
  const [n, setN] = useState(reduit ? valeur : 0);
  useEffect(() => {
    if (reduit) return;
    let raf = 0;
    const debut = performance.now() + 300;
    const pas = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - debut) / 800));
      setN(Math.round(valeur * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [valeur, reduit]);
  return (
    <div className="compteur hidden shrink-0 text-right xl:block">
      <p className="font-display text-3xl font-semibold tabular text-cta">
        {prefixe}
        {n}
        <span className="text-xl">{suffixe}</span>
      </p>
      <p className="mt-1 text-xs text-nav-muted">{legende}</p>
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

function Texte({ x, y, children, delai = 0, ancre = "middle" }: { x: number; y: number; children: string; delai?: number; ancre?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={ancre} className="annotation" style={{ animationDelay: `${0.45 + delai * 0.38}s` }} fill="#ebbc4e" fontSize="11" fontStyle="italic" fontFamily="Archivo, sans-serif">
      {children}
    </text>
  );
}

function Porte() {
  return (
    <g>
      <T d="M150 250V48h110v202" epais={2} />
      <T d="M162 250V60h86v190" delai={0.4} />
      <T d="M238 150a4 4 0 1 0 0.1 0" delai={0.9} laiton epais={1.8} />
      <T d="M238 158v12" delai={1} laiton epais={1.8} />
      <Pulse cx={238} cy={154} delai={1.2} />
      <T d="M162 250A86 86 0 0 1 248 164" delai={1.1} pointille />
      <T d="M150 270h110M150 263v14M260 263v14" delai={1.4} laiton />
      <T d="M125 48v202M118 48h14M118 250h14" delai={1.6} laiton />
      <Texte x={205} y={290} delai={1.9}>930 mm</Texte>
      <Texte x={110} y={152} delai={2} ancre="end">2150</Texte>
      <T d="M290 80h60M290 100h44M290 120h52" delai={2.1} />
      <T d="M282 76l4 4 8-8" delai={2.3} laiton />
      <T d="M282 96l4 4 8-8" delai={2.4} laiton />
      <T d="M282 116l4 4 8-8" delai={2.5} laiton />
    </g>
  );
}

function Lead() {
  return (
    <g>
      <T d="M40 70h120v70H40z" epais={1.8} />
      <T d="M54 88h60M54 104h86M54 120h44" delai={0.4} />
      <T d="M140 86a8 8 0 1 0 0.1 0" delai={0.6} laiton />
      <T d="M260 60c40 10 80 50 70 100s-60 80-110 70-80-40-60-90 50-90 100-80z" delai={0.7} pointille />
      <T d="M165 105C210 100 230 130 262 150" delai={1.2} laiton epais={1.8} />
      <T d="M254 143l9 8-11 4" delai={1.6} laiton epais={1.8} />
      <T d="M285 140c0-14 22-14 22 0 0 12-11 24-11 24s-11-12-11-24z" delai={1.8} epais={1.8} />
      <T d="M296 141a3 3 0 1 0 0.1 0" delai={2} laiton />
      <Pulse cx={296} cy={144} delai={1.5} />
      <Texte x={296} y={190} delai={2.2}>IAP Elite, 3 km</Texte>
      <T d="M70 200h80v30H70z" delai={2.3} />
      <T d="M82 216l6 6 12-12" delai={2.5} laiton epais={1.8} />
      <Texte x={160} y={220} delai={2.6} ancre="start">accepté</Texte>
    </g>
  );
}

function Brochure() {
  return (
    <g>
      <T d="M120 40h110l30 30v170H120z" epais={1.8} />
      <T d="M230 40v30h30" delai={0.4} />
      <T d="M138 64h70M138 80h50" delai={0.6} />
      <T d="M138 100h104v60H138z" delai={0.8} />
      <T d="M150 150l22-24 16 16 12-10 30 18" delai={1.1} laiton />
      <T d="M138 178h104M138 192h86M138 206h96" delai={1.3} />
      <T d="M310 90v100" delai={1.6} laiton epais={2} />
      <T d="M290 170l20 20 20-20" delai={1.9} laiton epais={2} />
      <T d="M280 220h60v14h-60z" delai={2.1} />
      <Texte x={310} y={262} delai={2.3}>notice v3</Texte>
    </g>
  );
}

function Pilotage() {
  return (
    <g>
      <T d="M50 240V50M50 240h300" epais={1.6} />
      <T d="M70 240v-50M110 240v-80M150 240v-60M190 240v-110M230 240v-90" delai={0.4} epais={6} />
      <T d="M60 200C100 190 120 150 160 160S220 110 260 100s50-40 80-50" delai={1} laiton epais={2} />
      <T d="M340 50a5 5 0 1 0 0.1 0" delai={1.6} laiton epais={2} />
      <Pulse cx={340} cy={55} delai={1.2} />
      <T d="M260 220a50 50 0 0 1 100 0" delai={1.7} />
      <T d="M310 220l24-30" delai={2} laiton epais={1.8} />
      <Texte x={310} y={248} delai={2.2}>94 % du budget</Texte>
    </g>
  );
}

function Calendrier() {
  const lignes = [110, 145, 180, 215];
  const colonnes = [100, 140, 180, 220, 260];
  return (
    <g>
      <T d="M80 60h240v190H80z" epais={1.8} />
      <T d="M80 95h240" delai={0.3} />
      <T d="M120 48v24M280 48v24" delai={0.4} epais={2} />
      {lignes.map((y, k) => (
        <T key={y} d={`M80 ${y + 17}h240`} delai={0.6 + k * 0.1} pointille />
      ))}
      {colonnes.map((x, k) => (
        <T key={x} d={`M${x + 20} 95v155`} delai={0.6 + k * 0.1} pointille />
      ))}
      <T d="M222 162a20 16 0 1 0 1 0" delai={1.4} laiton epais={2} />
      <Pulse cx={222} cy={178} delai={1.1} />
      <T d="M242 150l40-46" delai={1.8} laiton />
      <T d="M282 104v-30l26 10-26 10" delai={2} laiton />
      <Texte x={300} y={66} delai={2.2} ancre="start">Salon</Texte>
    </g>
  );
}

/* Onde laiton qui pulse autour d'un point clé une fois le dessin terminé. */
function Pulse({ cx, cy, delai = 0 }: { cx: number; cy: number; delai?: number }) {
  return <circle cx={cx} cy={cy} r={10} className="pulse" style={{ animationDelay: `${0.45 + delai * 0.38}s` }} fill="none" stroke="#ebbc4e" strokeWidth={1.2} />;
}
