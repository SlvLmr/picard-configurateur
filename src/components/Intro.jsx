import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Star } from 'lucide-react';
import { doors } from '../data/doors';

export default function Intro({ onPickDoor, onResume }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#B8860B_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,#1A1A2E_0%,transparent_55%)]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-8 sm:px-10">
        <a href={import.meta.env.BASE_URL} className="flex items-center" aria-label="Picard Serrures, accueil">
          <img
            src={`${import.meta.env.BASE_URL}LOGO-PICARD-SERRURES-MIDNIGHT.png`}
            alt="Picard Serrures — Depuis 1720"
            className="h-12 w-auto sm:h-14"
          />
        </a>
        <span className="hidden text-xs uppercase tracking-[0.28em] text-picard-navy/60 md:block">
          Configurateur de portes blindées
        </span>
      </header>

      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 pb-16 pt-8 text-center sm:px-10 md:pt-14">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-picard-gold/40 bg-white/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-picard-navy/80 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-picard-gold" />
          Édition Maison · 2026
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="font-display text-5xl leading-[1.05] text-picard-navy sm:text-6xl md:text-7xl"
        >
          Imaginez la porte
          <br />
          <span className="italic text-picard-navy/85">qui vous ressemble.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="max-w-2xl text-base leading-relaxed text-picard-navy/70 sm:text-lg"
        >
          Choisissez votre type de porte pour démarrer la configuration. Composez ensuite couleur,
          poignée, vitrage et finition — sans concession sur la sécurité.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-4 grid w-full grid-cols-1 gap-5 sm:grid-cols-3"
        >
          {doors.map((door, i) => (
            <motion.button
              key={door.id}
              type="button"
              onClick={() => onPickDoor(door.id)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.35 + i * 0.08 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-picard-navy/10 bg-white/85 p-6 text-left backdrop-blur transition-all duration-300 ease-editorial hover:-translate-y-1 hover:border-picard-navy/25 hover:shadow-soft"
            >
              <div className="mb-5 flex aspect-[4/5] items-center justify-center rounded-xl bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200">
                <DoorVignette door={door} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.24em] text-picard-navy/55">
                  {door.range}
                </span>
                <SecurityStars value={door.security} />
              </div>
              <h3 className="mt-1.5 font-display text-2xl text-picard-navy">{door.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-picard-navy/60">{door.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-picard-navy">{door.price}</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.18em] text-picard-red transition-transform duration-300 ease-editorial group-hover:translate-x-1">
                  Configurer
                  <ArrowRight size={14} />
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className="mt-6"
        >
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center gap-2 rounded-full border border-picard-navy/20 bg-white/70 px-6 py-3 text-sm font-medium text-picard-navy transition-all duration-300 ease-editorial hover:border-picard-navy/40 hover:bg-white"
          >
            <KeyRound size={16} />
            J'ai un code de configuration
          </button>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-picard-navy/10 bg-white/40 py-5 text-center text-[11px] uppercase tracking-[0.24em] text-picard-navy/55 backdrop-blur">
        Picard Serrures · Groupe SFPI · Fabrication française
      </footer>
    </div>
  );
}

function SecurityStars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={11}
          strokeWidth={1.5}
          className={n <= value ? 'fill-picard-gold text-picard-gold' : 'text-picard-navy/20'}
        />
      ))}
    </span>
  );
}

function DoorVignette({ door }) {
  return (
    <div className="relative h-[78%] w-[58%] rounded-md bg-picard-navy/85 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.6)]">
      <div className="absolute inset-2 rounded-sm border border-white/10" />
      {door.panelStyle === 'asymmetric_glass' && (
        <div className="absolute left-2 top-2 bottom-12 w-2 rounded-sm bg-stone-100/90" />
      )}
      {door.panelStyle === 'horizontal_lines' && (
        <div className="absolute inset-x-3 top-3 bottom-12 flex flex-col justify-between gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-px bg-white/15" />
          ))}
        </div>
      )}
      {door.panelStyle === 'fortress' && (
        <div className="absolute inset-3 rounded-sm border-2 border-picard-gold/50" />
      )}
      <span className="absolute right-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-sm bg-picard-gold/80" />
    </div>
  );
}
