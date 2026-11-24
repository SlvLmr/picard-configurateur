import { CalendarCheck, FileText, Info, Mail, Phone, RefreshCw, ShoppingCart, type LucideIcon } from "lucide-react";

export type TypeEtape = "appel" | "email" | "information" | "visite" | "relance" | "presentation" | "commande";

export const TYPES_ETAPE: Record<TypeEtape, { label: string; icon: LucideIcon; aide: string }> = {
  appel: { label: "Appel", icon: Phone, aide: "Joindre le client par téléphone" },
  email: { label: "E-mail", icon: Mail, aide: "Envoyer un message ou une offre" },
  information: { label: "Information", icon: Info, aide: "Transmettre une information, un document" },
  visite: { label: "Visite", icon: CalendarCheck, aide: "Rendez-vous chez le client" },
  presentation: { label: "Présentation", icon: FileText, aide: "Présenter une gamme, une offre" },
  commande: { label: "Commande", icon: ShoppingCart, aide: "Prendre la commande, saisir le montant" },
  relance: { label: "Relance", icon: RefreshCw, aide: "Relancer sans réponse" },
};

export const ORDRE_TYPES: TypeEtape[] = ["appel", "email", "information", "visite", "presentation", "commande", "relance"];

export const STATUTS_CAMPAGNE = {
  brouillon: { label: "Brouillon", variant: "neutral" as const },
  active: { label: "Active", variant: "success" as const },
  terminee: { label: "Terminée", variant: "accent" as const },
};

export const pourcentage = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export const dateCourte = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso)) : "";

export const dateLongue = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : "";

export const euros = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
