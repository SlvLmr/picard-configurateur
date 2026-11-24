"use client";

import { cn } from "@/lib/cn";

/** Choix exclusif entre 2 à 5 options courtes (filtres, vues). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line-strong bg-surface p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm font-medium transition-colors",
              size === "sm" ? "h-6 px-2 text-xs" : "h-8 px-3 text-sm",
              on ? "bg-text text-surface" : "text-text-2 hover:text-text",
            )}
          >
            {o.label}
            {o.count !== undefined ? <span className={cn("tabular text-xs", on ? "opacity-80" : "text-text-3")}>{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
