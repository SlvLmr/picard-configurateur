import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import Intro from './components/Intro';
import ProgressBar from './components/ProgressBar';
import PersonalizationPanel from './components/PersonalizationPanel';
import DoorCanvas from './components/DoorCanvas';
import GuidedTour from './components/GuidedTour';
import Summary from './components/Summary';
import RestoreModal from './components/RestoreModal';
import useConfiguratorState from './hooks/useConfiguratorState';
import useResponsive from './hooks/useResponsive';

const stepTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
};

export default function App() {
  const cfg = useConfiguratorState();
  const { state, set, next, back, goTo, reset, restore, toggleAccessory, selections, persistablePayload } = cfg;
  const { isMobile } = useResponsive();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);

  if (state.step === 0) {
    return (
      <>
        <Intro
          onPickDoor={(id) => {
            set({ doorId: id });
            goTo(1);
          }}
          onResume={() => setRestoreOpen(true)}
        />
        <RestoreModal
          open={restoreOpen}
          onClose={() => setRestoreOpen(false)}
          onRestored={(payload) => {
            restore(payload);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-picard-cream">
      <ProgressBar step={state.step} onBack={back} onHome={() => reset()} />

      <AnimatePresence mode="wait">
        {state.step === 1 && (
          <motion.div key="step-1" {...stepTransition}>
            <PersonalizationStep
              cfg={cfg}
              isMobile={isMobile}
              tourOpen={tourOpen}
              onStartTour={() => setTourOpen(true)}
              onCloseTour={() => setTourOpen(false)}
              activeHotspot={activeHotspot}
              setActiveHotspot={setActiveHotspot}
            />
          </motion.div>
        )}
        {state.step === 2 && (
          <motion.div key="step-2" {...stepTransition}>
            <Summary
              state={state}
              selections={selections}
              payload={persistablePayload}
              onBack={back}
              onRestart={() => reset()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonalizationStep({ cfg, isMobile, tourOpen, onStartTour, onCloseTour, activeHotspot, setActiveHotspot }) {
  const { state, set, next, back, toggleAccessory, selections } = cfg;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-6 flex flex-col gap-2 sm:mb-8">
        <span className="text-xs uppercase tracking-[0.28em] text-picard-navy/55">
          Étape 01 — Personnalisation
        </span>
        <h2 className="font-display text-3xl text-picard-navy sm:text-4xl lg:text-5xl">
          Composez chaque détail.
        </h2>
      </div>

      <div className="flex items-center gap-3 pb-5">
        <ViewToggle view={state.view} onChange={(v) => set({ view: v })} />
        <button
          type="button"
          onClick={onStartTour}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-picard-navy/15 bg-white px-3.5 py-2 text-xs font-medium text-picard-navy transition hover:border-picard-navy/35 sm:hidden"
        >
          <Compass size={14} />
          Visite guidée
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative">
          <DoorCanvas
            decor={selections.decor}
            customPhoto={state.customPhoto}
            door={selections.door}
            color={selections.color}
            handle={selections.handle}
            glass={selections.glass}
            finish={selections.finish}
            accessoryIds={state.accessoryIds}
            view={state.view}
            showHotspots
            activeHotspotId={activeHotspot}
            onHotspotChange={setActiveHotspot}
          />
        </div>
        <div className={isMobile ? 'h-[60vh]' : 'h-[640px]'}>
          <PersonalizationPanel
            state={state}
            selections={selections}
            onChange={set}
            onToggleAccessory={toggleAccessory}
            onStartTour={onStartTour}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-picard-navy/20 px-6 py-3 text-sm font-medium text-picard-navy transition hover:border-picard-navy/40"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={next}
          className="inline-flex items-center justify-center gap-3 rounded-full bg-picard-navy px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-picard-cream transition hover:bg-black"
        >
          Voir le récapitulatif
        </button>
      </div>

      <GuidedTour open={tourOpen} onClose={onCloseTour} onFocusHotspot={setActiveHotspot} />
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-picard-navy/15 bg-white p-1">
      {[
        { id: 'exterior', label: 'Extérieur' },
        { id: 'interior', label: 'Intérieur' },
      ].map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
            view === opt.id
              ? 'bg-picard-navy text-picard-cream'
              : 'text-picard-navy/65 hover:text-picard-navy'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
