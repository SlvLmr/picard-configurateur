import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Compass } from 'lucide-react';
import {
  colors,
  finishes,
  accessoriesForDoor,
  handlesForDoor,
  glassesForDoor,
  panelsForDoor,
} from '../data';

const TABS = [
  { id: 'colors', label: 'Couleurs' },
  { id: 'panel', label: 'Panneau' },
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
  const [tab, setTab] = useState('colors');
  const door = selections.door;
  const availableHandles = handlesForDoor(door.id);
  const availableGlasses = glassesForDoor(door.id);
  const availableAccessories = accessoriesForDoor(door.id);
  const availablePanels = panelsForDoor(door.id);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-picard-navy/10 bg-white shadow-soft">
      <header className="flex items-center justify-between gap-3 border-b border-picard-navy/8 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-picard-navy/50">
            Modèle sélectionné
          </p>
          <p className="font-display text-2xl text-picard-navy">{door.name}</p>
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
            {tab === 'colors' && (
              <ColorsTab
                state={state}
                onChange={onChange}
              />
            )}
            {tab === 'panel' && (
              <OptionList
                items={availablePanels}
                selectedId={state.panelId}
                onSelect={(id) => onChange({ panelId: id })}
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

function ColorsTab({ state, onChange }) {
  const slots = [
    { key: 'doorColorExteriorId', label: 'Porte · extérieur' },
    { key: 'doorColorInteriorId', label: 'Porte · intérieur' },
    { key: 'frameColorExteriorId', label: 'Bâti · extérieur' },
    { key: 'frameColorInteriorId', label: 'Bâti · intérieur' },
  ];
  return (
    <div className="space-y-5">
      {slots.map((slot) => {
        const selectedId = state[slot.key];
        return (
          <div key={slot.key}>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-picard-navy/55">
              {slot.label}
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {colors.map((c) => {
                const selected = c.id === selectedId;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => onChange({ [slot.key]: c.id })}
                    title={`${c.name} · ${c.ral}`}
                    aria-label={`${slot.label} : ${c.name} ${c.ral}`}
                    className={`relative aspect-square overflow-hidden rounded-md border transition ${
                      selected
                        ? 'border-picard-gold ring-1 ring-picard-gold'
                        : 'border-picard-navy/12 hover:border-picard-navy/30'
                    }`}
                    style={{ background: c.hex }}
                  >
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check size={14} strokeWidth={3} color={c.textOn} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OptionList({ items, selectedId, onSelect }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-picard-navy/55">
        Aucune option disponible pour ce modèle.
      </p>
    );
  }
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
