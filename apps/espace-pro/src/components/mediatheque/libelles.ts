import { Clapperboard, FileCog, Image, Presentation, type LucideIcon } from "lucide-react";
import type { MarqueRessource, TypeRessource } from "@/lib/data/mediatheque";

export const TYPES: Record<TypeRessource, { label: string; pluriel: string; icon: LucideIcon; tone: "accent" | "cta" | "success" | "neutral" }> = {
  photo: { label: "Photo", pluriel: "Photos", icon: Image, tone: "accent" },
  video: { label: "Vidéo", pluriel: "Vidéos", icon: Clapperboard, tone: "success" },
  doc_commerciale: { label: "Doc commerciale", pluriel: "Docs commerciales", icon: Presentation, tone: "cta" },
  doc_technique: { label: "Doc technique", pluriel: "Docs techniques", icon: FileCog, tone: "neutral" },
};

export const MARQUES: Record<MarqueRessource, string> = {
  picard: "Picard Serrures",
  eliot: "Eliot",
  commune: "Toutes marques",
};

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export function formatTaille(octets: number | null) {
  if (!octets) return null;
  if (octets < 1e6) return `${nf.format(octets / 1e3)} Ko`;
  if (octets < 1e9) return `${nf.format(octets / 1e6)} Mo`;
  return `${nf.format(octets / 1e9)} Go`;
}

const df = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
export const formatJour = (iso: string) => df.format(new Date(iso));

/** Une ressource est « mise à jour » si elle a changé de version dans les 30 derniers jours. */
export const estMiseAJour = (version: number, misAJourLe: string) =>
  version > 1 && Date.now() - new Date(misAJourLe).getTime() < 30 * 86400000;

export function publicLibelle(roles: string[], niveaux: string[]) {
  if (roles.length && roles.every((r) => !r.startsWith("client"))) return "Équipes Picard uniquement";
  if (niveaux.length === 1) return `IAP ${niveaux[0]} uniquement`;
  if (niveaux.length > 1) return `IAP ${niveaux.join(" et ")}`;
  return "Tout le réseau";
}
