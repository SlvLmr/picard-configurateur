import { Info, Megaphone, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Picto } from "@/components/ui/picto";
import { cn } from "@/lib/cn";
import type { Annonce } from "@/lib/data/accueil";

const STYLE = {
  info: { icon: Info, tone: "accent" as const, bord: "border-l-accent" },
  operation: { icon: Megaphone, tone: "cta" as const, bord: "border-l-cta" },
  important: { icon: TriangleAlert, tone: "warning" as const, bord: "border-l-warning" },
};

/** Un à trois messages d'actualité. Toute la carte est cliquable quand l'annonce a un lien. */
export function Annonces({ annonces }: { annonces: Annonce[] }) {
  if (annonces.length === 0) return null;
  return (
    <section aria-label="Actualités" className={cn("grid grid-cols-1 gap-4", annonces.length > 1 && "lg:grid-cols-2", annonces.length > 2 && "xl:grid-cols-3")}>
      {annonces.map((a) => {
        const s = STYLE[a.ton];
        const corps = (
          <>
            <Picto icon={s.icon} tone={s.tone} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text">{a.titre}</p>
              <p className="mt-1 line-clamp-3 text-sm text-text-2">{a.contenu}</p>
              {a.lienUrl ? <p className="mt-2 text-sm font-medium text-accent group-hover:underline">{a.lienLibelle ?? "En savoir plus"}</p> : null}
            </div>
          </>
        );
        const classes = cn("group flex h-full gap-3 rounded-lg border border-l-4 border-line bg-surface p-5 shadow-card", s.bord);
        return a.lienUrl ? (
          <Link key={a.id} href={a.lienUrl} className={cn(classes, "transition-colors hover:bg-sunken")}>
            {corps}
          </Link>
        ) : (
          <article key={a.id} className={classes}>
            {corps}
          </article>
        );
      })}
    </section>
  );
}
