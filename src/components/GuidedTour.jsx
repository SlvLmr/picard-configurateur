import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, X, ChevronRight } from 'lucide-react';
import { hotspots } from '../data/hotspots';

const STEP_DURATION = 4500;

export default function GuidedTour({ open, onClose, onFocusHotspot }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setIndex(0);
    setPaused(false);
    onFocusHotspot(hotspots[0].id);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      onFocusHotspot(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    if (paused) return undefined;
    timer.current = setTimeout(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= hotspots.length) {
          onClose();
          return prev;
        }
        onFocusHotspot(hotspots[next].id);
        return next;
      });
    }, STEP_DURATION);
    return () => clearTimeout(timer.current);
  }, [open, paused, index, onClose, onFocusHotspot]);

  const currentSpot = hotspots[index];

  return (
    <AnimatePresence>
      {open && currentSpot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto fixed inset-x-4 bottom-6 z-50 mx-auto max-w-xl rounded-2xl border border-picard-navy/12 bg-white/95 p-5 shadow-soft backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">
                Visite guidée · {index + 1}/{hotspots.length}
              </p>
              <h4 className="mt-1 font-display text-2xl text-picard-navy">{currentSpot.title}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-picard-navy/70">
                {currentSpot.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-picard-navy/55 hover:text-picard-navy"
              aria-label="Fermer la visite guidée"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1">
              {hotspots.map((spot, i) => (
                <span
                  key={spot.id}
                  className={`h-1 flex-1 rounded-full ${
                    i <= index ? 'bg-picard-gold' : 'bg-picard-navy/15'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full border border-picard-navy/15 px-3 py-1.5 text-xs font-medium text-picard-navy transition hover:border-picard-navy/35"
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? 'Reprendre' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() => {
                const next = Math.min(index + 1, hotspots.length - 1);
                if (index >= hotspots.length - 1) {
                  onClose();
                  return;
                }
                setIndex(next);
                onFocusHotspot(hotspots[next].id);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-picard-navy px-3 py-1.5 text-xs font-medium text-picard-cream transition hover:bg-black"
            >
              Suivant
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
