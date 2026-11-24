import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "accent" | "cta" | "success" | "warning" | "danger" | "neutral" | "nav";

const tones: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent-strong",
  cta: "bg-cta-soft text-cta-deep",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-sunken text-text-2",
  nav: "bg-nav text-white",
};

const sizes = {
  sm: "size-8 rounded-md [&_svg]:size-4",
  md: "size-10 rounded-md [&_svg]:size-5",
  lg: "size-12 rounded-lg [&_svg]:size-6",
};

/** Pictogramme dans un carré teinté : signale la nature d'une information. */
export function Picto({ icon: Icon, tone = "accent", size = "md", className }: { icon: LucideIcon; tone?: Tone; size?: keyof typeof sizes; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-grid shrink-0 place-items-center", tones[tone], sizes[size], className)}>
      <Icon strokeWidth={1.75} />
    </span>
  );
}
