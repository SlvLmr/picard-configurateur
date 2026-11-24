import { cn } from "@/lib/cn";

/**
 * Version compacte de la cote, pour les lignes de tableau :
 * piste graduée, mesure colorée selon l'atteinte, butée à 100 %.
 * L'échelle va jusqu'à 120 % pour montrer le dépassement.
 */
export function BarreObjectif({ pct, label }: { pct: number | null; label: string }) {
  const p = pct ?? 0;
  const echelle = 120;
  const largeur = Math.min(p, echelle) / echelle;
  const ton = p >= 100 ? "bg-success" : p >= 85 ? "bg-accent" : p >= 75 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-3" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={echelle} aria-valuenow={p}>
      <div className="relative h-2 min-w-24 flex-1 rounded-full bg-sunken">
        <span className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out", ton)} style={{ width: `${largeur * 100}%` }} />
        <span aria-hidden className="absolute -inset-y-1 w-0.5 rounded-full bg-text" style={{ left: `${(100 / echelle) * 100}%` }} />
      </div>
      <span className="tabular w-12 text-right text-sm font-semibold text-text">{pct === null ? "–" : `${pct} %`}</span>
    </div>
  );
}

/** Pastille d'évolution : verte si positive, rouge si négative. */
export function Evolution({ valeur, suffixe = "%" }: { valeur: number | null; suffixe?: string }) {
  if (valeur === null) return <span className="text-xs text-text-3">–</span>;
  const bon = valeur >= 0;
  return (
    <span className={cn("tabular inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold", bon ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
      {bon ? "+" : "−"}
      {Math.abs(valeur)} {suffixe}
    </span>
  );
}
