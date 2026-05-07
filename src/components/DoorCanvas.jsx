import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
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
    onViewChange,
    showHotspots,
    activeHotspotId,
    onHotspotChange,
    inStudio = false,
  },
  ref,
) {
  const sceneStyle = useMemo(() => {
    if (inStudio) return null;
    if (customPhoto) {
      return { backgroundImage: `url(${customPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return null;
  }, [customPhoto, inStudio]);

  const hotspots = door?.hotspots || [];
  const ambianceImage = inStudio ? null : resolveAmbianceImage(ambiance?.imageUrl);
  const overRealPhoto = !inStudio && (!!customPhoto || !!ambianceImage);
  const interactive = !!showHotspots;

  // Drag-to-position the door overlay onto the photo, with simple zoom.
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const drag = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  // Reset position/scale when the underlying photo or door changes.
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  }, [customPhoto, ambiance?.id, door?.id]);

  const onPointerDown = (e) => {
    if (!interactive || !overRealPhoto) return;
    if (e.target.closest('[data-hotspot]')) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: position.x,
      baseY: position.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    setPosition({ x: drag.current.baseX + dx, y: drag.current.baseY + dy });
  };
  const onPointerUp = (e) => {
    drag.current.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };
  const reset = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };
  const bumpScale = (delta) => setScale((s) => Math.max(0.5, Math.min(1.6, +(s + delta).toFixed(2))));

  return (
    <div
      ref={ref}
      className="relative isolate overflow-hidden rounded-3xl border border-picard-navy/10 bg-stone-100 editorial-shadow"
    >
      <SceneBackdrop ambiance={ambiance} sceneStyle={sceneStyle} view={view} inStudio={inStudio} />

      <div className="relative aspect-[4/5] w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`relative h-[86%] w-[60%] rounded-md ${overRealPhoto ? 'p-[3px]' : 'p-[5px]'} ${
              interactive && overRealPhoto ? 'cursor-move touch-none' : ''
            }`}
            style={{
              background: frameColor?.hex || '#1A1A2E',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center',
              transition: drag.current.active ? 'none' : 'transform 0.15s ease-out',
              filter: overRealPhoto ? 'drop-shadow(0 14px 30px rgba(0,0,0,0.45))' : 'none',
            }}
          >
            <DoorGraphic
              door={door}
              doorColor={doorColor}
              handle={handle}
              glass={glass}
              finish={finish}
              accessoryIds={accessoryIds}
              view={view}
              overRealPhoto={overRealPhoto}
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

      {onViewChange ? (
        <div className="absolute right-4 top-4 z-20 inline-flex items-center rounded-full border border-white/45 bg-white/85 p-1 shadow-sm backdrop-blur">
          {[
            { id: 'exterior', label: 'Extérieur' },
            { id: 'interior', label: 'Intérieur' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onViewChange(opt.id)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                view === opt.id
                  ? 'bg-picard-navy text-picard-cream shadow-sm'
                  : 'text-picard-navy/60 hover:text-picard-navy'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/65 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-picard-navy/75 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-picard-gold" />
          {view === 'exterior' ? 'Extérieur' : 'Intérieur'}
        </div>
      )}

      {interactive && overRealPhoto && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/40 bg-white/85 px-2 py-1 text-picard-navy backdrop-blur">
          <button
            type="button"
            onClick={() => bumpScale(-0.05)}
            className="rounded-full p-1.5 transition hover:bg-picard-navy/10"
            aria-label="Réduire la porte"
            title="Réduire"
          >
            <Minus size={14} />
          </button>
          <span className="px-2 text-[11px] font-medium tabular-nums">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => bumpScale(0.05)}
            className="rounded-full p-1.5 transition hover:bg-picard-navy/10"
            aria-label="Agrandir la porte"
            title="Agrandir"
          >
            <Plus size={14} />
          </button>
          <span className="mx-1 h-4 w-px bg-picard-navy/15" />
          <button
            type="button"
            onClick={reset}
            className="rounded-full p-1.5 transition hover:bg-picard-navy/10"
            aria-label="Réinitialiser la position"
            title="Recentrer"
          >
            <RotateCcw size={14} />
          </button>
          <span className="px-2 text-[10px] uppercase tracking-[0.18em] text-picard-navy/55">
            <span className="hidden sm:inline">Glisser pour positionner</span>
            <span className="sm:hidden">Glisser</span>
          </span>
        </div>
      )}
    </div>
  );
});

export default DoorCanvas;

function StudioBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Off-white neutral base */}
      <div className="absolute inset-0 bg-[#F5F5F7]" />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(60,60,67,0.08) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Top ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% -10%, rgba(255,255,255,0.85), transparent 55%)',
        }}
      />

      {/* Soft floor shadow under product */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45%]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(60,60,67,0.14), transparent 65%)',
        }}
      />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 60%, rgba(60,60,67,0.06) 100%)',
        }}
      />
    </div>
  );
}

function SceneBackdrop({ ambiance, sceneStyle, view, inStudio }) {
  if (inStudio) {
    return <StudioBackdrop />;
  }
  if (sceneStyle) {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={sceneStyle} />
        <div className="absolute inset-0 bg-black/15" />
      </div>
    );
  }
  if (!ambiance) {
    return <StudioBackdrop />;
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

function DoorGraphic({ door, doorColor, handle, glass, finish, accessoryIds, view, overRealPhoto }) {
  const finishOverlay = finishStyle(finish?.id);
  const baseShadow = overRealPhoto
    ? 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.18)'
    : '0 30px 60px -25px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.25)';
  return (
    <motion.div
      key={`${door.id}-${doorColor.id}-${finish.id}-${view}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-full w-full rounded-md"
      style={{
        background: doorColor?.hex || '#1A1A2E',
        boxShadow: baseShadow,
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
