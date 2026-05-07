import { motion } from 'framer-motion';
import { ChevronRight, Star, ArrowLeft } from 'lucide-react';
import { doors } from '../data/doors';

export default function DoorSelector({ doorId, onSelect, onContinue, onBack }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 lg:py-16">
      <div className="mb-10 flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.28em] text-picard-navy/55">
          Étape 02 — Modèle
        </span>
        <h2 className="font-display text-4xl text-picard-navy sm:text-5xl">
          Quatre architectures, une même exigence.
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-picard-navy/65">
          Chaque modèle Picard est certifié A2P et fabriqué en France. Choisissez celui qui dialogue
          avec votre lieu de vie.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {doors.map((door, idx) => {
          const selected = door.id === doorId;
          return (
            <motion.button
              key={door.id}
              type="button"
              onClick={() => onSelect(door.id)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: idx * 0.06 }}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 text-left transition-all duration-300 ease-editorial ${
                selected
                  ? 'border-picard-gold shadow-soft ring-1 ring-picard-gold/60'
                  : 'border-picard-navy/10 hover:-translate-y-1 hover:border-picard-navy/25 hover:shadow-soft'
              }`}
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
              <span className="mt-4 text-sm font-medium text-picard-navy">{door.price}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-picard-navy/20 px-6 py-3 text-sm font-medium text-picard-navy transition hover:border-picard-navy/40"
        >
          <ArrowLeft size={16} />
          Retour
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-picard-navy px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-picard-cream transition hover:bg-black"
        >
          Personnaliser ma porte
          <ChevronRight size={16} />
        </button>
      </div>
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
      <div className="absolute inset-2 rounded-sm border border-white/8" />
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
