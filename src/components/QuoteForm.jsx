import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2 } from 'lucide-react';

const PROJECT_TYPES = [
  'Maison individuelle',
  'Appartement',
  'Résidence secondaire',
  'Immeuble / collectivité',
];

const TIMELINES = ["Sous 1 mois", '1 à 3 mois', '3 à 6 mois', 'Plus tard'];

export default function QuoteForm({ open, onClose, configurationSummary }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    projectType: PROJECT_TYPES[0],
    timeline: TIMELINES[0],
  });

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      'form-name': 'devis',
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      postalCode: form.postalCode,
      projectType: form.projectType,
      timeline: form.timeline,
      configuration: configurationSummary || '',
    };
    const body = new URLSearchParams(payload).toString();
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!response.ok) throw new Error(`Netlify Forms HTTP ${response.status}`);
      setSubmitted(true);
    } catch (err) {
      // Fallback when not deployed on Netlify (or offline): open the user's
      // mail client with a pre-filled message.
      const subject = `Demande de devis Picard — ${form.firstName} ${form.lastName}`;
      const lines = [
        'Bonjour,',
        '',
        'Je souhaite recevoir un devis pour ma porte Picard.',
        '',
        '— Coordonnées',
        `${form.firstName} ${form.lastName}`,
        form.email,
        form.phone,
        `Code postal : ${form.postalCode}`,
        '',
        '— Projet',
        `Type : ${form.projectType}`,
        `Délai : ${form.timeline}`,
        '',
        '— Configuration',
        configurationSummary || '(non précisée)',
      ];
      const href = `mailto:contact@picard-serrures.com?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(lines.join('\n'))}`;
      window.location.href = href;
      setSubmitted(true);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-picard-navy/55 p-4 backdrop-blur"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl bg-picard-cream p-7 shadow-soft"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 rounded-full p-1.5 text-picard-navy/55 hover:text-picard-navy"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            {submitted ? (
              <div className="text-center">
                <CheckCircle2 size={36} className="mx-auto text-picard-gold" />
                <h3 className="mt-3 font-display text-3xl text-picard-navy">Demande envoyée.</h3>
                <p className="mt-2 text-sm leading-relaxed text-picard-navy/65">
                  Votre client mail s'est ouvert avec le récapitulatif. Si rien n'apparaît, écrivez-nous
                  directement à <strong>contact@picard-serrures.com</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-picard-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-picard-cream transition hover:bg-black"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">Devis</p>
                <h3 className="mt-1 font-display text-3xl text-picard-navy">
                  Parlons de votre projet.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-picard-navy/65">
                  Un conseiller Picard vous recontacte sous 48 h pour établir un devis précis.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Prénom" value={form.firstName} onChange={handleChange('firstName')} required />
                  <Field label="Nom" value={form.lastName} onChange={handleChange('lastName')} required />
                  <Field label="Email" type="email" value={form.email} onChange={handleChange('email')} required />
                  <Field label="Téléphone" type="tel" value={form.phone} onChange={handleChange('phone')} />
                  <Field label="Code postal" value={form.postalCode} onChange={handleChange('postalCode')} />
                  <SelectField
                    label="Type de projet"
                    value={form.projectType}
                    onChange={handleChange('projectType')}
                    options={PROJECT_TYPES}
                  />
                  <SelectField
                    label="Délai souhaité"
                    value={form.timeline}
                    onChange={handleChange('timeline')}
                    options={TIMELINES}
                  />
                </div>
                <button
                  type="submit"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-picard-red px-6 py-3 text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[#A00D24]"
                >
                  <Send size={14} />
                  Envoyer ma demande
                </button>
                <p className="mt-3 text-[11px] leading-relaxed text-picard-navy/50">
                  Vos données sont uniquement utilisées pour traiter votre demande. Aucun message
                  marketing sans votre accord.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-picard-navy/60">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1 w-full rounded-lg border border-picard-navy/15 bg-white px-3 py-2.5 text-sm text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-picard-navy/60">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        className="mt-1 w-full appearance-none rounded-lg border border-picard-navy/15 bg-white px-3 py-2.5 text-sm text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}
