"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Panneau latéral d'édition : à droite sur grand écran, plein écran sur téléphone.
 * Un seul modèle pour toutes les rubriques de l'administration.
 */
export function PanneauEdition({ titre, description, onFermer, children, pied }: {
  titre: string;
  description?: string;
  onFermer: () => void;
  children: React.ReactNode;
  pied: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#071a33]/40" onMouseDown={onFermer}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col bg-surface shadow-2xl sm:max-w-lg"
      >
        <header className="flex items-start gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-text">{titre}</h2>
            {description ? <p className="mt-0.5 truncate text-sm text-text-3">{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" iconOnly aria-label="Fermer" onClick={onFermer}>
            <X />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        <footer className="flex flex-wrap gap-2 border-t border-line px-6 py-4">{pied}</footer>
      </aside>
    </div>
  );
}
