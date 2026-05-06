"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Configuration, DEFAULT_CONFIG } from "./catalog";

export type ViewSide = "exterieur" | "interieur";

type ConfigState = {
  config: Configuration;
  view: ViewSide;
  setModel: (id: string) => void;
  setColor: (id: string) => void;
  setHandle: (id: string) => void;
  setGlazing: (id: string) => void;
  toggleAccessory: (id: string) => void;
  setDecor: (side: ViewSide, id: string) => void;
  setView: (side: ViewSide) => void;
  reset: () => void;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      view: "exterieur",
      setModel: (id) =>
        set((s) => ({ config: { ...s.config, modelId: id } })),
      setColor: (id) =>
        set((s) => ({ config: { ...s.config, colorId: id } })),
      setHandle: (id) =>
        set((s) => ({ config: { ...s.config, handleId: id } })),
      setGlazing: (id) =>
        set((s) => ({ config: { ...s.config, glazingId: id } })),
      toggleAccessory: (id) =>
        set((s) => {
          const has = s.config.accessoryIds.includes(id);
          return {
            config: {
              ...s.config,
              accessoryIds: has
                ? s.config.accessoryIds.filter((a) => a !== id)
                : [...s.config.accessoryIds, id],
            },
          };
        }),
      setDecor: (side, id) =>
        set((s) => ({
          config: {
            ...s.config,
            ...(side === "exterieur"
              ? { decorExteriorId: id }
              : { decorInteriorId: id }),
          },
        })),
      setView: (side) => set({ view: side }),
      reset: () => set({ config: DEFAULT_CONFIG, view: "exterieur" }),
    }),
    {
      name: "picard-config",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
