import { aireLissee, courbeLissee } from "@/lib/courbes";
import type { MoisCA } from "@/lib/data/pilotage";
import { MOIS_COURTS, MOIS_LONGS, montantCourt } from "./montants";

/**
 * Chiffre d'affaires mensuel : réalisé (aire + trait), budget (pointillé), N-1 (trait fin).
 * Chaque mois porte une info-bulle native avec les trois valeurs.
 */
export function CourbeMensuelle({ mois, annee }: { mois: MoisCA[]; annee: number }) {
  const W = 720;
  const H = 260;
  const g = { haut: 16, bas: 32, gauche: 52, droite: 12 };
  const largeur = W - g.gauche - g.droite;
  const hauteur = H - g.haut - g.bas;

  const valeurs = mois.flatMap((m) => [m.budget, m.n1, m.realise ?? 0]);
  const max = Math.max(...valeurs, 1);
  const pas = pasRond(max / 4);
  const plafond = Math.ceil(max / pas) * pas;
  const graduations = Array.from({ length: Math.round(plafond / pas) + 1 }, (_, i) => i * pas);

  const x = (i: number) => g.gauche + (i / 11) * largeur;
  const y = (v: number) => g.haut + hauteur - (v / plafond) * hauteur;

  const realises = mois.map((m, i) => (m.realise !== null ? ([x(i), y(m.realise)] as [number, number]) : null)).filter(Boolean) as [number, number][];
  const budget = mois.map((m, i) => [x(i), y(m.budget)] as [number, number]);
  const n1 = mois.map((m, i) => [x(i), y(m.n1)] as [number, number]);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Chiffre d’affaires mensuel ${annee} : réalisé, budget et année précédente`}>
        <defs>
          <linearGradient id="aire-realise" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.34" />
            <stop offset="0.45" stopColor="var(--bleu-400)" stopOpacity="0.14" />
            <stop offset="1" stopColor="var(--bleu-300)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trait-realise" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--bleu-700)" />
            <stop offset="0.6" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--bleu-400)" />
          </linearGradient>
          <filter id="ombre-realise" x="-5%" y="-20%" width="110%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--accent)" floodOpacity="0.25" />
          </filter>
        </defs>
        {graduations.map((v) => (
          <g key={v}>
            <line x1={g.gauche} x2={W - g.droite} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={g.gauche - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-3)" className="tabular">
              {montantCourt(v)}
            </text>
          </g>
        ))}
        {MOIS_COURTS.map((m, i) => (
          <text key={m} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--text-3)">
            {m}
          </text>
        ))}
        {realises.length > 1 ? (
          <path d={aireLissee(realises, y(0))} fill="url(#aire-realise)" />
        ) : null}
        <path d={courbeLissee(n1)} fill="none" stroke="var(--bleu-300)" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <path d={courbeLissee(budget)} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 6" strokeLinecap="round" />
        <path d={courbeLissee(realises)} fill="none" stroke="url(#trait-realise)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter="url(#ombre-realise)" />
        {realises.map(([a, b], i) =>
          i === realises.length - 1 ? (
            <g key={i}>
              <circle cx={a} cy={b} r="9" fill="var(--accent)" opacity="0.15" />
              <circle cx={a} cy={b} r="4.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />
            </g>
          ) : (
            <circle key={i} cx={a} cy={b} r="2.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
          ),
        )}
        {mois.map((m, i) => (
          <rect key={m.mois} x={x(i) - largeur / 22} y={g.haut} width={largeur / 11} height={hauteur} fill="transparent">
            <title>
              {`${MOIS_LONGS[m.mois - 1]} ${annee}\nRéalisé : ${m.realise !== null ? montantCourt(m.realise) : "non saisi"}\nBudget : ${montantCourt(m.budget)}\n${annee - 1} : ${montantCourt(m.n1)}`}
            </title>
          </rect>
        ))}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-2">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-5 rounded-full bg-accent" />
          Réalisé {annee}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="w-5 border-t-2 border-dashed border-text-3" />
          Budget
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-5 rounded-full" style={{ background: "var(--bleu-300)" }} />
          {annee - 1}
        </span>
      </figcaption>
    </figure>
  );
}

/** Pas de graduation « rond » : 1, 2 ou 5 × 10^n */
function pasRond(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
