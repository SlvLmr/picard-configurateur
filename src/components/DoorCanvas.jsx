import { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import HotspotSystem from './HotspotSystem';
import { resolveAmbianceImage } from '../utils/assets';

const DoorCanvas = forwardRef(function DoorCanvas(
  {
    ambiance,
    customPhoto,
    door,
    doorColor,
    frameColor,
    handle,
    glass,
    finish,
    accessoryIds,
    view,
    showHotspots,
    activeHotspotId,
    onHotspotChange,
  },
  ref,
) {
  const sceneStyle = useMemo(() => {
    if (customPhoto) {
      return { backgroundImage: `url(${customPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return null;
  }, [customPhoto]);

  const hotspots = door?.hotspots || [];

  return (
    <div
      ref={ref}
      className="relative isolate overflow-hidden rounded-3xl border border-picard-navy/10 bg-stone-100 editorial-shadow"
    >
      <SceneBackdrop ambiance={ambiance} sceneStyle={sceneStyle} view={view} />

      <div className="relative aspect-[4/5] w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative h-[80%] w-[56%] rounded-md p-[6px]"
            style={{ background: frameColor?.hex || '#1A1A2E' }}
          >
            <DoorGraphic
              door={door}
              doorColor={doorColor}
              handle={handle}
              glass={glass}
              finish={finish}
              accessoryIds={accessoryIds}
              view={view}
            />
            {showHotspots && (
              <HotspotSystem
                hotspots={hotspots}
                activeId={activeHotspotId}
                onSelect={onHotspotChange}
              />
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/55 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-picard-navy/75 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-picard-gold" />
        {view === 'exterior' ? 'Vue extérieur' : 'Vue intérieur'}
      </div>
    </div>
  );
});

export default DoorCanvas;

function SceneBackdrop({ ambiance, sceneStyle, view }) {
  if (sceneStyle) {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={sceneStyle} />
        <div className="absolute inset-0 bg-black/15" />
      </div>
    );
  }
  if (!ambiance) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200" />
    );
  }
  const resolvedImage = resolveAmbianceImage(ambiance.imageUrl);
  if (resolvedImage) {
    return (
      <div className="absolute inset-0">
        <img
          src={resolvedImage}
          alt={ambiance.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {view === 'interior' && <div className="absolute inset-0 bg-picard-navy/35" />}
      </div>
    );
  }
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${ambiance.gradient}`}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, ${ambiance.accent} 0%, transparent 60%), radial-gradient(circle at 75% 80%, ${ambiance.accent} 0%, transparent 55%)`,
        }}
      />
      <div className="absolute inset-x-0 top-1/2 h-px bg-picard-navy/8" />
      {view === 'interior' && <div className="absolute inset-0 bg-picard-navy/12" />}
    </div>
  );
}

function DoorGraphic({ door, doorColor, handle, glass, finish, accessoryIds, view }) {
  const finishOverlay = finishStyle(finish?.id);
  return (
    <motion.div
      key={`${door.id}-${doorColor.id}-${finish.id}-${view}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-full w-full rounded-md"
      style={{
        background: doorColor?.hex || '#1A1A2E',
        boxShadow:
          '0 30px 60px -25px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.25)',
        ...finishOverlay,
      }}
    >
      <div className="pointer-events-none absolute inset-1.5 rounded-sm border border-white/10" />

      <PanelDesign door={door} />
      <GlassDesign glass={glass} />

      {view === 'exterior' && (
        <>
          <HandleGraphic handle={handle} />
          <LockPlate handle={handle} />
        </>
      )}
      {view === 'interior' && (
        <>
          <InteriorBolts />
          <InteriorHandle handle={handle} />
        </>
      )}

      <Accessories accessoryIds={accessoryIds} view={view} />

      <span className="pointer-events-none absolute -bottom-3 left-1/2 h-5 w-3/4 -translate-x-1/2 rounded-full bg-black/35 blur-2xl" />
    </motion.div>
  );
}

function PanelDesign({ door }) {
  const lighten = 'rgba(255,255,255,0.08)';
  switch (door.panelStyle) {
    case 'horizontal_lines':
      return (
        <div className="absolute inset-x-3 top-3 bottom-12 flex flex-col justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="h-px" style={{ background: lighten }} />
          ))}
        </div>
      );
    case 'fortress':
      return (
        <>
          <div
            className="absolute inset-3 rounded-sm border-2"
            style={{ borderColor: 'rgba(184,134,11,0.45)' }}
          />
          <div className="absolute inset-x-6 top-1/2 h-px" style={{ background: lighten }} />
        </>
      );
    case 'asymmetric_glass':
      return null;
    case 'full_panel':
    default:
      return (
        <div
          className="absolute inset-x-4 inset-y-5 rounded-sm border"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        />
      );
  }
}

function GlassDesign({ glass }) {
  if (!glass || glass.id === 'none') return null;
  const sheen = 'linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(220,235,245,0.35) 40%, rgba(180,200,210,0.55) 100%)';
  switch (glass.id) {
    case 'top-center':
      return (
        <div
          className="absolute left-1/2 top-[10%] h-[18%] w-[40%] -translate-x-1/2 rounded-sm border border-white/30 shadow-inner"
          style={{ backgroundImage: sheen }}
        />
      );
    case 'vertical-asym':
      return (
        <div
          className="absolute left-2 top-[8%] bottom-[20%] w-[12%] rounded-sm border border-white/30 shadow-inner"
          style={{ backgroundImage: sheen }}
        />
      );
    case 'multi-geo':
      return (
        <div className="absolute left-1/2 top-[10%] grid h-[35%] w-[55%] -translate-x-1/2 grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="rounded-[2px] border border-white/25"
              style={{ backgroundImage: sheen, opacity: 0.85 }}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
}

function HandleGraphic({ handle }) {
  const isGold = handle?.finish === 'gold';
  const colorClass = isGold ? 'bg-picard-gold' : 'bg-stone-200';
  if (handle?.style === 'vertical' || handle?.style === 'bar') {
    const heightClass = handle.style === 'bar' ? 'h-[55%]' : 'h-[35%]';
    return (
      <div
        className={`absolute right-3 top-1/2 w-[3px] -translate-y-1/2 rounded-full ${colorClass} shadow-[0_0_0_1px_rgba(0,0,0,0.25)] ${heightClass}`}
      />
    );
  }
  return (
    <div className="absolute right-2.5 top-[55%] flex -translate-y-1/2 items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
      <span className={`h-1 w-7 rounded-full ${colorClass}`} />
    </div>
  );
}

function LockPlate({ handle }) {
  const isGold = handle?.finish === 'gold';
  return (
    <span
      className={`absolute right-2 top-[63%] block h-3.5 w-1.5 rounded-sm ${
        isGold ? 'bg-picard-gold/85' : 'bg-stone-300/85'
      }`}
    />
  );
}

function InteriorBolts() {
  return (
    <div className="absolute left-2 top-1/2 flex -translate-y-1/2 flex-col gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-stone-200/70" />
      ))}
    </div>
  );
}

function InteriorHandle({ handle }) {
  const isGold = handle?.finish === 'gold';
  return (
    <div className="absolute left-2.5 top-[55%] flex -translate-y-1/2 items-center gap-1">
      <span className={`h-1 w-7 rounded-full ${isGold ? 'bg-picard-gold' : 'bg-stone-200'}`} />
      <span className={`h-2.5 w-2.5 rounded-full ${isGold ? 'bg-picard-gold' : 'bg-stone-200'}`} />
    </div>
  );
}

function Accessories({ accessoryIds, view }) {
  if (view !== 'exterior') return null;
  return (
    <>
      {accessoryIds.includes('heurtoir') && (
        <span className="absolute left-1/2 top-[42%] h-3 w-6 -translate-x-1/2 rounded-full bg-picard-gold/85 shadow" />
      )}
      {accessoryIds.includes('numero') && (
        <span className="absolute left-3 top-3 rounded-sm bg-white/15 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-white/85">
          14B
        </span>
      )}
      {accessoryIds.includes('judas') && (
        <span className="absolute left-1/2 top-[28%] h-2 w-2 -translate-x-1/2 rounded-full bg-stone-200/70 ring-1 ring-black/40" />
      )}
      {accessoryIds.includes('plaque') && (
        <span className="absolute right-3 bottom-[28%] block h-3 w-9 rounded-[2px] bg-stone-200/80" />
      )}
    </>
  );
}

function finishStyle(finishId) {
  switch (finishId) {
    case 'mate':
      return { filter: 'saturate(0.92)' };
    case 'brillante':
      return {
        backgroundImage:
          'linear-gradient(140deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.20) 60%, rgba(0,0,0,0.18) 100%)',
        backgroundBlendMode: 'overlay',
      };
    case 'satinee':
    default:
      return {
        backgroundImage:
          'linear-gradient(150deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.10) 100%)',
        backgroundBlendMode: 'overlay',
      };
  }
}
