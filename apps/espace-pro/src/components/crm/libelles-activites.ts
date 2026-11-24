import { GraduationCap, Mail, MapPin, Phone, Presentation, Store, type LucideIcon } from "lucide-react";
import type { StatutPlan, TypeActivite, TypePlan } from "@/lib/data/crm";

export const TYPES_ACTIVITE: { value: TypeActivite; label: string; icone: LucideIcon }[] = [
  { value: "visite", label: "Visite", icone: MapPin },
  { value: "appel", label: "Appel", icone: Phone },
  { value: "email", label: "E-mail", icone: Mail },
  { value: "formation", label: "Formation", icone: GraduationCap },
  { value: "demo", label: "Démonstration", icone: Presentation },
  { value: "salon", label: "Salon", icone: Store },
];

export const typeActivite = (t: TypeActivite) => TYPES_ACTIVITE.find((x) => x.value === t) ?? TYPES_ACTIVITE[0];

export const TYPES_PLAN: { value: TypePlan; label: string }[] = [
  { value: "passage_niveau", label: "Passage de niveau IAP" },
  { value: "developpement_ca", label: "Développement du chiffre d’affaires" },
  { value: "recrutement_iap", label: "Recrutement IAP" },
  { value: "fidelisation", label: "Fidélisation" },
  { value: "autre", label: "Autre objectif" },
];

export const LIBELLE_PLAN: Record<TypePlan, string> = Object.fromEntries(TYPES_PLAN.map((t) => [t.value, t.label])) as Record<TypePlan, string>;

export const LIBELLE_STATUT_PLAN: Record<StatutPlan, string> = { en_cours: "En cours", atteint: "Atteint", abandonne: "Abandonné" };

const fuseau = { timeZone: "Europe/Paris" } as const;
const jourHeure = new Intl.DateTimeFormat("fr-FR", { ...fuseau, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const jourCourt = new Intl.DateTimeFormat("fr-FR", { ...fuseau, day: "numeric", month: "short" });
const heure = new Intl.DateTimeFormat("fr-FR", { ...fuseau, hour: "2-digit", minute: "2-digit" });
const nomJour = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatJourHeure = (iso: string) => majuscule(jourHeure.format(new Date(iso)));
export const formatJourCourt = (iso: string) => jourCourt.format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
export const formatHeure = (iso: string) => heure.format(new Date(iso)).replace(":", " h ").replace(/^0/, "");
/** « Lundi 24 novembre » à partir d'une date AAAA-MM-JJ */
export const formatNomJour = (jour: string) => majuscule(nomJour.format(new Date(`${jour}T12:00:00Z`)));

/** Date du jour AAAA-MM-JJ à Paris (côté navigateur). */
export const aujourdhuiParis = () =>
  new Intl.DateTimeFormat("fr-CA", { ...fuseau, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
