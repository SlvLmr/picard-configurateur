import { AnimatePresence, motion } from 'framer-motion';
import { hotspots } from '../data';

export default function HotspotSystem({ activeId, onSelect, onClose }) {
  return (
    <>
      {hotspots.map((spot) => {
        const isActive = spot.id === activeId;
        return (
          <button
            type="button"
            key={spot.id}
            onClick={() => onSelect(isActive ? null : spot.id)}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            aria-label={spot.label}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-picard-gold text-white transition-all duration-300 ${
                isActive ? 'scale-110 shadow-soft' : 'animate-pulse-gold group-hover:scale-110'
              }`}
            >
              <span className="text-[11px] font-semibold tracking-wider">+</span>
            </span>
          </button>
        );
      })}
      <AnimatePresence>
        {activeId && (
          <HotspotCard
            spot={hotspots.find((s) => s.id === activeId)}
            onClose={() => (onClose ? onClose() : onSelect(null))}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function HotspotCard({ spot, onClose }) {
  if (!spot) return null;
  // Place the card to avoid overflowing the canvas edges.
  const horizontalSide = spot.x > 55 ? 'right' : 'left';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        left: horizontalSide === 'left' ? `calc(${spot.x}% + 24px)` : 'auto',
        right: horizontalSide === 'right' ? `calc(${100 - spot.x}% + 24px)` : 'auto',
        top: `${Math.max(8, Math.min(spot.y - 4, 80))}%`,
      }}
      className="absolute z-30 w-64 rounded-xl border border-picard-navy/10 bg-white/95 p-4 shadow-soft backdrop-blur"
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-picard-gold">Détail technique</p>
      <h4 className="mt-1 font-display text-xl text-picard-navy">{spot.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-picard-navy/70">{spot.description}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-picard-navy/55 hover:text-picard-navy"
      >
        Fermer
      </button>
    </motion.div>
  );
}
