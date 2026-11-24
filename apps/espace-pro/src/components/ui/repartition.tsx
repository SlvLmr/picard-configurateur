import { cn } from "@/lib/cn";

export type Segment = { label: string; value: number; color: string };

/** Barre de répartition segmentée avec légende chiffrée. */
export function Repartition({ segments, className, label }: { segments: Segment[]; className?: string; label: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className={cn("w-full", className)}>
      <div role="img" aria-label={label} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {segments.map((s) =>
          s.value ? <span key={s.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(s.value / total) * 100}%`, background: s.color }} /> : null,
        )}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="size-3 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="text-text-2">{s.label}</span>
            <span className="tabular ml-auto font-semibold text-text">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
