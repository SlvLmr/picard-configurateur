import { cn } from "@/lib/cn";
import type { Destinataire } from "@/lib/mock/leads";

type Variant = "neutral" | "accent" | "success" | "warning" | "danger" | "elite" | "premium" | "officiel" | "atc";

const variants: Record<Variant, string> = {
  neutral: "bg-sunken text-text-2",
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  /** Niveaux IAP : du plus affirmé au plus discret */
  elite: "bg-text text-surface",
  premium: "border border-accent text-accent",
  officiel: "bg-accent-soft text-accent-strong",
  atc: "bg-success-soft text-success",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-sm px-2 text-xs font-medium [&_svg]:size-3",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

const typeToVariant: Record<Destinataire["type"], Variant> = {
  Elite: "elite",
  Premium: "premium",
  Officiel: "officiel",
  Client: "neutral",
  ATC: "atc",
};

const typeToLabel: Record<Destinataire["type"], string> = {
  Elite: "IAP Elite",
  Premium: "IAP Premium",
  Officiel: "IAP Officiel",
  Client: "Client",
  ATC: "Commercial",
};

export function NiveauBadge({ type }: { type: Destinataire["type"] }) {
  return <Badge variant={typeToVariant[type]}>{typeToLabel[type]}</Badge>;
}
