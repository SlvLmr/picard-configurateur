import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Compass, Image as ImageIcon, Camera } from 'lucide-react';
import {
  colors,
  finishes,
  decorsForDoor,
  accessoriesForDoor,
  handlesForDoor,
  glassesForDoor,
} from '../data';
import PhotoUploader from './PhotoUploader';
import { resolveDecorImage } from '../utils/assets';

const TABS = [
  { id: 'decor', label: 'Décor' },
  { id: 'color', label: 'Couleur' },
  { id: 'handle', label: 'Poignée' },
  { id: 'glass', label: 'Vitrage' },
  { id: 'accessories', label: 'Accessoires' },
  { id: 'finish', label: 'Finition' },
];

export default function PersonalizationPanel({
  state,
  selections,
  onChange,
  onToggleAccessory,
  onStartTour,
}) {
  const [tab, setTab] = useState('decor');
  const doorId = selections.door.id;
  const availableDecors = decorsForDoor(doorId);
  const availableHandles = handlesForDoor(doorId);
  const availableGlasses = glassesForDoor(doorId);
  const availableAccessories = accessoriesForDoor(doorId);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-picard-navy/10 bg-white shadow-soft">
      <header className="flex items-center justify-between gap-3 border-b border-picard-navy/8 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-picard-navy/50">
            Modèle sélectionné
          </p>
          <p className="font-display text-2xl text-picard-navy">{selections.door.name}</p>
        </div>
        <button
          type="button"
          onClick={onStartTour}
          className="hidden items-center gap-2 rounded-full border border-picard-navy/15 px-3 py-1.5 text-xs font-medium text-picard-navy transition hover:border-picard-navy/35 sm:inline-flex"
        >
          <Compass size={14} />
          Visite guidée
        </button>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-picard-navy/8 px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              tab === t.id
                ? 'bg-picard-navy text-picard-cream'
                : 'text-picard-navy/65 hover:text-picard-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === 'decor' && (
              <DecorTab
                decors={availableDecors}
                decorId={state.decorId}
                customPhoto={state.customPhoto}
                onSelectDecor={(id) => onChange({ decorId: id, customPhoto: null })}
                onUploadPhoto={(photo) => onChange({ customPhoto: photo, decorId: null })}
              />
            )}
            {tab === 'color' && (
              <Swatches
                items={colors}
                selectedId={state.colorId}
                onSelect={(id) => onChange({ colorId: id })}
                renderSwatch={(c) => (
                  <span
                    className="block h-full w-full"
                    style={{ background: c.hex }}
                    aria-label={`${c.name} ${c.ral}`}
                  />
                )}
                meta={(c) => `${c.name} · ${c.ral}`}
              />
            )}
            {tab === 'handle' && (
              <OptionList
                items={availableHandles}
                selectedId={state.handleId}
                onSelect={(id) => onChange({ handleId: id })}
              />
            )}
            {tab === 'glass' && (
              <OptionList
                items={availableGlasses}
                selectedId={state.glassId}
                onSelect={(id) => onChange({ glassId: id })}
              />
            )}
            {tab === 'accessories' && (
              <div className="space-y-2.5">
                {availableAccessories.map((acc) => {
                  const checked = state.accessoryIds.includes(acc.id);
                  return (
                    <button
                      type="button"
                      key={acc.id}
                      onClick={() => onToggleAccessory(acc.id)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                        checked
                          ? 'border-picard-gold bg-amber-50/50'
                          : 'border-picard-navy/12 bg-white hover:border-picard-navy/25'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border ${
                          checked
                            ? 'border-picard-gold bg-picard-gold text-white'
                            : 'border-picard-navy/25'
                        }`}
                      >
                        {checked && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-picard-navy">{acc.name}</span>
                        <span className="block text-xs text-picard-navy/60">{acc.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {tab === 'finish' && (
              <OptionList
                items={finishes}
                selectedId={state.finishId}
                onSelect={(id) => onChange({ finishId: id })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Swatches({ items, selectedId, onSelect, renderSwatch, meta }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((c) => {
        const selected = c.id === selectedId;
        return (
          <button
            type="button"
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex flex-col items-stretch gap-2 rounded-xl border p-2 transition ${
              selected
                ? 'border-picard-gold ring-1 ring-picard-gold'
                : 'border-picard-navy/10 hover:border-picard-navy/25'
            }`}
          >
            <span className="relative block aspect-square overflow-hidden rounded-lg shadow-inner">
              {renderSwatch(c)}
              {selected && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-picard-gold text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </span>
            <span className="block text-[11px] leading-tight text-picard-navy/70">{meta(c)}</span>
          </button>
        );
      })}
    </div>
  );
}

function DecorTab({ decors, decorId, customPhoto, onSelectDecor, onUploadPhoto }) {
  const [mode, setMode] = useState(customPhoto ? 'photo' : 'gallery');

  return (
    <div>
      <div className="mb-3 inline-flex rounded-full border border-picard-navy/12 bg-stone-50 p-0.5">
        <button
          type="button"
          onClick={() => setMode('gallery')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            mode === 'gallery'
              ? 'bg-picard-navy text-picard-cream'
              : 'text-picard-navy/65 hover:text-picard-navy'
          }`}
        >
          <ImageIcon size={13} />
          Galerie
        </button>
        <button
          type="button"
          onClick={() => setMode('photo')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            mode === 'photo'
              ? 'bg-picard-navy text-picard-cream'
              : 'text-picard-navy/65 hover:text-picard-navy'
          }`}
        >
          <Camera size={13} />
          Ma photo
        </button>
      </div>

      {mode === 'gallery' ? (
        <div className="grid grid-cols-2 gap-2.5">
          {decors.map((decor) => {
            const selected = decor.id === decorId;
            const resolvedImage = resolveDecorImage(decor.imageUrl);
            return (
              <button
                type="button"
                key={decor.id}
                onClick={() => onSelectDecor(decor.id)}
                className={`group relative overflow-hidden rounded-xl text-left transition ${
                  selected ? 'ring-2 ring-picard-gold ring-offset-2 ring-offset-white' : ''
                }`}
              >
                <div className={`relative aspect-[4/5] w-full bg-gradient-to-br ${decor.gradient}`}>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 30% 30%, ${decor.accent} 0%, transparent 60%), radial-gradient(circle at 75% 80%, ${decor.accent} 0%, transparent 55%)`,
                    }}
                  />
                  {!resolvedImage && (
                    <div className="absolute inset-x-3 bottom-10 top-3 rounded border border-white/30 bg-white/15 backdrop-blur-[1px]" />
                  )}
                  {resolvedImage && (
                    <img
                      src={resolvedImage}
                      alt={decor.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent p-2">
                  <p className="text-[11px] font-medium leading-tight text-white">{decor.name}</p>
                </div>
                {selected && (
                  <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-picard-gold text-white shadow">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <PhotoUploader photo={customPhoto} onChange={onUploadPhoto} />
      )}
    </div>
  );
}

function OptionList({ items, selectedId, onSelect }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
              selected
                ? 'border-picard-gold bg-amber-50/50'
                : 'border-picard-navy/12 bg-white hover:border-picard-navy/25'
            }`}
          >
            <span>
              <span className="block text-sm font-medium text-picard-navy">{item.name}</span>
              {item.description && (
                <span className="block text-xs text-picard-navy/60">{item.description}</span>
              )}
            </span>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                selected ? 'border-picard-gold bg-picard-gold text-white' : 'border-picard-navy/25'
              }`}
            >
              {selected && <Check size={13} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
