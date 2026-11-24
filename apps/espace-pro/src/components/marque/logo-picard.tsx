"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Logo officiel de la marque. Déposez le fichier fourni par la communication dans
 * public/logos/picard-serrures.svg (ou eliot.svg). En attendant, un nom en texte s'affiche.
 */
export function LogoMarque({ marque, className }: { marque: "picard" | "eliot"; className?: string }) {
  const [absent, setAbsent] = useState(false);
  const nom = marque === "picard" ? "Picard Serrures" : "Eliot";
  if (absent) {
    return <span className={cn("block truncate text-center text-sm font-semibold tracking-wide text-white", className)}>{nom}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${marque === "picard" ? "picard-serrures" : "eliot"}.svg`}
      alt={nom}
      className={cn("block h-8 w-auto max-w-full object-contain", className)}
      onError={() => setAbsent(true)}
    />
  );
}
