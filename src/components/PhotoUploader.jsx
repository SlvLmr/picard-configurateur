import { useRef, useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';

const MAX_BYTES = 6 * 1024 * 1024;

export default function PhotoUploader({ photo, onChange }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [isDragging, setDragging] = useState(false);

  const handleFile = (file) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Format non supporté. Utilisez une image JPG ou PNG.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image trop lourde (6 Mo max).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.onerror = () => setError("Impossible de lire l'image, réessayez.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-3xl border border-picard-navy/10 bg-white p-6 shadow-soft">
      {photo ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl">
            <img src={photo} alt="Votre façade" className="h-72 w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-picard-navy backdrop-blur transition hover:bg-white"
            >
              <X size={14} />
              Retirer
            </button>
          </div>
          <p className="text-sm text-picard-navy/65">
            Votre photo est prête. La porte sera projetée par-dessus à l'étape suivante.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`flex h-72 w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-picard-gold bg-amber-50/60'
              : 'border-picard-navy/20 bg-stone-50 hover:border-picard-navy/40'
          }`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-picard-navy/5 text-picard-navy">
            <Camera size={22} strokeWidth={1.5} />
          </span>
          <div className="text-center">
            <p className="font-display text-xl text-picard-navy">Téléchargez votre façade</p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-picard-navy/60">
              Glissez-déposez ou cliquez pour sélectionner. JPG / PNG, 6 Mo max. Cadrage frontal de
              préférence, en lumière naturelle.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-picard-navy px-5 py-2 text-xs font-medium uppercase tracking-[0.16em] text-picard-cream">
            <Upload size={14} />
            Choisir une image
          </span>
        </button>
      )}
      {error && (
        <p className="mt-3 rounded-md border border-picard-red/30 bg-picard-red/5 px-3 py-2 text-xs text-picard-red">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
