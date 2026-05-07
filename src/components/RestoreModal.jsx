import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { loadConfiguration } from '../utils/localStorage';

export default function RestoreModal({ open, onClose, onRestored }) {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const result = loadConfiguration(code, email);
    if (result.status === 'ok') {
      onRestored(result.data.configuration);
      handleClose();
      return;
    }
    if (result.status === 'not_found') {
      setError('Code introuvable. Vérifiez la saisie ou utilisez le navigateur de la sauvegarde.');
      return;
    }
    if (result.status === 'expired') {
      setError('Ce code a expiré (30 jours).');
      return;
    }
    if (result.status === 'email_mismatch') {
      setError("L'email ne correspond pas à celui de la sauvegarde.");
      return;
    }
    if (result.status === 'unavailable') {
      setError('Stockage local indisponible dans ce navigateur.');
      return;
    }
    setError('Données illisibles. Recommencez la configuration.');
  };

  const handleClose = () => {
    setCode('');
    setEmail('');
    setError(null);
    onClose();
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
          <motion.form
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="relative w-full max-w-md rounded-2xl bg-picard-cream p-7 shadow-soft"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 rounded-full p-1.5 text-picard-navy/55 hover:text-picard-navy"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
            <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">Reprendre</p>
            <h3 className="mt-1 font-display text-3xl text-picard-navy">Retrouvez votre projet.</h3>
            <p className="mt-2 text-sm leading-relaxed text-picard-navy/65">
              Saisissez le code à 6 caractères et l'email associés à votre sauvegarde. Fonctionne
              uniquement sur le navigateur d'origine.
            </p>
            <label className="mt-5 block text-xs font-medium uppercase tracking-[0.18em] text-picard-navy/60">
              Code de configuration
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
              placeholder="ABCDEF"
              className="mt-1.5 w-full rounded-lg border border-picard-navy/15 bg-white px-3.5 py-2.5 font-display text-2xl tracking-[0.18em] text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
            />
            <label className="mt-4 block text-xs font-medium uppercase tracking-[0.18em] text-picard-navy/60">
              Email associé
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.fr"
              className="mt-1.5 w-full rounded-lg border border-picard-navy/15 bg-white px-3.5 py-2.5 text-sm text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
            />
            {error && <p className="mt-3 text-xs text-picard-red">{error}</p>}
            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-picard-navy px-6 py-3 text-sm font-medium uppercase tracking-[0.16em] text-picard-cream transition hover:bg-black"
            >
              Restaurer ma configuration
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
