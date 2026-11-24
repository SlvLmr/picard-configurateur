import { useId } from "react";
import { aireLissee, courbeLissee, type Point } from "@/lib/courbes";
import { cn } from "@/lib/cn";

/** Courbe de tendance compacte et lissée, sans axes. La dernière valeur est marquée. */
export function Sparkline({ values, className, tone = "accent" }: { values: number[]; className?: string; tone?: "accent" | "success" | "danger" }) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const w = 96;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts: Point[] = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 5 - ((v - min) / span) * (h - 10)]);
  const last = pts[pts.length - 1];
  const color = tone === "success" ? "var(--success)" : tone === "danger" ? "var(--danger)" : "var(--accent)";
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-24 overflow-visible", className)}>
      <defs>
        <linearGradient id={`sp-a-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`sp-t-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <path d={aireLissee(pts, h)} fill={`url(#sp-a-${id})`} />
      <path d={courbeLissee(pts)} fill="none" stroke={`url(#sp-t-${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="5" fill={color} opacity="0.15" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--surface)" stroke={color} strokeWidth="1.75" />
    </svg>
  );
}
