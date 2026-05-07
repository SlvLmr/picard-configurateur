import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageCircle, Link2, Share2, Check, X } from 'lucide-react';

export default function ShareMenu({ open, onClose, summaryText }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const subject = 'Ma configuration de porte Picard';
  const body = `${summaryText}\n\n${url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: subject, text: summaryText, url });
        onClose();
      } catch (err) {
        // user cancelled
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-picard-navy/55 p-4 backdrop-blur sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl bg-picard-cream p-6 shadow-soft"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-1.5 text-picard-navy/55 hover:text-picard-navy"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
            <p className="text-[10px] uppercase tracking-[0.24em] text-picard-gold">Partager</p>
            <h3 className="mt-1 font-display text-2xl text-picard-navy">Envoyez votre projet.</h3>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                className="flex items-center gap-2 rounded-xl border border-picard-navy/12 bg-white px-3 py-3 text-sm font-medium text-picard-navy transition hover:border-picard-navy/25"
                href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              >
                <Mail size={16} /> Email
              </a>
              <a
                className="flex items-center gap-2 rounded-xl border border-picard-navy/12 bg-white px-3 py-3 text-sm font-medium text-picard-navy transition hover:border-picard-navy/25"
                href={`https://wa.me/?text=${encodeURIComponent(body)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-xl border border-picard-navy/12 bg-white px-3 py-3 text-sm font-medium text-picard-navy transition hover:border-picard-navy/25"
              >
                {copied ? <Check size={16} /> : <Link2 size={16} />}
                {copied ? 'Lien copié' : 'Copier le lien'}
              </button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center gap-2 rounded-xl border border-picard-navy/12 bg-white px-3 py-3 text-sm font-medium text-picard-navy transition hover:border-picard-navy/25"
                >
                  <Share2 size={16} /> Plus
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
