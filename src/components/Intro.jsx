import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Image as ImageIcon, Sparkles, Compass } from 'lucide-react';

const FEATURES = [
  {
    icon: ImageIcon,
    title: '40 décors d\'inspiration',
    desc: 'Une galerie éditoriale pour projeter votre future entrée.',
  },
  {
    icon: Sparkles,
    title: 'Projection sur photo perso',
    desc: 'Téléchargez votre façade, voyez la porte chez vous.',
  },
  {
    icon: Compass,
    title: 'Visite guidée',
    desc: 'Découvrez les caractéristiques techniques pas à pas.',
  },
];

export default function Intro({ onStart, onResume }) {
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

      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 pb-20 pt-12 text-center sm:px-10 md:pt-20">
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
          Composez votre porte blindée Picard sur mesure : matières, couleurs, vitrages, finitions.
          Trois siècles de savoir-faire au service de votre quotidien — sans concession sur la sécurité.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        >
          <button
            type="button"
            onClick={onStart}
            className="group inline-flex items-center gap-3 rounded-full bg-picard-red px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-white transition-all duration-300 ease-editorial hover:bg-[#A00D24] hover:shadow-soft"
          >
            Démarrer ma configuration
            <ArrowRight
              size={16}
              className="transition-transform duration-300 ease-editorial group-hover:translate-x-1"
            />
          </button>
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center gap-2 rounded-full border border-picard-navy/20 bg-white/70 px-6 py-3.5 text-sm font-medium text-picard-navy transition-all duration-300 ease-editorial hover:border-picard-navy/40 hover:bg-white"
          >
            <KeyRound size={16} />
            J'ai un code de configuration
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 grid w-full grid-cols-1 gap-5 sm:grid-cols-3"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 + i * 0.08 }}
              className="rounded-2xl border border-picard-navy/10 bg-white/70 p-6 text-left backdrop-blur transition-shadow duration-300 ease-editorial hover:shadow-soft"
            >
              <feature.icon size={20} className="mb-4 text-picard-gold" strokeWidth={1.5} />
              <h3 className="font-display text-xl text-picard-navy">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-picard-navy/65">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-picard-navy/10 bg-white/40 py-5 text-center text-[11px] uppercase tracking-[0.24em] text-picard-navy/55 backdrop-blur">
        Picard Serrures · Groupe SFPI · Fabrication française
      </footer>
    </div>
  );
}
