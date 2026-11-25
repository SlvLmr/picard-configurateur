import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Picto } from "@/components/ui/picto";
import { TexteEditable } from "@/components/ui/texte-editable";
import { cn } from "@/lib/cn";

/* ───────── Carte : même gabarit que les panneaux du site (picto, titre, sous-titre, lien) ───────── */
export function Carte({
  id, titre, sousTitre, sousTitreFixe = false, icone, ton, lien, actions, children, className,
}: {
  id: string; titre: string; sousTitre: React.ReactNode;
  /** Sous-titre fixe, donc modifiable par l'administrateur (un sous-titre calculé ne l'est pas) */
  sousTitreFixe?: boolean; icone: LucideIcon; ton: React.ComponentProps<typeof Picto>["tone"];
  lien?: { href: string; label: string }; actions?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("flex flex-col rounded-lg border border-line bg-surface shadow-card", className)}>
      <header className="flex items-center gap-4 px-6 pb-4 pt-6">
        <Picto icon={icone} tone={ton} />
        <div className="min-w-0 flex-1">
          <h2 id={id} className="font-display text-lg font-semibold leading-tight text-text">
            <TexteEditable cle={`accueil.${id}.titre`} champ="titre" defaut={titre} />
          </h2>
          <p className="mt-0.5 truncate text-sm text-text-3">
            {sousTitreFixe && typeof sousTitre === "string" ? <TexteEditable cle={`accueil.${id}.sous-titre`} champ="sous-titre" defaut={sousTitre} /> : sousTitre}
          </p>
        </div>
        {actions}
        {lien ? (
          <Link href={lien.href} className="shrink-0 rounded-full border border-line px-3 py-1 text-sm font-medium text-text-2 transition-colors hover:border-line-strong hover:text-text">
            {lien.label}
          </Link>
        ) : null}
      </header>
      <div className="flex-1 px-6 pb-6">{children}</div>
    </section>
  );
}

