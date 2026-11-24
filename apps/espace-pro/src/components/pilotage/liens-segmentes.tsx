import Link from "next/link";
import { cn } from "@/lib/cn";

/** Choix exclusif par liens (même rendu que Segmented) : l'état vit dans l'adresse de la page. */
export function LiensSegmentes({ label, options }: { label: string; options: { href: string; label: string; actif: boolean; compte?: number }[] }) {
  return (
    <nav aria-label={label} className="max-w-full overflow-x-auto">
      <ul className="inline-flex rounded-md border border-line-strong bg-surface p-0.5">
        {options.map((o) => (
          <li key={o.href}>
            <Link
              href={o.href}
              aria-current={o.actif ? "page" : undefined}
              scroll={false}
              className={cn(
                "inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-sm px-3 text-sm font-medium transition-colors",
                o.actif ? "bg-text text-surface" : "text-text-2 hover:text-text",
              )}
            >
              {o.label}
              {o.compte !== undefined ? <span className={cn("tabular text-xs", o.actif ? "opacity-80" : "text-text-3")}>{o.compte}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
