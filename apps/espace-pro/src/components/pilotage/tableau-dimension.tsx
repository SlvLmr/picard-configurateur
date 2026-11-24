import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Cote } from "@/components/ui/cote";
import { cn } from "@/lib/cn";
import type { Seuils } from "@/lib/data/pilotage";
import { evolution, montantCourt, ratio } from "./montants";
import { etatAvancement } from "./seuils";

export type LigneTableau = {
  cle: string;
  titre: string;
  sousTitre?: string;
  couleur?: string | null;
  realise: number;
  reference: number;
  n1: number;
  href: string;
  selectionne?: boolean;
};

/**
 * Classement d'une dimension (zones, ATC, gammes) : réalisé, budget à date, avancement coloré
 * selon les seuils, évolution sur un an. En-têtes sur grand écran, cartes sur téléphone.
 * Chaque ligne ouvre le détail.
 */
export function TableauDimension({ lignes, seuils, libelle }: { lignes: LigneTableau[]; seuils: Seuils; libelle: string }) {
  if (lignes.length === 0) return <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucune donnée pour cette période.</p>;
  return (
    <div>
      <div className="hidden grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,0.7fr))_minmax(0,1.6fr)_minmax(0,0.6fr)_16px] gap-4 border-t border-line px-6 py-3 text-xs font-medium text-text-3 lg:grid">
        <span>{libelle}</span>
        <span className="text-right">Réalisé</span>
        <span className="text-right">Budget à date</span>
        <span>Avancement</span>
        <span className="text-right">Sur un an</span>
        <span />
      </div>
      <ul>
        {lignes.map((l) => {
          const pct = ratio(l.realise, l.reference);
          const etat = etatAvancement(pct, seuils);
          const evol = evolution(l.realise, l.n1);
          return (
            <li key={l.cle} className="border-t border-line">
              <Link
                href={l.href}
                scroll={false}
                aria-current={l.selectionne ? "true" : undefined}
                className={cn(
                  "group grid grid-cols-2 items-center gap-x-4 gap-y-3 px-6 py-4 transition-colors hover:bg-sunken lg:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,0.7fr))_minmax(0,1.6fr)_minmax(0,0.6fr)_16px]",
                  l.selectionne && "bg-sunken",
                )}
              >
                <span className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
                  {l.couleur ? <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: l.couleur }} /> : null}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text">{l.titre}</span>
                    {l.sousTitre ? <span className="block truncate text-xs text-text-3">{l.sousTitre}</span> : null}
                  </span>
                  <Badge variant={etat.tone === "accent" ? "accent" : etat.tone} className="ml-auto lg:hidden">
                    {etat.label}
                  </Badge>
                </span>
                <span className="lg:text-right">
                  <span className="block text-xs text-text-3 lg:hidden">Réalisé</span>
                  <span className="tabular font-semibold text-text">{montantCourt(l.realise)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-xs text-text-3 lg:hidden">Budget à date</span>
                  <span className="tabular text-text-2">{montantCourt(l.reference)}</span>
                </span>
                <span className="col-span-2 lg:col-span-1">
                  <Cote
                    label={`Avancement de ${l.titre}`}
                    value={Math.min(pct ?? 0, 130)}
                    max={130}
                    target={100}
                    tone={etat.tone}
                    valueLabel={pct !== null ? `${pct} %` : "Sans budget"}
                  />
                </span>
                <span className="hidden text-right lg:block">
                  {evol !== null ? (
                    <span className={cn("tabular text-sm font-semibold", evol >= 0 ? "text-success" : "text-danger")}>
                      {evol > 0 ? "+" : evol < 0 ? "−" : ""}
                      {Math.abs(evol)} %
                    </span>
                  ) : (
                    <span className="text-sm text-text-3">–</span>
                  )}
                </span>
                <ChevronRight aria-hidden className="hidden size-4 text-text-3 transition-transform group-hover:translate-x-0.5 lg:block" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
