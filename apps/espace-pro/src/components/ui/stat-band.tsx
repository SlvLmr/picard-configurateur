import { cn } from "@/lib/cn";

type Tone = "positive" | "negative" | "neutral";

export type StatItem = { label: string; value: React.ReactNode; note?: React.ReactNode; tone?: Tone };

const toneClass: Record<Tone, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-text-3",
};

/** Une seule bande d'indicateurs par page, séparés par des filets. */
export function StatBand({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-surface lg:grid-cols-4",
        className,
      )}
    >
      {items.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "px-6 py-5",
            i % 2 === 1 && "border-l border-line",
            i >= 2 && "border-t border-line lg:border-t-0",
            i === 2 && "lg:border-l",
          )}
        >
          <dt className="text-sm font-medium text-text-2">{s.label}</dt>
          <dd className="tabular mt-2 text-xl font-bold text-text">{s.value}</dd>
          {s.note ? <dd className={cn("mt-1 text-xs font-medium", toneClass[s.tone ?? "neutral"])}>{s.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
