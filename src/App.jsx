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
              onChange={set}
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.28em] text-picard-navy/55">
            Étape 01 — Personnalisation
          </span>
          <h2 className="font-display text-3xl text-picard-navy sm:text-4xl">
            Composez chaque détail.
          </h2>
        </div>
        <button
          type="button"
          onClick={onStartTour}
          className="inline-flex items-center gap-2 rounded-full border border-picard-navy/15 bg-white px-4 py-2 text-xs font-medium text-picard-navy transition hover:border-picard-navy/35"
        >
          <Compass size={14} />
          Visite guidée
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="relative">
          <DoorCanvas
            ambiance={selections.ambiance}
            customPhoto={state.customPhoto}
            door={selections.door}
            doorColor={state.view === 'exterior' ? selections.doorColorExterior : selections.doorColorInterior}
            frameColor={state.view === 'exterior' ? selections.frameColorExterior : selections.frameColorInterior}
            handle={selections.handle}
            glass={selections.glass}
            finish={selections.finish}
            accessoryIds={state.accessoryIds}
            view={state.view}
            onViewChange={(v) => set({ view: v })}
            showHotspots
            activeHotspotId={activeHotspot}
            onHotspotChange={setActiveHotspot}
            inStudio
          />
        </div>
        <div className={isMobile ? 'h-[60vh]' : 'h-[680px]'}>
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

      <GuidedTour
        open={tourOpen}
        hotspots={selections.door.hotspots || []}
        onClose={onCloseTour}
        onFocusHotspot={setActiveHotspot}
      />
    </div>
  );
}
