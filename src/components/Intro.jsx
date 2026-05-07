import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Star } from 'lucide-react';
import { doors } from '../data';

const CATEGORY_GROUPS = [
  { id: 'appartement', label: 'Pour appartement', accent: "Halls d'immeuble, copropriétés." },
  { id: 'maison', label: 'Pour maison', accent: 'Maisons individuelles, villas.' },
];

export default function Intro({ onPickDoor, onResume }) {
  const groups = CATEGORY_GROUPS.map((group) => ({
    ...group,
    doors: doors.filter((d) => d.category === group.id),
  })).filter((group) => group.doors.length > 0);

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

      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 pb-20 pt-8 text-center sm:px-10 md:pt-12">
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
          Choisissez votre modèle pour démarrer. Composez ensuite couleur, panneau, poignée, vitrage
          et finition — sans concession sur la sécurité.
        </motion.p>

        <div className="mt-2 flex w-full flex-col gap-10">
          {groups.map((group, gi) => (
            <motion.section
              key={group.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 + gi * 0.1 }}
            >
              <div className="mb-5 flex items-baseline justify-between gap-4 text-left">
                <div>
                  <h2 className="font-display text-2xl text-picard-navy sm:text-3xl">
                    {group.label}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.22em] text-picard-navy/55">
                    {group.accent}
                  </p>
                </div>
                <span className="hidden text-[11px] uppercase tracking-[0.22em] text-picard-navy/45 sm:block">
                  {group.doors.length} modèle{group.doors.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.doors.map((door, i) => (
                  <motion.button
                    key={door.id}
                    type="button"
                    onClick={() => onPickDoor(door.id)}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.35 + gi * 0.1 + i * 0.06 }}
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
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className="mt-2"
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
