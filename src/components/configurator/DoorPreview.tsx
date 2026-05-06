"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useConfigStore } from "@/lib/store";
import {
  DECORS,
  DOOR_COLORS,
  DOOR_GLAZINGS,
  DOOR_HANDLES,
  DOOR_MODELS,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function DoorPreview() {
  const { config, view } = useConfigStore();

  const decor = DECORS.find((d) =>
    view === "exterieur"
      ? d.id === config.decorExteriorId
      : d.id === config.decorInteriorId,
  );
  const color = DOOR_COLORS.find((c) => c.id === config.colorId);
  const handle = DOOR_HANDLES.find((h) => h.id === config.handleId);
  const glazing = DOOR_GLAZINGS.find((g) => g.id === config.glazingId);
  const model = DOOR_MODELS.find((m) => m.id === config.modelId);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-muted">
      {/* Decor placeholder background. Will be replaced by Nano Banana images. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={decor?.id ?? "none"}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            decor?.gradient ?? "from-stone-300 to-stone-700",
          )}
        />
      </AnimatePresence>

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

      {/* The door, centered */}
      <div className="absolute inset-0 flex items-end justify-center pb-[6%]">
        <motion.div
          layout
          className="relative w-[36%] aspect-[2/5] max-w-[340px]"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Door frame */}
          <div className="absolute -inset-2 rounded-sm bg-gradient-to-b from-stone-900 to-stone-950 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]" />

          {/* Door body */}
          <motion.div
            key={color?.id}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-sm overflow-hidden"
            style={{
              backgroundColor: color?.hex ?? "#1a1a1a",
              boxShadow: `inset 0 0 80px rgba(0,0,0,${
                color?.finish === "mate" ? 0.5 : 0.25
              })`,
            }}
          >
            {/* Subtle finish reflection */}
            {color?.finish !== "mate" && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
            )}

            {/* Glazing */}
            {glazing?.id === "bandeau-vertical" && (
              <div className="absolute top-[12%] bottom-[12%] right-[18%] w-[10%] rounded-sm bg-gradient-to-b from-sky-200/40 via-sky-100/30 to-sky-300/40 backdrop-blur-sm border border-white/10" />
            )}
            {glazing?.id === "imposte" && (
              <div className="absolute top-[8%] inset-x-[15%] h-[12%] rounded-sm bg-gradient-to-b from-sky-200/40 via-sky-100/30 to-sky-300/40 border border-white/10" />
            )}
            {glazing?.id === "triple-hublot" && (
              <div className="absolute top-[20%] left-1/2 -translate-x-1/2 flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-200/50 to-sky-400/50 border border-white/20"
                  />
                ))}
              </div>
            )}

            {/* Heritage moulures */}
            {model?.id === "heritage" && (
              <>
                <div className="absolute top-[8%] inset-x-[10%] h-[36%] border-2 border-black/20 rounded-sm" />
                <div className="absolute bottom-[8%] inset-x-[10%] h-[36%] border-2 border-black/20 rounded-sm" />
              </>
            )}

            {/* Présence inserts inox */}
            {model?.id === "presence" && (
              <>
                <div className="absolute top-[12%] left-[12%] w-[8%] bottom-[12%] bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-300" />
                <div className="absolute top-[12%] right-[30%] w-[3%] bottom-[12%] bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-300" />
              </>
            )}

            {/* Handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 right-[12%] w-2 h-16 rounded-full"
              style={{
                background:
                  handle?.finish === "laiton"
                    ? "linear-gradient(180deg, #d4a85a, #8b6f3a)"
                    : handle?.finish === "noir"
                      ? "linear-gradient(180deg, #2a2a2a, #0a0a0a)"
                      : handle?.finish === "chrome"
                        ? "linear-gradient(180deg, #e5e5e5, #a5a5a5)"
                        : "linear-gradient(180deg, #d0d0d0, #888888)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Decor info */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs font-medium">
        {decor?.name}
      </div>

      {/* View indicator */}
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs uppercase tracking-[0.18em]">
        Vue {view === "exterieur" ? "extérieure" : "intérieure"}
      </div>
    </div>
  );
}
