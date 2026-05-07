import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Image as ImageIcon, Camera } from 'lucide-react';
import { decors, DECOR_TYPES, DECOR_CATEGORIES } from '../data/decors';
import PhotoUploader from './PhotoUploader';

export default function DecorGallery({ decorId, customPhoto, onSelectDecor, onUploadPhoto, onContinue }) {
  const [mode, setMode] = useState('gallery'); // 'gallery' | 'photo'
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    return decors.filter((d) => {
      const typeOk = type === 'all' || d.type === type;
      const categoryOk = category === 'all' || d.category === category;
      return typeOk && categoryOk;
    });
  }, [type, category]);

  const canContinue = (mode === 'gallery' && decorId) || (mode === 'photo' && customPhoto);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 lg:py-16">
      <div className="mb-10 flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.28em] text-picard-navy/55">
          Étape 01 — Décor
        </span>
        <h2 className="font-display text-4xl text-picard-navy sm:text-5xl">
          Choisissez la scène qui inspire votre projet.
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-picard-navy/65">
          Sélectionnez l'un de nos décors d'inspiration, ou téléchargez une photo de votre propre
          façade pour une projection sur mesure.
        </p>
      </div>

      <div className="mb-8 inline-flex rounded-full border border-picard-navy/15 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode('gallery')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
            mode === 'gallery'
              ? 'bg-picard-navy text-picard-cream'
              : 'text-picard-navy/70 hover:text-picard-navy'
          }`}
        >
          <ImageIcon size={16} />
          Galerie d'inspiration
        </button>
        <button
          type="button"
          onClick={() => setMode('photo')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
            mode === 'photo'
              ? 'bg-picard-navy text-picard-cream'
              : 'text-picard-navy/70 hover:text-picard-navy'
          }`}
        >
          <Camera size={16} />
          Ma propre photo
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'gallery' ? (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <FilterGroup label="Type" value={type} onChange={setType} options={DECOR_TYPES} />
              <FilterGroup label="Lieu" value={category} onChange={setCategory} options={DECOR_CATEGORIES} />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((decor, idx) => {
                const selected = decor.id === decorId;
                return (
                  <motion.button
                    key={decor.id}
                    type="button"
                    onClick={() => onSelectDecor(decor.id)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 }}
                    className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-300 ease-editorial ${
                      selected ? 'ring-2 ring-picard-gold ring-offset-2 ring-offset-picard-cream' : ''
                    }`}
                  >
                    <DecorTile decor={decor} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-4">
                      <p className="font-display text-lg leading-snug text-white">{decor.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/75">
                        {decor.style}
                      </p>
                    </div>
                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-picard-gold text-white shadow-soft"
                        >
                          <Check size={16} strokeWidth={2.5} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="mt-10 text-center text-sm text-picard-navy/55">
                Aucun décor ne correspond à ces filtres.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="photo"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <PhotoUploader photo={customPhoto} onChange={onUploadPhoto} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="inline-flex items-center gap-3 rounded-full bg-picard-navy px-7 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-picard-cream transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-black"
        >
          Choisir mon modèle
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function FilterGroup({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.24em] text-picard-navy/45">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              value === opt.id
                ? 'bg-picard-navy text-picard-cream'
                : 'border border-picard-navy/15 bg-white text-picard-navy/70 hover:border-picard-navy/35'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DecorTile({ decor }) {
  if (decor.imageUrl) {
    return (
      <div className="relative aspect-[4/5] w-full">
        <img
          src={decor.imageUrl}
          alt={decor.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
        />
      </div>
    );
  }
  return (
    <div className={`relative aspect-[4/5] w-full bg-gradient-to-br ${decor.gradient}`}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 30%, ${decor.accent} 0%, transparent 60%), radial-gradient(circle at 75% 80%, ${decor.accent} 0%, transparent 55%)`,
        }}
      />
      <div className="absolute inset-x-6 bottom-24 top-12 rounded-lg border border-white/30 bg-white/15 backdrop-blur-[2px]" />
      <span className="absolute left-4 top-4 text-[10px] uppercase tracking-[0.24em] text-picard-navy/55">
        {decor.type === 'exterior' ? 'Extérieur' : 'Intérieur'}
      </span>
    </div>
  );
}
