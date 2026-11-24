import { cn } from "@/lib/cn";

/** Courbe de tendance compacte, sans axes. La dernière valeur est marquée. */
export function Sparkline({ values, className, tone = "accent" }: { values: number[]; className?: string; tone?: "accent" | "success" | "danger" }) {
  if (values.length < 2) return null;
  const w = 96;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 4 - ((v - min) / span) * (h - 8)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const color = tone === "success" ? "var(--success)" : tone === "danger" ? "var(--danger)" : "var(--accent)";
  const id = `sp-${values.join("-").slice(0, 24)}`;
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-24", className)}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${last[0]} ${h} L${pts[0][0]} ${h}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.75" fill="var(--surface)" stroke={color} strokeWidth="1.75" />
    </svg>
  );
}
