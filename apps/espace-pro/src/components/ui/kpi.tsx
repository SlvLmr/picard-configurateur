import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Picto } from "./picto";
import { Sparkline } from "./sparkline";

export type KpiItem = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon: LucideIcon;
  tone?: "accent" | "cta" | "success" | "warning" | "danger" | "neutral";
  /** Évolution : texte et sens. "up_bad" = une hausse est une mauvaise nouvelle */
  delta?: { text: string; sens: "up" | "down" | "flat"; bon: boolean };
  note?: string;
  trend?: number[];
};

function Delta({ d }: { d: NonNullable<KpiItem["delta"]> }) {
  const Icon = d.sens === "down" ? TrendingDown : TrendingUp;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-semibold",
        d.bon ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
      )}
    >
      {d.sens !== "flat" ? <Icon className="size-4" aria-hidden strokeWidth={2.25} /> : null}
      {d.text}
    </span>
  );
}

/**
 * Bande d'indicateurs clés. Une seule par page.
 * Chaque indicateur : picto, libellé, valeur forte, évolution, tendance.
 */
export function KpiBand({ items, className }: { items: KpiItem[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 overflow-hidden rounded-lg border border-line bg-surface shadow-card sm:grid-cols-2 xl:grid-cols-4", className)}>
      {items.map((k, i) => (
        <div
          key={k.label}
          className={cn(
            "relative flex flex-col gap-4 p-6",
            i > 0 && "border-t border-line sm:border-t-0",
            i % 2 === 1 && "sm:border-l",
            i >= 2 && "sm:border-t xl:border-t-0",
            i === 2 && "xl:border-l",
            i === 3 && "xl:border-l",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <Picto icon={k.icon} tone={k.tone ?? "accent"} />
            {k.trend ? <Sparkline values={k.trend} tone={k.delta ? (k.delta.bon ? "success" : "danger") : "accent"} /> : null}
          </div>
          <div>
            <dt className="text-sm font-medium text-text-2">{k.label}</dt>
            <dd className="mt-1 flex items-baseline gap-1">
              <span className="font-display tabular text-2xl font-bold text-text">{k.value}</span>
              {k.unit ? <span className="text-base font-semibold text-text-3">{k.unit}</span> : null}
            </dd>
          </div>
          {k.delta || k.note ? (
            <dd className="flex flex-wrap items-center gap-2 text-xs text-text-3">
              {k.delta ? <Delta d={k.delta} /> : null}
              {k.note}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
