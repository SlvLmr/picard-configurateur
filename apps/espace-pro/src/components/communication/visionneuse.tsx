"use client";

import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { cn } from "@/lib/cn";

export type PhotoVisionneuse = { url: string; legende: string; date: string };

/**
 * Visionneuse plein écran, comme dans une messagerie : fond sombre, expéditeur en haut,
 * photo au centre (clic pour zoomer), flèches et miniatures, clavier et balayage au doigt.
 */
export function Visionneuse({ photos, depart, onFermer }: { photos: PhotoVisionneuse[]; depart: number; onFermer: () => void }) {
  const [index, setIndex] = useState(depart);
  const [zoom, setZoom] = useState(false);
  const balayage = useRef<number | null>(null);
  const photo = photos[index];

  const aller = useCallback(
    (sens: 1 | -1) => {
      setZoom(false);
      setIndex((i) => Math.max(0, Math.min(photos.length - 1, i + sens)));
    },
    [photos.length],
  );

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
      if (e.key === "ArrowLeft") aller(-1);
      if (e.key === "ArrowRight") aller(1);
    };
    window.addEventListener("keydown", touche);
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", touche);
      document.body.style.overflow = avant;
    };
  }, [aller, onFermer]);

  if (!photo) return null;
  const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(photo.date));

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Photo" className="fixed inset-0 z-50 flex flex-col bg-[#0b141a]/95 text-[#e9edef] backdrop-blur-sm">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#202c33]">
          <SymboleEspacePro className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">Picard Serrures</span>
          <span className="block truncate text-xs text-[#8696a0]">{date}</span>
        </span>
        {photos.length > 1 ? (
          <span className="tabular text-sm text-[#8696a0]">
            {index + 1} sur {photos.length}
          </span>
        ) : null}
        <a href={photo.url} download target="_blank" rel="noreferrer" aria-label="Télécharger la photo" className="rounded-full p-2 text-[#aebac1] transition-colors hover:bg-white/10 hover:text-white">
          <Download className="size-5" />
        </a>
        <button type="button" onClick={onFermer} aria-label="Fermer" className="rounded-full p-2 text-[#aebac1] transition-colors hover:bg-white/10 hover:text-white">
          <X className="size-6" />
        </button>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 sm:px-20"
        onClick={(e) => {
          if (e.target === e.currentTarget) onFermer();
        }}
        onPointerDown={(e) => {
          balayage.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (balayage.current === null || zoom) return;
          const dx = e.clientX - balayage.current;
          balayage.current = null;
          if (Math.abs(dx) > 60) aller(dx < 0 ? 1 : -1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.url}
          src={photo.url}
          alt={photo.legende}
          draggable={false}
          onClick={() => setZoom((z) => !z)}
          className={cn(
            "wa-visionneuse-image max-h-full max-w-full select-none object-contain transition-transform duration-300",
            zoom ? "scale-[1.8] cursor-zoom-out" : "cursor-zoom-in",
          )}
        />
        {index > 0 ? (
          <button type="button" onClick={() => aller(-1)} aria-label="Photo précédente" className="absolute left-4 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#202c33] text-[#e9edef] shadow-lg transition-colors hover:bg-[#2a3942] sm:flex">
            <ChevronLeft className="size-6" />
          </button>
        ) : null}
        {index < photos.length - 1 ? (
          <button type="button" onClick={() => aller(1)} aria-label="Photo suivante" className="absolute right-4 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#202c33] text-[#e9edef] shadow-lg transition-colors hover:bg-[#2a3942] sm:flex">
            <ChevronRight className="size-6" />
          </button>
        ) : null}
      </div>

      <footer className="flex flex-col items-center gap-3 px-4 pb-6 pt-3">
        {photo.legende ? <p className="line-clamp-2 max-w-2xl text-center text-sm text-[#e9edef]">{photo.legende}</p> : null}
        {photos.length > 1 ? (
          <div className="flex max-w-full gap-2 overflow-x-auto p-1">
            {photos.map((p, i) => (
              <button
                key={p.url}
                type="button"
                onClick={() => {
                  setZoom(false);
                  setIndex(i);
                }}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                className={cn("size-12 shrink-0 overflow-hidden rounded-md transition-[opacity,box-shadow]", i === index ? "opacity-100 ring-2 ring-[#00a884]" : "opacity-50 hover:opacity-80")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </footer>
    </div>,
    document.body,
  );
}
