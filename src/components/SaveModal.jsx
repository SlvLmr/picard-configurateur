import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Mail, X, Check } from 'lucide-react';
import { generateCode } from '../utils/codeGenerator';
import { saveConfiguration } from '../utils/localStorage';

export default function SaveModal({ open, onClose, payload }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !email.includes('@')) {
      setError("Renseignez un email valide pour récupérer votre configuration.");
      return;
    }
    const newCode = generateCode();
    const saved = saveConfiguration(newCode, email, payload);
    if (!saved) {
      setError("Stockage indisponible dans ce navigateur. Activez le stockage local pour continuer.");
      return;
    }
    setCode(newCode);
  };

  const handleClose = () => {
    setEmail('');
    setCode(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      // ignore clipboard failures
    }
  };

  const mailtoHref = code
    ? `mailto:?subject=${encodeURIComponent(
        'Ma configuration Picard',
      )}&body=${encodeURIComponent(
        `Voici le code de ma configuration Picard : ${code}\n\nÀ saisir sur https://slvlmr.github.io/picard-configurateur/ pour la retrouver (valable 30 jours, sur ce navigateur).`,
      )}`
    : '#';

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

            {!code ? (
              <form onSubmit={handleSave}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">
                  Sauvegarder
                </p>
                <h3 className="mt-1 font-display text-3xl text-picard-navy">
                  Conservez votre configuration.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-picard-navy/65">
                  Recevez un code à 6 caractères pour reprendre votre projet plus tard. Valable 30
                  jours, sur ce navigateur.
                </p>
                <label className="mt-5 block text-xs font-medium uppercase tracking-[0.18em] text-picard-navy/60">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.fr"
                  className="mt-1.5 w-full rounded-lg border border-picard-navy/15 bg-white px-3.5 py-2.5 text-sm text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
                />
                {error && (
                  <p className="mt-2 text-xs text-picard-red">{error}</p>
                )}
                <button
                  type="submit"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-picard-navy px-6 py-3 text-sm font-medium uppercase tracking-[0.16em] text-picard-cream transition hover:bg-black"
                >
                  Générer mon code
                </button>
                <p className="mt-3 text-[11px] leading-relaxed text-picard-navy/50">
                  La sauvegarde fonctionne uniquement sur ce navigateur. Pensez à vous envoyer le
                  code par email pour le retrouver depuis un autre appareil.
                </p>
              </form>
            ) : (
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">
                  Code généré
                </p>
                <h3 className="mt-1 font-display text-3xl text-picard-navy">Configuration sauvegardée.</h3>
                <p className="mt-2 text-sm leading-relaxed text-picard-navy/65">
                  Notez ce code, il vous suffira pour retrouver votre projet.
                </p>
                <div className="mt-6 rounded-2xl border border-picard-gold/40 bg-white px-6 py-5">
                  <p className="font-display text-5xl tracking-[0.18em] text-picard-navy">{code}</p>
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-picard-navy/15 bg-white px-4 py-2.5 text-sm font-medium text-picard-navy transition hover:border-picard-navy/35"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                  <a
                    href={mailtoHref}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-picard-navy px-4 py-2.5 text-sm font-medium text-picard-cream transition hover:bg-black"
                  >
                    <Mail size={14} />
                    M'envoyer le code
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
