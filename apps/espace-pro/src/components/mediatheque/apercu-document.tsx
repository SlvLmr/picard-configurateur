"use client";

import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { lienApercu, lienTelechargement } from "@/app/(app)/mediatheque/actions";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Ressource } from "@/lib/data/mediatheque";
import { TYPES, formatJour, formatTaille } from "./libelles";

const IMAGES = ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"];
const VIDEOS = ["mp4", "webm", "mov", "m4v"];
const BUREAUTIQUE = ["pptx", "ppt", "xlsx", "xls", "docx", "doc"];

function genre(r: Ressource) {
  const f = (r.format ?? r.fichierChemin?.split(".").pop() ?? "").toLowerCase();
  if (f === "pdf") return "pdf";
  if (IMAGES.includes(f)) return "image";
  if (VIDEOS.includes(f)) return "video";
  if (BUREAUTIQUE.includes(f)) return "bureautique";
  return "fiche";
}

/**
 * Aperçu d'un document, à la manière du « Coup d'œil » d'un ordinateur :
 * PDF, images et vidéos s'affichent ; les documents bureautiques passent par la visionneuse en ligne ;
 * les autres formats (ZIP…) présentent leur fiche. Flèches pour passer au suivant, Échap ou espace pour fermer.
 */
export function ApercuDocument({ liste, depart, onFermer }: { liste: Ressource[]; depart: number; onFermer: () => void }) {
  const toast = useToast();
  const [index, setIndex] = useState(depart);
  const [liens, setLiens] = useState<Record<string, string | null>>({});
  const [, start] = useTransition();
  const [telechargement, startTelechargement] = useTransition();
  const fermer = useRef(onFermer);
  fermer.current = onFermer;
  const r = liste[index];
  const g = r ? genre(r) : "fiche";

  // Lien d'affichage temporaire, demandé une fois par document
  useEffect(() => {
    if (!r || r.id in liens || !r.fichierChemin || g === "fiche") return;
    start(async () => {
      const res = await lienApercu(r.id);
      setLiens((l) => ({ ...l, [r.id]: res.ok ? (res.donnee ?? null) : null }));
    });
  }, [r, g, liens]);

  const aller = useCallback((sens: 1 | -1) => setIndex((i) => Math.max(0, Math.min(liste.length - 1, i + sens))), [liste.length]);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.key === " " && !(e.target instanceof HTMLInputElement))) {
        e.preventDefault();
        fermer.current();
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") aller(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") aller(-1);
    };
    window.addEventListener("keydown", touche);
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", touche);
      document.body.style.overflow = avant;
    };
  }, [aller]);

  if (!r) return null;
  const t = TYPES[r.type];
  const Icone = t.icon;
  const lien = liens[r.id];
  const chargement = g !== "fiche" && !!r.fichierChemin && lien === undefined;
  const telecharger = () =>
    startTelechargement(async () => {
      const res = await lienTelechargement(r.id);
      toast(res.message);
      if (res.ok && res.donnee) window.location.assign(res.donnee);
    });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a33]/50 p-4 backdrop-blur-sm sm:p-8" onMouseDown={onFermer}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Aperçu : ${r.titre}`}
        onMouseDown={(e) => e.stopPropagation()}
        className="apercu-entree flex h-full max-h-[880px] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-surface shadow-2xl"
      >
        {/* Barre de titre */}
        <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sunken text-accent">
            <Icone aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <span className="truncate font-display text-base font-semibold text-text">{r.titre}</span>
              {r.nouveau ? <Badge variant="success">Nouveau</Badge> : null}
            </p>
            <p className="truncate text-xs text-text-3">{[t.label, r.format, formatTaille(r.tailleOctets), `v${r.version}`, formatJour(r.misAJourLe)].filter(Boolean).join(", ")}</p>
          </div>
          {liste.length > 1 ? (
            <span className="tabular hidden text-sm text-text-3 sm:inline">
              {index + 1} sur {liste.length}
            </span>
          ) : null}
          <button
            type="button"
            onClick={telecharger}
            disabled={telechargement || !r.fichierChemin}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-cta px-4 text-sm font-semibold text-cta-text transition-colors hover:bg-cta-hover disabled:opacity-50"
          >
            <Download aria-hidden className="size-4" />
            <span className="hidden sm:inline">Télécharger</span>
          </button>
          <button type="button" onClick={onFermer} aria-label="Fermer l’aperçu" className="rounded-full p-2 text-text-3 transition-colors hover:bg-sunken hover:text-text">
            <X className="size-5" />
          </button>
        </header>

        {/* Document */}
        <div className="relative min-h-0 flex-1 bg-sunken">
          {chargement ? (
            <div className="flex h-full items-center justify-center text-text-3">
              <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
            </div>
          ) : g === "pdf" && lien ? (
            <iframe key={r.id} src={`${lien}#view=FitH`} title={r.titre} className="size-full border-0 bg-white" />
          ) : g === "image" && lien ? (
            <div className="flex h-full items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={r.id} src={lien} alt={r.titre} className="apercu-entree max-h-full max-w-full rounded-md object-contain shadow-card" />
            </div>
          ) : g === "video" && lien ? (
            <div className="flex h-full items-center justify-center bg-black p-4">
              <video key={r.id} src={lien} controls autoPlay className="max-h-full max-w-full rounded-md" />
            </div>
          ) : g === "bureautique" && lien ? (
            <iframe key={r.id} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lien)}`} title={r.titre} className="size-full border-0 bg-white" />
          ) : (
            // Fiche du document quand il ne peut pas s'afficher (archive ZIP, fichier pas encore déposé…)
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="relative flex h-[128px] w-24 items-center justify-center rounded-md border border-line bg-surface shadow-card [clip-path:polygon(0_0,72%_0,100%_20%,100%_100%,0_100%)]">
                <Icone aria-hidden className="size-8 text-accent" />
                <span className="absolute inset-x-0 bottom-0 bg-accent py-1 text-xs font-bold text-white">{(r.format ?? t.label).slice(0, 5)}</span>
              </span>
              <p className="font-display text-xl font-semibold text-text">{r.titre}</p>
              {r.description ? <p className="max-w-lg text-sm text-text-2">{r.description}</p> : null}
              <p className="text-sm text-text-3">
                {r.fichierChemin ? "Ce format ne s’affiche pas dans le navigateur : téléchargez-le pour l’ouvrir." : "Le fichier n’a pas encore été déposé."}
              </p>
            </div>
          )}

          {liste.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => aller(-1)}
                disabled={index === 0}
                aria-label="Document précédent"
                className={cn("absolute left-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-text shadow-lg backdrop-blur transition-opacity hover:bg-surface", index === 0 && "pointer-events-none opacity-0")}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => aller(1)}
                disabled={index === liste.length - 1}
                aria-label="Document suivant"
                className={cn("absolute right-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-text shadow-lg backdrop-blur transition-opacity hover:bg-surface", index === liste.length - 1 && "pointer-events-none opacity-0")}
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
        </div>
        <footer className="hidden items-center justify-center gap-4 border-t border-line px-6 py-2 text-xs text-text-3 sm:flex">
          <span>Flèches : document précédent ou suivant</span>
          <span>Espace ou Échap : fermer</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
