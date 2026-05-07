"use client";

import { useConfigStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ViewToggle() {
  const { view, setView } = useConfigStore();

  return (
    <div className="inline-flex items-center p-1 rounded-full border border-border bg-background/85 backdrop-blur-md shadow-sm">
      {(["exterieur", "interieur"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={cn(
            "px-5 h-9 rounded-full text-xs font-medium uppercase tracking-[0.18em] transition-all duration-300",
            view === v
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v === "exterieur" ? "Extérieur" : "Intérieur"}
        </button>
      ))}
    </div>
  );
}
