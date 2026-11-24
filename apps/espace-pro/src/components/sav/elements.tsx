import { Package, ShieldCheck, Truck, Wrench } from "lucide-react";
import { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Picto } from "@/components/ui/picto";
import { cn } from "@/lib/cn";
import { ETAPES, STATUTS, type SavStatut, type SavType } from "./libelles";

const ICONES_TYPE = {
  reclamation_garantie: ShieldCheck,
  pieces_detachees: Package,
  assistance_technique: Wrench,
  livraison_litige: Truck,
} as const;

export function TypePicto({ type, size = "sm" }: { type: SavType; size?: "sm" | "md" | "lg" }) {
  return <Picto icon={ICONES_TYPE[type]} tone={type === "reclamation_garantie" ? "accent" : "neutral"} size={size} />;
}

export function StatutBadge({ statut }: { statut: SavStatut }) {
  const s = STATUTS[statut];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/** Frise de suivi en quatre étapes : déposée, analyse, prise en charge, résolue. */
export function Frise({ statut, refusee }: { statut: SavStatut; refusee?: boolean }) {
  const courante = ETAPES.findIndex((e) => e.cle.includes(statut));
  return (
    <ol aria-label="Suivi de la demande" className="grid grid-cols-4 gap-2">
      {ETAPES.map((e, i) => {
        const faite = i < courante || (i === courante && (statut === "resolue" || statut === "cloturee"));
        const active = i === courante && !faite;
        return (
          <li key={e.label} aria-current={active ? "step" : undefined}>
            <span
              aria-hidden
              className={cn(
                "block h-1 rounded-full",
                faite ? (refusee && i === ETAPES.length - 1 ? "bg-text-3" : "bg-success") : active ? "bg-accent" : "bg-sunken",
              )}
            />
            <span className={cn("mt-2 block text-xs", faite || active ? "font-semibold text-text" : "text-text-3")}>{e.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 transition-colors focus:border-accent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});

const df = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const dh = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const dateCourte = (iso: string) => df.format(new Date(iso));
export const dateHeure = (iso: string) => dh.format(new Date(iso));

/** Ancienneté en jours, arrondie. */
export const ageJours = (iso: string, maintenant = Date.now()) => Math.max(0, Math.floor((maintenant - new Date(iso).getTime()) / 86400000));

export function tailleLisible(o: number | null) {
  if (!o) return "";
  if (o < 1024 * 1024) return `${Math.round(o / 1024)} Ko`;
  return `${(o / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}
