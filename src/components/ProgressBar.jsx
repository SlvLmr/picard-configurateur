import { motion } from 'framer-motion';
import { STEPS } from '../hooks/useConfiguratorState';

export default function ProgressBar({ step, onBack, onHome }) {
  const total = STEPS.length;
  const percent = Math.max(0, Math.min(100, ((step - 0) / total) * 100));

  return (
    <div className="sticky top-0 z-40 border-b border-picard-navy/10 bg-picard-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={onHome}
          aria-label="Retour à l'accueil"
          className="hidden items-center transition hover:opacity-70 sm:flex"
        >
          <img
            src={`${import.meta.env.BASE_URL}picard-logo.svg`}
            alt="Picard Serrures"
            className="h-8 w-auto"
            onError={(e) => {
              if (!e.currentTarget.dataset.fallback) {
                e.currentTarget.dataset.fallback = '1';
                e.currentTarget.src = `${import.meta.env.BASE_URL}picard-logo.png`;
              }
            }}
          />
        </button>

        <div className="flex flex-1 items-center gap-3">
          {STEPS.map((s) => {
            const active = s.id === step;
            const passed = s.id < step;
            return (
              <div key={s.id} className="flex flex-1 flex-col gap-1.5">
                <div className="relative h-[3px] overflow-hidden rounded-full bg-picard-navy/10">
                  <motion.div
                    initial={false}
                    animate={{ width: passed ? '100%' : active ? '60%' : '0%' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 left-0 bg-picard-gold"
                  />
                </div>
                <span
                  className={`text-[10px] uppercase tracking-[0.22em] ${
                    active ? 'text-picard-navy' : 'text-picard-navy/45'
                  }`}
                >
                  0{s.id} · {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onBack}
          disabled={step <= 1}
          className="hidden rounded-full border border-picard-navy/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-picard-navy transition disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:border-picard-navy/40 sm:block"
        >
          Retour
        </button>
      </div>
      <div className="h-[2px] w-full bg-picard-navy/5">
        <div
          className="h-full bg-picard-red transition-all duration-700 ease-editorial"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
