import { cn } from "@/lib/cn";

type Tone = "accent" | "success" | "warning" | "danger" | "cta";
const couleur: Record<Tone, string> = {
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  cta: "var(--cta)",
};

/**
 * Jauge à cadran (instrument de mesure) : arc gradué de 0 à max,
 * aiguille sur la valeur, repère d'objectif optionnel.
 */
export function Jauge({
  value,
  max,
  target,
  label,
  valueLabel,
  sousTitre,
  tone = "accent",
  size = 200,
  className,
}: {
  value: number;
  max: number;
  target?: number;
  label: string;
  valueLabel: React.ReactNode;
  sousTitre?: React.ReactNode;
  tone?: Tone;
  size?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = 80;
  const cx = 100;
  const cy = 100;
  const angle = (p: number) => Math.PI * (1 - p); // 180° → 0°
  const pt = (p: number, rr = r) => [cx + rr * Math.cos(angle(p)), cy - rr * Math.sin(angle(p))] as const;
  const arc = (p: number) => {
    const [x, y] = pt(p);
    return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  };
  const graduations = Array.from({ length: 21 }, (_, i) => i / 20);
  const [nx, ny] = pt(pct, r - 22);
  const tgt = target !== undefined ? Math.max(0, Math.min(1, target / max)) : undefined;

  return (
    <figure
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("flex flex-col items-center", className)}
      style={{ width: size }}
    >
      <svg viewBox="0 0 200 116" className="w-full overflow-visible">
        {/* Graduations */}
        {graduations.map((g) => {
          const major = Math.round(g * 20) % 5 === 0;
          const [x1, y1] = pt(g, r + 10);
          const [x2, y2] = pt(g, r + (major ? 18 : 14));
          return <line key={g} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-3)" strokeWidth={major ? 1.5 : 1} opacity={major ? 0.9 : 0.45} />;
        })}
        {/* Piste et mesure */}
        <path d={arc(1)} fill="none" stroke="var(--surface-sunken)" strokeWidth="14" strokeLinecap="round" />
        <path d={arc(pct)} fill="none" stroke={couleur[tone]} strokeWidth="14" strokeLinecap="round" className="transition-all duration-700 ease-out" />
        {/* Objectif */}
        {tgt !== undefined ? (
          (() => {
            const [a1, b1] = pt(tgt, r - 9);
            const [a2, b2] = pt(tgt, r + 9);
            return <line x1={a1} y1={b1} x2={a2} y2={b2} stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />;
          })()
        ) : null}
        {/* Aiguille */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--text)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="var(--text)" />
        <circle cx={cx} cy={cy} r="2" fill="var(--surface)" />
      </svg>
      <figcaption className="-mt-1 text-center">
        <span className="font-display tabular block text-xl font-bold text-text">{valueLabel}</span>
        {sousTitre ? <span className="mt-0.5 block text-xs text-text-3">{sousTitre}</span> : null}
      </figcaption>
    </figure>
  );
}
