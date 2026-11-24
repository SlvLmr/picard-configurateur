const nf = new Intl.NumberFormat("fr-FR");
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const formatNumber = (n: number) => nf.format(n);
export const formatEuros = (n: number) => eur.format(n);
export const formatPercent = (n: number) => `${nf.format(Math.round(n))} %`;

/** Durée en minutes → « 2 h 14 » / « 45 min » */
export function formatDuree(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(d);
