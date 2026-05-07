import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Camera, Check, Download, Image as ImageIcon, Send, Share2, Star } from 'lucide-react';
import DoorCanvas from './DoorCanvas';
import PhotoUploader from './PhotoUploader';
import SaveModal from './SaveModal';
import QuoteForm from './QuoteForm';
import ShareMenu from './ShareMenu';
import { accessories as ACCESSORIES, ambiancesForDoor } from '../data';
import { resolveAmbianceImage } from '../utils/assets';
import { generatePdfFromElement } from '../utils/pdfGenerator';

export default function Summary({ state, selections, payload, onChange, onBack, onRestart }) {
  const summaryRef = useRef(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);

  const summaryText = useMemo(() => buildSummaryText(state, selections), [state, selections]);
  const compatibleAmbiances = useMemo(() => ambiancesForDoor(selections.door), [selections.door]);

  const handleDownload = async () => {
    if (!summaryRef.current) return;
    setPdfLoading(true);
    try {
      await generatePdfFromElement(summaryRef.current, 'picard-configuration.pdf');
    } finally {
      setPdfLoading(false);
    }
  };

  const accessoriesValue =
    state.accessoryIds.length === 0
      ? 'Aucun'
      : state.accessoryIds
          .map((id) => ACCESSORIES.find((a) => a.id === id)?.name)
          .filter(Boolean)
          .join(', ');

  const isCustomPhotoActive = !!state.customPhoto;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 lg:py-16">
      <div className="mb-8 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.28em] text-picard-navy/55">
          Étape 02 — Récapitulatif
        </span>
        <h2 className="font-display text-4xl text-picard-navy sm:text-5xl">
          Votre porte, en un coup d'œil.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-picard-navy/65">
          Visualisez votre configuration dans différentes ambiances ou sur votre propre façade.
        </p>
      </div>

      <div ref={summaryRef} className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-4">
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
            showHotspots={false}
          />

          <AmbianceStrip
            ambiances={compatibleAmbiances}
            selectedAmbianceId={isCustomPhotoActive ? null : state.ambianceId}
            isCustomPhotoActive={isCustomPhotoActive}
            onSelectAmbiance={(id) => onChange({ ambianceId: id, customPhoto: null })}
            onPickPhoto={() => setShowPhotoUploader(true)}
          />

          {showPhotoUploader && (
            <PhotoUploader
              photo={state.customPhoto}
              onChange={(photo) => {
                onChange({ customPhoto: photo, ambianceId: photo ? null : state.ambianceId });
                if (!photo) setShowPhotoUploader(false);
              }}
            />
          )}
        </div>
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col rounded-3xl border border-picard-navy/10 bg-white p-7 shadow-soft"
        >
          <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">Édition signée</p>
          <h3 className="mt-1 font-display text-4xl text-picard-navy">{selections.door.name}</h3>
          <p className="mt-1 text-sm text-picard-navy/65">
            Gamme {selections.door.range}
            <span className="ml-2 inline-flex items-center gap-0.5 align-middle">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={11}
                  strokeWidth={1.5}
                  className={
                    n <= selections.door.security
                      ? 'fill-picard-gold text-picard-gold'
                      : 'text-picard-navy/20'
                  }
                />
              ))}
            </span>
          </p>

          <dl className="mt-6 grid grid-cols-1 gap-3 text-sm">
            <SummaryRow label="Panneau" value={selections.panel.name} />
            <SummaryRow label="Porte · ext." value={`${selections.doorColorExterior.name} (${selections.doorColorExterior.ral})`} />
            <SummaryRow label="Porte · int." value={`${selections.doorColorInterior.name} (${selections.doorColorInterior.ral})`} />
            <SummaryRow label="Bâti · ext." value={`${selections.frameColorExterior.name} (${selections.frameColorExterior.ral})`} />
            <SummaryRow label="Bâti · int." value={`${selections.frameColorInterior.name} (${selections.frameColorInterior.ral})`} />
            <SummaryRow label="Poignée" value={selections.handle.name} />
            <SummaryRow label="Vitrage" value={selections.glass.name} />
            <SummaryRow label="Finition" value={selections.finish.name} />
            <SummaryRow label="Accessoires" value={accessoriesValue} />
          </dl>

          <div className="mt-6 border-t border-picard-navy/10 pt-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-picard-navy/50">
              Prix indicatif
            </p>
            <p className="font-display text-5xl text-picard-navy">{selections.door.price}</p>
            <p className="mt-1 text-xs text-picard-navy/55">
              Hors pose. Le prix final dépend des dimensions, options et conditions de pose.
            </p>
          </div>
        </motion.aside>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionButton onClick={() => setSaveOpen(true)} icon={Bookmark} label="Sauvegarder" hint="Code à 6 caractères" />
        <ActionButton onClick={() => setQuoteOpen(true)} icon={Send} label="Demander un devis" hint="Réponse sous 48 h" primary />
        <ActionButton onClick={handleDownload} icon={Download} label={pdfLoading ? 'Génération…' : 'Télécharger PDF'} hint="Récapitulatif imprimable" />
        <ActionButton onClick={() => setShareOpen(true)} icon={Share2} label="Partager" hint="Email, WhatsApp, lien" />
      </div>

      <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-picard-navy/20 px-5 py-2.5 text-sm font-medium text-picard-navy transition hover:border-picard-navy/40"
        >
          <ArrowLeft size={16} />
          Retour à la personnalisation
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="text-sm font-medium uppercase tracking-[0.18em] text-picard-navy/55 transition hover:text-picard-navy"
        >
          Recommencer une configuration
        </button>
      </div>

      <SaveModal open={saveOpen} onClose={() => setSaveOpen(false)} payload={payload} />
      <QuoteForm
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        configurationSummary={summaryText}
      />
      <ShareMenu open={shareOpen} onClose={() => setShareOpen(false)} summaryText={summaryText} />
    </div>
  );
}

function AmbianceStrip({ ambiances, selectedAmbianceId, isCustomPhotoActive, onSelectAmbiance, onPickPhoto }) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-picard-navy/55">
        Visualiser dans une ambiance
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        <PhotoPickerThumb active={isCustomPhotoActive} onClick={onPickPhoto} />
        {ambiances.map((ambiance) => (
          <AmbianceThumb
            key={ambiance.id}
            ambiance={ambiance}
            active={!isCustomPhotoActive && ambiance.id === selectedAmbianceId}
            onClick={() => onSelectAmbiance(ambiance.id)}
          />
        ))}
        {ambiances.length === 0 && (
          <p className="px-3 py-4 text-xs text-picard-navy/55">
            Aucune ambiance disponible pour ce modèle.
          </p>
        )}
      </div>
    </div>
  );
}

function AmbianceThumb({ ambiance, active, onClick }) {
  const resolved = resolveAmbianceImage(ambiance.imageUrl);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border transition ${
        active
          ? 'border-picard-gold ring-2 ring-picard-gold ring-offset-2 ring-offset-picard-cream'
          : 'border-picard-navy/12 hover:border-picard-navy/30'
      }`}
      title={ambiance.name}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${ambiance.gradient}`}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, ${ambiance.accent} 0%, transparent 60%)`,
          }}
        />
      </div>
      {resolved && (
        <img src={resolved} alt={ambiance.name} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2 py-1.5 text-left text-[10px] font-medium leading-tight text-white">
        {ambiance.name}
      </span>
      {active && (
        <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-picard-gold text-white">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function PhotoPickerThumb({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-20 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition ${
        active
          ? 'border-picard-gold bg-amber-50/50 text-picard-navy'
          : 'border-picard-navy/25 bg-stone-50 text-picard-navy/65 hover:border-picard-navy/40 hover:text-picard-navy'
      }`}
    >
      <Camera size={16} strokeWidth={1.5} />
      <span className="text-[10px] font-medium uppercase tracking-[0.16em]">Ma photo</span>
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-picard-navy/8 pb-2 last:border-none">
      <dt className="text-[10px] uppercase tracking-[0.22em] text-picard-navy/50">{label}</dt>
      <dd className="text-right text-sm text-picard-navy">{value}</dd>
    </div>
  );
}

function ActionButton({ icon: Icon, label, hint, onClick, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-2xl border p-4 text-left transition ${
        primary
          ? 'border-picard-red bg-picard-red text-white hover:bg-[#A00D24]'
          : 'border-picard-navy/12 bg-white text-picard-navy hover:border-picard-navy/30'
      }`}
    >
      <span className="flex items-center justify-between">
        <Icon size={18} strokeWidth={1.6} />
        <span className="text-[10px] uppercase tracking-[0.22em] opacity-70">{label}</span>
      </span>
      <span className="font-display text-lg leading-tight">
        {primary ? 'Recevoir mon devis' : label}
      </span>
      <span className="text-xs opacity-75">{hint}</span>
    </button>
  );
}

function buildSummaryText(state, selections) {
  const lines = [
    `Modèle : ${selections.door.name} (${selections.door.range})`,
    `Panneau : ${selections.panel.name}`,
    `Porte ext. : ${selections.doorColorExterior.name} ${selections.doorColorExterior.ral}`,
    `Porte int. : ${selections.doorColorInterior.name} ${selections.doorColorInterior.ral}`,
    `Bâti ext. : ${selections.frameColorExterior.name} ${selections.frameColorExterior.ral}`,
    `Bâti int. : ${selections.frameColorInterior.name} ${selections.frameColorInterior.ral}`,
    `Poignée : ${selections.handle.name}`,
    `Vitrage : ${selections.glass.name}`,
    `Finition : ${selections.finish.name}`,
  ];
  if (selections.ambiance) {
    lines.unshift(`Ambiance : ${selections.ambiance.name}`);
  }
  if (state.accessoryIds.length > 0) {
    const names = state.accessoryIds
      .map((id) => ACCESSORIES.find((a) => a.id === id)?.name)
      .filter(Boolean);
    lines.push(`Accessoires : ${names.join(', ')}`);
  }
  lines.push(`Prix indicatif : ${selections.door.price}`);
  return lines.join('\n');
}
