import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Download, Send, Share2, Star } from 'lucide-react';
import DoorCanvas from './DoorCanvas';
import SaveModal from './SaveModal';
import QuoteForm from './QuoteForm';
import ShareMenu from './ShareMenu';
import { accessories as ACCESSORIES } from '../data/accessories';
import { generatePdfFromElement } from '../utils/pdfGenerator';

export default function Summary({ state, selections, payload, onBack, onRestart }) {
  const summaryRef = useRef(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const summaryText = useMemo(() => buildSummaryText(state, selections), [state, selections]);

  const handleDownload = async () => {
    if (!summaryRef.current) return;
    setPdfLoading(true);
    try {
      await generatePdfFromElement(summaryRef.current, 'picard-configuration.pdf');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 lg:py-16">
      <div className="mb-8 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.28em] text-picard-navy/55">
          Étape 03 — Récapitulatif
        </span>
        <h2 className="font-display text-4xl text-picard-navy sm:text-5xl">
          Votre porte, en un coup d'œil.
        </h2>
      </div>

      <div ref={summaryRef} className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div>
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
            showHotspots={false}
          />
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
            <SummaryRow label="Décor" value={selections.decor?.name || (state.customPhoto ? 'Photo personnelle' : 'Non sélectionné')} />
            <SummaryRow label="Couleur" value={`${selections.color.name} (${selections.color.ral})`} />
            <SummaryRow label="Poignée" value={selections.handle.name} />
            <SummaryRow label="Vitrage" value={selections.glass.name} />
            <SummaryRow label="Finition" value={selections.finish.name} />
            <SummaryRow
              label="Accessoires"
              value={
                state.accessoryIds.length === 0
                  ? 'Aucun'
                  : state.accessoryIds
                      .map((id) => ACCESSORIES.find((a) => a.id === id)?.name)
                      .filter(Boolean)
                      .join(', ')
              }
            />
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
    `Couleur : ${selections.color.name} ${selections.color.ral}`,
    `Poignée : ${selections.handle.name}`,
    `Vitrage : ${selections.glass.name}`,
    `Finition : ${selections.finish.name}`,
  ];
  if (state.accessoryIds.length > 0) {
    const names = state.accessoryIds
      .map((id) => ACCESSORIES.find((a) => a.id === id)?.name)
      .filter(Boolean);
    lines.push(`Accessoires : ${names.join(', ')}`);
  }
  lines.push(`Prix indicatif : ${selections.door.price}`);
  return lines.join('\n');
}
