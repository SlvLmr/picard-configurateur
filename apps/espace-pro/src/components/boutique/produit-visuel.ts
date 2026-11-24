import {
  Coffee,
  DoorOpen,
  Flag,
  Gift,
  HardHat,
  KeyRound,
  NotebookPen,
  Ruler,
  Shirt,
  Sticker,
  Tablet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Categorie, ModePaiement, StatutCommande } from "@/lib/data/boutique";

const ICONES: Record<string, LucideIcon> = {
  coffee: Coffee,
  "hard-hat": HardHat,
  "key-round": KeyRound,
  "notebook-pen": NotebookPen,
  shirt: Shirt,
  ruler: Ruler,
  flag: Flag,
  "door-open": DoorOpen,
  sticker: Sticker,
  wrench: Wrench,
  tablet: Tablet,
};

export const iconeProduit = (visuel: string | null): LucideIcon => (visuel && ICONES[visuel]) || Gift;

export const TON_CATEGORIE: Record<Categorie, "cta" | "accent" | "nav" | "neutral"> = {
  Goodies: "cta",
  Tenues: "accent",
  PLV: "nav",
  Outillage: "neutral",
};

export const CATEGORIES: Categorie[] = ["Goodies", "Tenues", "PLV", "Outillage"];

export const LIBELLE_STATUT: Record<StatutCommande, { label: string; variant: "warning" | "accent" | "success" | "danger" | "neutral" }> = {
  a_valider: { label: "En validation", variant: "warning" },
  paiement_en_attente: { label: "Paiement à régler", variant: "accent" },
  validee: { label: "Validée", variant: "success" },
  expediee: { label: "Expédiée", variant: "accent" },
  livree: { label: "Livrée", variant: "success" },
  annulee: { label: "Annulée", variant: "danger" },
};

export const LIBELLE_MODE: Record<ModePaiement, string> = {
  points: "Payée en points",
  cb: "Payée par carte",
  mixte: "Points et carte",
  enveloppe: "Sur enveloppe",
};

const eur2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
/** 12,5 € → « 12,50 € », 95 € → « 95 € » */
export const euros = (n: number) => (Number.isInteger(n) ? eur2.format(n) : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n));
export const points = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} pts`;
