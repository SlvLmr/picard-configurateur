import { cn } from "@/lib/cn";

type Tone = "accent" | "success" | "warning" | "danger";

const fill: Record<Tone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * La cote : une ligne de cote de plan technique, graduée comme un réglet.
 * Élément signature de l'Espace Pro. Représente une mesure entre deux bornes :
 * objectif, délai, progression vers un palier.
 */
export function Cote({
  value,
  max,
  target,
  valueLabel,
  startLabel,
  endLabel,
  targetLabel,
  label,
  tone = "accent",
  className,
}: {
  value: number;
  max: number;
  target?: number;
  valueLabel: React.ReactNode;
  startLabel?: React.ReactNode;
  endLabel?: React.ReactNode;
  targetLabel?: string;
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const targetPct = target !== undefined ? Math.max(0, Math.min(100, (target / max) * 100)) : undefined;
  const labelPos = Math.max(6, Math.min(94, pct));
  const graduations = Array.from({ length: 21 }, (_, i) => i * 5);

  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={cn("w-full", className)}>
      <div className="relative h-12">
        {/* Valeur, dans une étiquette */}
        <span
          className="tabular absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-2 text-xs font-semibold leading-5 text-surface"
          style={{ left: `${labelPos}%` }}
        >
          {valueLabel}
        </span>
        {/* Butées */}
        <span aria-hidden className="absolute bottom-0 left-0 h-6 w-px bg-text-2" />
        <span aria-hidden className="absolute bottom-0 right-0 h-6 w-px bg-text-2" />
        {/* Graduations du réglet */}
        {graduations.slice(1, -1).map((g) => (
          <span
            key={g}
            aria-hidden
            className={cn("absolute bottom-0 w-px bg-text-3", g % 50 === 0 ? "opacity-80" : g % 10 === 0 ? "opacity-60" : "opacity-40")}
            style={{ left: `${g}%`, height: g % 50 === 0 ? 7 : g % 10 === 0 ? 5 : 3 }}
          />
        ))}
        {/* Piste */}
        <span aria-hidden className="absolute left-px right-px h-2 rounded-full bg-sunken" style={{ bottom: 10 }} />
        {/* Mesure */}
        <span
          aria-hidden
          className={cn("absolute left-0 h-2 rounded-full transition-[width] duration-700 ease-out", fill[tone])}
          style={{ width: `${pct}%`, bottom: 10 }}
        />
        {/* Repère de valeur */}
        <span aria-hidden className="absolute w-0.5 -translate-x-1/2 rounded-full bg-text" style={{ left: `${pct}%`, top: 22, bottom: 4 }} />
        {/* Objectif */}
        {targetPct !== undefined ? (
          <span
            aria-hidden
            title={targetLabel}
            className="absolute size-2 -translate-x-1/2 rotate-45 bg-accent-strong"
            style={{ left: `${targetPct}%`, bottom: 20 }}
          />
        ) : null}
      </div>
      {startLabel || endLabel ? (
        <div className="tabular mt-2 flex justify-between gap-4 text-xs text-text-3">
          <span>{startLabel}</span>
          <span className="text-right">{endLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
