"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DOOR_MODELS } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function ModelsShowcase() {
  return (
    <section id="modeles" className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <SectionLabel>Notre collection</SectionLabel>
          <h2 className="mt-4 font-display text-4xl md:text-5xl tracking-tight">
            Quatre signatures.
            <br />
            <span className="text-accent italic">Une infinité de portes.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOOR_MODELS.map((model, idx) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.8,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={`/configurateur?model=${model.id}`}
                className="group block relative rounded-2xl overflow-hidden border border-foreground/5 bg-muted/40 hover:border-accent/30 transition-all duration-500"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900 group-hover:scale-[1.03] transition-transform duration-700" />
                  <div className="absolute inset-x-12 top-12 bottom-20 rounded-sm bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-700 shadow-2xl group-hover:border-accent/40 transition-colors duration-500">
                    <div className="absolute right-3 top-1/2 h-12 w-1.5 -translate-y-1/2 rounded-full bg-accent/60" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                </div>
                <div className="p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-2xl tracking-tight">
                      {model.name}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      dès {formatPrice(model.basePrice)}
                    </div>
                  </div>
                  <p className="mt-2 text-foreground/70 italic">
                    {model.tagline}
                  </p>
                  <p className="mt-4 text-sm text-foreground/60 leading-relaxed">
                    {model.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {model.certifications.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border border-foreground/10 text-foreground/60"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
