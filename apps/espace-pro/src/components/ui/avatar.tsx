import { cn } from "@/lib/cn";

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md"; className?: string }) {
  const initials = name
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent-strong",
        size === "sm" ? "size-8 text-xs" : "size-10 text-sm",
        className,
      )}
    >
      {initials}
    </span>
  );
}
