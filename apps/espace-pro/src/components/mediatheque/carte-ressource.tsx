import { Download, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Picto } from "@/components/ui/picto";
import { cn } from "@/lib/cn";
import type { Ressource } from "@/lib/data/mediatheque";
import { estMiseAJour, formatTaille, TYPES } from "./libelles";

/** Vignette typée d'une ressource : picto de nature, format en grand, statut. */
export function CarteRessource({ r, active, onSelect }: { r: Ressource; active: boolean; onSelect: () => void }) {
  const t = TYPES[r.type];
  const restreinte = r.rolesAutorises.length > 0 || r.niveauxAutorises.length > 0;
  const majRecente = estMiseAJour(r.version, r.misAJourLe);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border bg-surface text-left shadow-card transition-colors",
        active ? "border-accent ring-2 ring-accent-soft" : "border-line hover:border-line-strong",
      )}
    >
      <div className="relative flex h-24 items-end justify-between gap-3 border-b border-line bg-sunken px-4 pb-3 pt-8">
        <Picto icon={t.icon} tone={t.tone} size="lg" />
        {r.format ? <span className="font-condensed text-xl font-bold text-text-3">{r.format}</span> : null}
        <div className="absolute left-4 top-3 flex gap-1">
          {r.nouveau ? <Badge variant="success">Nouveau</Badge> : majRecente ? <Badge variant="accent">Mis à jour</Badge> : null}
          {restreinte ? (
            <Badge variant="neutral">
              <Lock aria-hidden />
              {r.niveauxAutorises.length ? r.niveauxAutorises.join(", ") : "Interne"}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="font-semibold text-text group-hover:text-accent">{r.titre}</span>
        <span className="text-xs text-text-3">
          {t.label}
          {r.gamme ? `, ${r.gamme}` : ""}
        </span>
        <span className="tabular mt-auto flex items-center gap-3 pt-3 text-xs text-text-3">
          {formatTaille(r.tailleOctets) ? <span>{formatTaille(r.tailleOctets)}</span> : null}
          <span>Version {r.version}</span>
          <span className="ml-auto inline-flex items-center gap-1" title="Téléchargements sur 30 jours">
            <Download className="size-3" aria-hidden />
            {r.telechargements}
          </span>
        </span>
      </div>
    </button>
  );
}
