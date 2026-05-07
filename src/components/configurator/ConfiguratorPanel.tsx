"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useConfigStore } from "@/lib/store";
import {
  DECORS,
  DOOR_ACCESSORIES,
  DOOR_COLORS,
  DOOR_GLAZINGS,
  DOOR_HANDLES,
  DOOR_MODELS,
  computePrice,
} from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

const STEPS = [
  { id: "modele", label: "Modèle" },
  { id: "couleur", label: "Couleur" },
  { id: "vitrage", label: "Vitrage" },
  { id: "poignee", label: "Poignée" },
  { id: "accessoires", label: "Accessoires" },
  { id: "decor", label: "Décor" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function ConfiguratorPanel() {
  const [step, setStep] = useState<StepId>("modele");
  const { config, view } = useConfigStore();
  const price = computePrice(config);

  return (
    <div className="flex flex-col h-full">
      {/* Stepper */}
      <div className="px-6 pt-6 pb-4 border-b border-border overflow-x-auto scrollbar-hidden">
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cn(
                "shrink-0 px-3 h-8 rounded-full text-xs font-medium tracking-wide transition-colors",
                step === s.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "mr-1.5",
                  step === s.id ? "text-accent-foreground/70" : "text-accent",
                )}
              >
                {i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === "modele" && <ModelStep />}
            {step === "couleur" && <ColorStep />}
            {step === "vitrage" && <GlazingStep />}
            {step === "poignee" && <HandleStep />}
            {step === "accessoires" && <AccessoryStep />}
            {step === "decor" && <DecorStep view={view} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky footer with price */}
      <div className="border-t border-border px-6 py-5 bg-background">
        <div className="flex items-end justify-between mb-4">
          <div>
            <SectionLabel>Votre configuration</SectionLabel>
            <div className="font-display text-3xl mt-1 tracking-tight">
              {formatPrice(price)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Pose et TVA incluses
            </div>
          </div>
          <Button size="md">Demander un devis</Button>
        </div>
      </div>
    </div>
  );
}

function OptionTile({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-xl border p-4 transition-all duration-300",
        selected
          ? "border-accent bg-accent/5"
          : "border-border hover:border-foreground/40",
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
          <Check className="w-3 h-3" strokeWidth={3} />
        </div>
      )}
      {children}
    </button>
  );
}

function ModelStep() {
  const { config, setModel } = useConfigStore();
  return (
    <div className="space-y-3">
      <SectionLabel>Choisissez votre modèle</SectionLabel>
      {DOOR_MODELS.map((m) => (
        <OptionTile
          key={m.id}
          selected={config.modelId === m.id}
          onClick={() => setModel(m.id)}
        >
          <div className="flex items-baseline justify-between gap-3 pr-6">
            <h4 className="font-display text-lg">{m.name}</h4>
            <span className="text-xs text-muted-foreground shrink-0">
              dès {formatPrice(m.basePrice)}
            </span>
          </div>
          <p className="mt-1 text-sm italic text-foreground/70">{m.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.highlights.map((h) => (
              <span
                key={h}
                className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground"
              >
                {h}
              </span>
            ))}
          </div>
        </OptionTile>
      ))}
    </div>
  );
}

function ColorStep() {
  const { config, setColor } = useConfigStore();
  return (
    <div>
      <SectionLabel>Teinte et finition</SectionLabel>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {DOOR_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => setColor(c.id)}
            className={cn(
              "group relative rounded-xl border p-3 transition-all duration-300",
              config.colorId === c.id
                ? "border-accent bg-accent/5"
                : "border-border hover:border-foreground/40",
            )}
          >
            <div
              className="aspect-square rounded-lg mb-3 shadow-inner"
              style={{
                backgroundColor: c.hex,
                boxShadow:
                  c.finish === "brillant"
                    ? "inset 0 0 30px rgba(255,255,255,0.2)"
                    : c.finish === "mate"
                      ? "inset 0 0 30px rgba(0,0,0,0.4)"
                      : "inset 0 0 30px rgba(0,0,0,0.15)",
              }}
            />
            <div className="text-sm font-medium">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>{c.ral}</span>
              <span className="capitalize">{c.finish}</span>
            </div>
            {c.premium && (
              <div className="absolute top-2 right-2 text-[9px] uppercase tracking-[0.18em] text-accent">
                Premium
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function GlazingStep() {
  const { config, setGlazing } = useConfigStore();
  return (
    <div className="space-y-3">
      <SectionLabel>Vitrage</SectionLabel>
      {DOOR_GLAZINGS.map((g) => (
        <OptionTile
          key={g.id}
          selected={config.glazingId === g.id}
          onClick={() => setGlazing(g.id)}
        >
          <div className="flex items-baseline justify-between gap-3 pr-6">
            <h4 className="text-base font-medium">{g.name}</h4>
            <span className="text-xs text-muted-foreground shrink-0">
              {g.price === 0 ? "Inclus" : `+ ${formatPrice(g.price)}`}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/60">{g.description}</p>
        </OptionTile>
      ))}
    </div>
  );
}

function HandleStep() {
  const { config, setHandle } = useConfigStore();
  return (
    <div className="space-y-3">
      <SectionLabel>Poignée</SectionLabel>
      {DOOR_HANDLES.map((h) => (
        <OptionTile
          key={h.id}
          selected={config.handleId === h.id}
          onClick={() => setHandle(h.id)}
        >
          <div className="flex items-baseline justify-between gap-3 pr-6">
            <h4 className="text-base font-medium">{h.name}</h4>
            <span className="text-xs text-muted-foreground shrink-0">
              {h.price === 0 ? "Inclus" : `+ ${formatPrice(h.price)}`}
            </span>
          </div>
        </OptionTile>
      ))}
    </div>
  );
}

function AccessoryStep() {
  const { config, toggleAccessory } = useConfigStore();
  const grouped = DOOR_ACCESSORIES.reduce(
    (acc, a) => {
      (acc[a.category] ||= []).push(a);
      return acc;
    },
    {} as Record<string, typeof DOOR_ACCESSORIES>,
  );
  const labels: Record<string, string> = {
    heurtoir: "Heurtoirs",
    numero: "Numéro de rue",
    judas: "Judas",
    "boite-aux-lettres": "Boîte aux lettres",
  };
  return (
    <div className="space-y-6">
      <SectionLabel>Accessoires</SectionLabel>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="text-xs text-muted-foreground mb-2">
            {labels[cat]}
          </div>
          <div className="space-y-2">
            {items.map((a) => (
              <OptionTile
                key={a.id}
                selected={config.accessoryIds.includes(a.id)}
                onClick={() => toggleAccessory(a.id)}
              >
                <div className="flex items-baseline justify-between gap-3 pr-6">
                  <span className="text-sm">{a.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    + {formatPrice(a.price)}
                  </span>
                </div>
              </OptionTile>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DecorStep({ view }: { view: "exterieur" | "interieur" }) {
  const { config, setDecor } = useConfigStore();
  const decors = DECORS.filter((d) => d.side === view);
  const selectedId =
    view === "exterieur" ? config.decorExteriorId : config.decorInteriorId;

  return (
    <div>
      <SectionLabel>
        Décor {view === "exterieur" ? "extérieur" : "intérieur"}
      </SectionLabel>
      <p className="mt-2 text-xs text-muted-foreground">
        Choisissez l&apos;ambiance dans laquelle votre porte prendra place.
        Basculez entre vue extérieure et intérieure depuis le bandeau.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {decors.map((d) => (
          <button
            key={d.id}
            onClick={() => setDecor(view, d.id)}
            className={cn(
              "group relative rounded-xl overflow-hidden border transition-all duration-300",
              selectedId === d.id
                ? "border-accent ring-2 ring-accent/40"
                : "border-border hover:border-foreground/40",
            )}
          >
            <div
              className={cn(
                "aspect-[4/3] bg-gradient-to-br",
                d.gradient,
              )}
            />
            <div className="p-3 bg-background">
              <div className="text-xs font-medium truncate">{d.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {d.ambiance}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
