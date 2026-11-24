import { cn } from "@/lib/cn";

type Tone = "accent" | "success" | "warning" | "danger";

const fill: Record<Tone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * La cote : une ligne de cote de plan technique (deux butées, une valeur).
 * Élément signature de l'Espace Pro. Sert à représenter une mesure entre
 * deux bornes : objectif, délai, progression vers un palier.
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
  /** Libellé accessible */
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const targetPct = target !== undefined ? Math.max(0, Math.min(100, (target / max) * 100)) : undefined;
  const labelPos = Math.max(6, Math.min(94, pct));

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("w-full", className)}
    >
      <div className="relative h-12">
        {/* Valeur */}
        <span
          className="tabular absolute top-0 -translate-x-1/2 whitespace-nowrap text-sm font-bold text-text"
          style={{ left: `${labelPos}%` }}
        >
          {valueLabel}
        </span>
        {/* Butées */}
        <span aria-hidden className="absolute bottom-0 left-0 h-5 w-px bg-text-3" />
        <span aria-hidden className="absolute bottom-0 right-0 h-5 w-px bg-text-3" />
        {/* Ligne de cote avec flèches */}
        <span aria-hidden className="absolute bottom-2 left-px right-px h-px bg-text-3" />
        <svg aria-hidden className="absolute bottom-1 left-px size-2 text-text-3" viewBox="0 0 8 8">
          <path d="M0 4 8 1v6z" fill="currentColor" />
        </svg>
        <svg aria-hidden className="absolute bottom-1 right-px size-2 text-text-3" viewBox="0 0 8 8">
          <path d="M8 4 0 1v6z" fill="currentColor" />
        </svg>
        {/* Mesure */}
        <span
          aria-hidden
          className={cn("absolute left-0 h-1 rounded-sm transition-[width] duration-700 ease-out", fill[tone])}
          style={{ width: `${pct}%`, bottom: 6 }}
        />
        {/* Repère de valeur */}
        <span
          aria-hidden
          className="absolute w-px -translate-x-1/2 bg-text"
          style={{ left: `${pct}%`, top: 22, bottom: 0 }}
        />
        {/* Objectif */}
        {targetPct !== undefined ? (
          <span
            aria-hidden
            className="absolute bottom-0 h-3 w-0.5 -translate-x-1/2 bg-accent-strong"
            style={{ left: `${targetPct}%` }}
            title={targetLabel}
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
