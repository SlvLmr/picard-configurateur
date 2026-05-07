import { useState } from 'react';
import { Image as ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react';
import { uploadAmbianceImage } from './api';
import { resolveAmbianceImage } from '../utils/assets';
import { hotspotFields } from './collections';

export default function Field({ field, value, onChange, allDoors }) {
  switch (field.type) {
    case 'string':
      return <StringField field={field} value={value} onChange={onChange} />;
    case 'text':
      return <TextField field={field} value={value} onChange={onChange} />;
    case 'number':
      return <NumberField field={field} value={value} onChange={onChange} />;
    case 'boolean':
      return <BooleanField field={field} value={value} onChange={onChange} />;
    case 'select':
      return <SelectField field={field} value={value} onChange={onChange} />;
    case 'image':
      return <ImageField field={field} value={value} onChange={onChange} />;
    case 'idList':
      return <IdListField field={field} value={value} onChange={onChange} allDoors={allDoors} />;
    case 'hotspots':
      return <HotspotsField field={field} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function Label({ field, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-picard-navy/60">
        {field.label}
        {field.required && <span className="ml-0.5 text-picard-red">*</span>}
      </span>
      {children}
      {field.hint && (
        <span className="mt-1 block text-[11px] leading-snug text-picard-navy/55">{field.hint}</span>
      )}
    </label>
  );
}

function StringField({ field, value, onChange }) {
  return (
    <Label field={field}>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-picard-navy/15 bg-white px-3 py-2 text-sm text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
      />
    </Label>
  );
}

function TextField({ field, value, onChange }) {
  return (
    <Label field={field}>
      <textarea
        rows={3}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-picard-navy/15 bg-white px-3 py-2 text-sm text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
      />
    </Label>
  );
}

function NumberField({ field, value, onChange }) {
  return (
    <Label field={field}>
      <input
        type="number"
        min={field.min}
        max={field.max}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value === '' ? null : Number(e.target.value);
          onChange(v);
        }}
        className="w-full rounded-lg border border-picard-navy/15 bg-white px-3 py-2 text-sm text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
      />
    </Label>
  );
}

function BooleanField({ field, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-picard-navy/12 bg-white px-3 py-2.5">
      <span>
        <span className="block text-sm font-medium text-picard-navy">{field.label}</span>
        {field.hint && <span className="block text-[11px] text-picard-navy/55">{field.hint}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${
          value ? 'bg-picard-gold' : 'bg-picard-navy/20'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            value ? 'left-[1.4rem]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({ field, value, onChange }) {
  return (
    <Label field={field}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-picard-navy/15 bg-white px-3 py-2 text-sm text-picard-navy outline-none transition focus:border-picard-gold focus:ring-2 focus:ring-picard-gold/30"
      >
        <option value="" disabled>
          Choisir…
        </option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Label>
  );
}

function ImageField({ field, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const resolved = resolveAmbianceImage(value);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fileName = await uploadAmbianceImage(file);
      onChange(fileName);
    } catch (err) {
      setError(err.message || "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Label field={field}>
      <div className="flex items-center gap-3">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-picard-navy/15 bg-stone-50">
          {resolved ? (
            <img src={resolved} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={24} className="text-picard-navy/30" strokeWidth={1.4} />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-picard-navy px-4 py-2 text-xs font-medium text-picard-cream transition hover:bg-black">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Upload…' : value ? 'Remplacer' : 'Téléverser une image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex w-fit items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-picard-navy/55 transition hover:text-picard-red"
            >
              <X size={12} /> Retirer
            </button>
          )}
          {error && <span className="text-xs text-picard-red">{error}</span>}
        </div>
      </div>
    </Label>
  );
}

function IdListField({ field, value, onChange, allDoors }) {
  const ids = Array.isArray(value) ? value : [];
  const toggle = (id) => {
    if (ids.includes(id)) onChange(ids.filter((x) => x !== id));
    else onChange([...ids, id]);
  };
  return (
    <Label field={field}>
      <div className="flex flex-wrap gap-2">
        {(allDoors || []).map((door) => {
          const active = ids.includes(door.id);
          return (
            <button
              type="button"
              key={door.id}
              onClick={() => toggle(door.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-picard-gold bg-picard-gold text-white'
                  : 'border-picard-navy/15 bg-white text-picard-navy hover:border-picard-navy/35'
              }`}
            >
              {door.name}
            </button>
          );
        })}
        {(!allDoors || allDoors.length === 0) && (
          <span className="text-xs text-picard-navy/55">
            Aucune porte chargée. Ouvre la collection « Modèles de portes » d'abord.
          </span>
        )}
      </div>
    </Label>
  );
}

function HotspotsField({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  const update = (idx, key, val) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [key]: val } : it));
    onChange(next);
  };

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  const add = () => {
    onChange([
      ...items,
      { id: `spot-${items.length + 1}`, label: 'Détail', x: 50, y: 50, title: '', description: '' },
    ]);
  };

  return (
    <Label field={field}>
      <div className="space-y-3">
        {items.map((spot, idx) => (
          <div key={idx} className="rounded-xl border border-picard-navy/12 bg-stone-50/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-picard-navy/65">
                Hotspot {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-picard-red/80 transition hover:text-picard-red"
              >
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {hotspotFields.map((sub) => (
                <Field
                  key={sub.name}
                  field={sub}
                  value={spot[sub.name]}
                  onChange={(v) => update(idx, sub.name, v)}
                />
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-picard-navy/25 bg-white px-3 py-2.5 text-xs font-medium text-picard-navy transition hover:border-picard-navy/45"
        >
          + Ajouter un hotspot
        </button>
      </div>
    </Label>
  );
}
