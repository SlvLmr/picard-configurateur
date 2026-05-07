"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grain bg-background">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/40" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 70%, rgba(178,138,70,0.10), transparent 65%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 text-center pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-medium uppercase tracking-[0.18em]"
        >
          Nouveauté · Configurateur Picard
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 font-display text-5xl md:text-7xl lg:text-8xl tracking-tight text-balance text-foreground"
        >
          Votre porte.
          <br />
          <span className="text-accent italic">Sur mesure.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed"
        >
          Imaginez la porte qui marquera votre seuil. Personnalisez chaque
          détail et projetez-la dans votre univers — chez vous, pour de vrai.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/configurateur">
            <Button size="lg">Commencer ma porte</Button>
          </Link>
          <Link href="#modeles">
            <Button size="lg" variant="ghost">
              Découvrir les modèles
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.8 }}
          className="mt-24 flex items-center justify-center gap-12 text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          <span>A2P BP3</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span>Fabrication française</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span>Garantie 10 ans</span>
        </motion.div>
      </div>
    </section>
  );
}
