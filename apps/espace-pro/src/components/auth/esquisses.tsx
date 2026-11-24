"use client";

import { useEffect, useState } from "react";

/**
 * Esquisses animées de la page de connexion : chaque scène se dessine au crayon,
 * reste un instant, puis laisse place à la suivante. Elles racontent ce que propose l'Espace Pro.
 * Respecte « réduire les animations » : la première scène s'affiche alors fixe.
 */
const SCENES = [
  { titre: "Configurez chaque porte au millimètre", texte: "Cotes, sécurité, finitions : le devis est prêt en quelques étapes." },
  { titre: "Recevez et suivez vos leads", texte: "Chaque demande part vers l’installateur le plus proche, suivie jusqu’à la signature." },
  { titre: "Téléchargez brochures et notices", texte: "Documents commerciaux et techniques, toujours à jour." },
  { titre: "Pilotez votre activité", texte: "Chiffre, objectifs et campagnes, zone par zone." },
  { titre: "Ne manquez aucun rendez-vous", texte: "Salons, formations et visites dans un seul calendrier." },
];

const DUREE = 6500;

export function Esquisses() {
  const [i, setI] = useState(0);
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduit(m.matches);
    if (m.matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % SCENES.length), DUREE);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex flex-1 flex-col justify-center">
      <svg viewBox="0 0 400 300" className="esquisse h-auto w-full max-w-lg" role="img" aria-label={SCENES[i].titre}>
        <defs>
          <filter id="crayon" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="3" result="bruit" />
            <feDisplacementMap in="SourceGraphic" in2="bruit" scale="1.6" />
          </filter>
          <pattern id="quadrillage" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#quadrillage)" />
        <g key={i} filter="url(#crayon)" className={reduit ? "" : "scene"}>
          {i === 0 ? <Porte /> : i === 1 ? <Lead /> : i === 2 ? <Brochure /> : i === 3 ? <Pilotage /> : <Calendrier />}
        </g>
      </svg>

      <div key={`t-${i}`} className={reduit ? "mt-8" : "legende mt-8"}>
        <p className="font-display text-xl font-semibold text-white">{SCENES[i].titre}</p>
        <p className="mt-2 max-w-sm text-sm text-nav-muted">{SCENES[i].texte}</p>
      </div>

      <div className="mt-6 flex gap-2" aria-hidden>
        {SCENES.map((s, k) => (
          <span key={s.titre} className="h-0.5 rounded-full transition-all duration-500" style={{ width: k === i ? 32 : 12, background: k === i ? "var(--cta)" : "rgba(255,255,255,.25)" }} />
        ))}
      </div>
    </div>
  );
}

/* Tracé « crayon » : chaque élément se dessine avec un léger décalage. */
function T({ d, delai = 0, laiton = false, pointille = false, epais = 1.6 }: { d: string; delai?: number; laiton?: boolean; pointille?: boolean; epais?: number }) {
  return (
    <path
      d={d}
      pathLength={1}
      className={pointille ? "trait-fondu" : "trait"}
      style={{ animationDelay: `${delai}s` }}
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
    <text x={x} y={y} textAnchor={ancre} className="annotation" style={{ animationDelay: `${delai}s` }} fill="#ebbc4e" fontSize="11" fontStyle="italic" fontFamily="Archivo, sans-serif">
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
      <T d="M242 150l40-46" delai={1.8} laiton />
      <T d="M282 104v-30l26 10-26 10" delai={2} laiton />
      <Texte x={300} y={66} delai={2.2} ancre="start">Salon</Texte>
    </g>
  );
}
