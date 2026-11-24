import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Picto } from "@/components/ui/picto";
import { cn } from "@/lib/cn";

export type Brique = {
  label: string;
  valeur: number | string;
  unite?: string;
  aide: string;
  href: string;
  icon: LucideIcon;
  ton?: "accent" | "cta" | "success" | "warning" | "danger" | "neutral";
  /** Met la brique en avant quand une action est attendue */
  attention?: boolean;
};

/** Grille de briques cliquables : ce qui attend l'utilisateur, module par module. */
export function Briques({ items }: { items: Brique[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((b) => (
        <li key={b.label} className="min-w-0">
          <Link
            href={b.href}
            className={cn(
              "group flex h-full flex-col gap-4 rounded-lg border bg-surface p-6 shadow-card transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-px hover:border-text-3",
              b.attention ? "border-cta" : "border-line",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <Picto icon={b.icon} tone={b.ton ?? "accent"} />
              {b.attention ? <span className="rounded-full bg-cta-soft px-2 text-xs font-semibold leading-6 text-cta-deep">À traiter</span> : null}
            </div>
            <div className="min-w-0">
              <p className="flex items-baseline gap-1">
                <span className="font-display tabular text-2xl font-bold text-text">{b.valeur}</span>
                {b.unite ? <span className="text-base font-semibold text-text-3">{b.unite}</span> : null}
              </p>
              <p className="mt-1 text-sm font-semibold text-text">{b.label}</p>
              <p className="mt-0.5 text-sm text-text-2">{b.aide}</p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-sm font-medium text-accent">
              Ouvrir
              <ChevronRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
