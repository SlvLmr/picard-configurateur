import { finition, type Configuration } from "@/lib/configurateur/catalogue";

/**
 * Schéma technique coté : élévation vue côté palier, puis vue en plan du débattement.
 * Les lignes de cote reprennent le langage du composant Cote (butées, flèches, valeur en étiquette).
 */
export function SchemaPorte({ c }: { c: Configuration }) {
  const ech = 300 / 2400;
  const W = Math.max(500, Math.min(c.largeur, 1300)) * ech;
  const H = Math.max(1800, Math.min(c.hauteur, 2500)) * ech;
  const x0 = 64;
  const y0 = 24;
  const f = 8;
  const paumellesADroite = c.main === "droite";
  const xPaumelles = paumellesADroite ? x0 + W - f : x0 + f;
  const xPoignee = paumellesADroite ? x0 + f + 14 : x0 + W - f - 14;
  const ext = finition(c.finitionExterieure);
  const yPlan = y0 + H + 72;
  const ouvrant = W - 2 * f;
  const versInterieur = c.sens === "poussant";
  const largeurTotale = W + 140;
  const hauteurTotale = yPlan + 92;

  return (
    <svg viewBox={`0 0 ${largeurTotale} ${hauteurTotale}`} className="mx-auto w-full max-w-80" role="img" aria-label={`Schéma de la porte : ${c.largeur} par ${c.hauteur} millimètres, ${c.sens} ${c.main}`}>
      <defs>
        <marker id="cote-fleche" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 1 8 4 0 7z" fill="var(--text-2)" />
        </marker>
      </defs>

      {/* Élévation */}
      <rect x={x0} y={y0} width={W} height={H} fill="var(--text)" rx="2" />
      <rect x={x0 + f} y={y0 + f} width={W - 2 * f} height={H - f} fill={ext.teinte} stroke="var(--line-strong)" />
      {[0.28, 0.62].map((p) => (
        <line key={p} x1={x0 + f + 14} x2={x0 + W - f - 14} y1={y0 + H * p} y2={y0 + H * p} stroke="#00000022" />
      ))}
      <rect x={xPoignee - 3} y={y0 + H * 0.47} width={6} height={34} rx={3} fill="var(--text)" />
      <circle cx={xPoignee} cy={y0 + H * 0.47 + 46} r={4} fill="var(--text)" />
      {[0.1, 0.5, 0.88].map((p) => (
        <rect key={p} x={xPaumelles - 3} y={y0 + H * p} width={6} height={18} fill="var(--text-3)" />
      ))}
      {c.options.includes("judas") ? <circle cx={x0 + W / 2} cy={y0 + H * 0.3} r={5} fill="none" stroke="var(--text)" strokeWidth="1.5" /> : null}

      {/* Cote de largeur */}
      <g>
        <line x1={x0} x2={x0} y1={y0 + H + 6} y2={y0 + H + 30} stroke="var(--text-2)" />
        <line x1={x0 + W} x2={x0 + W} y1={y0 + H + 6} y2={y0 + H + 30} stroke="var(--text-2)" />
        <line x1={x0 + 1} x2={x0 + W - 1} y1={y0 + H + 22} y2={y0 + H + 22} stroke="var(--text-2)" markerStart="url(#cote-fleche)" markerEnd="url(#cote-fleche)" />
        <Etiquette x={x0 + W / 2} y={y0 + H + 22} texte={`${c.largeur} mm`} />
      </g>
      {/* Cote de hauteur */}
      <g>
        <line x1={x0 - 6} x2={x0 - 36} y1={y0} y2={y0} stroke="var(--text-2)" />
        <line x1={x0 - 6} x2={x0 - 36} y1={y0 + H} y2={y0 + H} stroke="var(--text-2)" />
        <line x1={x0 - 26} x2={x0 - 26} y1={y0 + 1} y2={y0 + H - 1} stroke="var(--text-2)" markerStart="url(#cote-fleche)" markerEnd="url(#cote-fleche)" />
        <Etiquette x={x0 - 26} y={y0 + H / 2} texte={`${c.hauteur} mm`} vertical />
      </g>

      {/* Vue en plan */}
      <text x={x0} y={yPlan - 22} fontSize="11" fill="var(--text-3)" fontFamily="inherit">
        Vue en plan
      </text>
      <text x={x0 + W + 12} y={yPlan - 8} fontSize="10" fill="var(--text-3)" fontFamily="inherit">
        Palier
      </text>
      <text x={x0 + W + 12} y={yPlan + 22} fontSize="10" fill="var(--text-3)" fontFamily="inherit">
        Intérieur
      </text>
      <rect x={x0 - 40} y={yPlan} width={40} height={10} fill="var(--line-strong)" />
      <rect x={x0 + W} y={yPlan} width={40} height={10} fill="var(--line-strong)" />
      {(() => {
        const pivotX = paumellesADroite ? x0 + W - f : x0 + f;
        const dir = paumellesADroite ? -1 : 1;
        const sensY = versInterieur ? 1 : -1;
        const baseY = versInterieur ? yPlan + 10 : yPlan;
        const angle = (70 * Math.PI) / 180;
        const bx = pivotX + dir * ouvrant * Math.cos(angle);
        const by = baseY + sensY * ouvrant * Math.sin(angle);
        const fx = pivotX + dir * ouvrant;
        return (
          <g>
            <line x1={pivotX} y1={baseY} x2={bx} y2={by} stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
            <path
              d={`M ${fx} ${baseY} A ${ouvrant} ${ouvrant} 0 0 ${dir * sensY > 0 ? 1 : 0} ${bx} ${by}`}
              fill="none"
              stroke="var(--accent)"
              strokeDasharray="4 5"
            />
            <circle cx={pivotX} cy={baseY} r="3" fill="var(--text)" />
          </g>
        );
      })()}
    </svg>
  );
}

function Etiquette({ x, y, texte, vertical = false }: { x: number; y: number; texte: string; vertical?: boolean }) {
  const w = texte.length * 6.4 + 12;
  return (
    <g transform={vertical ? `rotate(-90 ${x} ${y})` : undefined}>
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={4} fill="var(--text)" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--surface)" fontFamily="inherit">
        {texte}
      </text>
    </g>
  );
}
