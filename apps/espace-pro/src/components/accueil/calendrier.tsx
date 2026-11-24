"use client";

import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import type { ElementAgenda, TypeAgenda } from "@/lib/data/accueil";

export const TYPES_AGENDA: Record<TypeAgenda, { label: string; couleur: string }> = {
  salon: { label: "Salon", couleur: "var(--cta)" },
  formation: { label: "Formation", couleur: "var(--success)" },
  webinaire: { label: "Webinaire", couleur: "var(--accent)" },
  operation: { label: "Opération", couleur: "var(--warning)" },
  reunion: { label: "Réunion", couleur: "var(--text-2)" },
  visite: { label: "Visite", couleur: "var(--bleu-400)" },
  echeance: { label: "Échéance", couleur: "var(--danger)" },
};

const JOURS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const cle = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const jourDe = (iso: string) => cle(new Date(iso));

function plage(e: ElementAgenda) {
  const d = new Date(e.debut);
  const date = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(d);
  if (e.type === "echeance" || e.type === "operation") return date;
  const h = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
  if (e.fin && jourDe(e.fin) !== jourDe(e.debut)) {
    return `${date} au ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(e.fin))}`;
  }
  return `${date}, ${h}`;
}

/** Calendrier du mois et prochains rendez-vous. Choisir un jour filtre la liste. */
export function Calendrier({ elements }: { elements: ElementAgenda[] }) {
  const aujourdhui = useMemo(() => new Date(), []);
  const [mois, setMois] = useState(() => new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1));
  const [jour, setJour] = useState<string | null>(null);

  const parJour = useMemo(() => {
    const m = new Map<string, ElementAgenda[]>();
    for (const e of elements) {
      const debut = new Date(e.debut);
      const fin = e.fin ? new Date(e.fin) : debut;
      // un salon sur plusieurs jours apparaît chaque jour
      for (let d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate()); d <= fin && m.size < 1000; d.setDate(d.getDate() + 1)) {
        const k = cle(d);
        m.set(k, [...(m.get(k) ?? []), e]);
        if (cle(d) === cle(fin)) break;
      }
    }
    return m;
  }, [elements]);

  const cases = useMemo(() => {
    const premier = new Date(mois);
    const decalage = (premier.getDay() + 6) % 7;
    const debut = new Date(mois.getFullYear(), mois.getMonth(), 1 - decalage);
    return Array.from({ length: 42 }, (_, i) => new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i));
  }, [mois]);

  const liste = jour ? parJour.get(jour) ?? [] : elements.filter((e) => new Date(e.fin ?? e.debut) >= new Date(aujourdhui.toDateString())).slice(0, 7);
  const titreMois = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(mois);
  const typesPresents = Array.from(new Set(elements.map((e) => e.type)));

  return (
    <Panel>
      <PanelHeader
        title="Calendrier"
        description="Salons, formations, opérations et vos rendez-vous"
        actions={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" iconOnly aria-label="Mois précédent" onClick={() => { setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1)); setJour(null); }}>
              <ChevronLeft />
            </Button>
            <span className="min-w-0 px-1 text-sm font-semibold capitalize text-text sm:min-w-40 sm:text-center">{titreMois}</span>
            <Button size="sm" variant="ghost" iconOnly aria-label="Mois suivant" onClick={() => { setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1)); setJour(null); }}>
              <ChevronRight />
            </Button>
          </div>
        }
      />
      <div className="grid gap-6 px-6 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="grid grid-cols-7 text-center text-xs font-medium text-text-3">
            {JOURS.map((j) => (
              <span key={j} className="pb-2">
                {j}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Calendrier de ${titreMois}`}>
            {cases.map((d) => {
              const k = cle(d);
              const items = parJour.get(k) ?? [];
              const horsMois = d.getMonth() !== mois.getMonth();
              const estAujourdhui = k === cle(aujourdhui);
              const choisi = jour === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setJour(choisi ? null : k)}
                  aria-pressed={choisi}
                  aria-label={`${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${items.length ? `, ${items.length} élément${items.length > 1 ? "s" : ""}` : ""}`}
                  className={cn(
                    "flex aspect-square min-h-10 flex-col items-center justify-center gap-1 rounded-md text-sm transition-colors sm:aspect-auto sm:h-12",
                    horsMois ? "text-text-3" : "text-text",
                    choisi ? "bg-text text-surface" : estAujourdhui ? "bg-accent-soft font-semibold text-accent-strong" : "hover:bg-sunken",
                    horsMois && !choisi && "opacity-50",
                  )}
                >
                  <span className="tabular leading-none">{d.getDate()}</span>
                  <span className="flex items-center gap-0.5" style={{ height: 6 }} aria-hidden>
                    {items.slice(0, 3).map((e, i) => (
                      <span key={i} className="rounded-full" style={{ width: 6, height: 6, background: choisi ? "currentColor" : TYPES_AGENDA[e.type].couleur }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          {typesPresents.length ? (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {typesPresents.map((t) => (
                <li key={t} className="flex items-center gap-2 text-xs text-text-2">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: TYPES_AGENDA[t].couleur }} />
                  {TYPES_AGENDA[t].label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text">
              {jour ? new Date(jour).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "À venir"}
            </h3>
            {jour ? (
              <button type="button" onClick={() => setJour(null)} className="text-sm font-medium text-accent hover:underline">
                Tout afficher
              </button>
            ) : null}
          </div>
          {liste.length === 0 ? (
            <p className="flex items-center gap-2 rounded-md bg-sunken px-4 py-6 text-sm text-text-2">
              <CalendarDays aria-hidden className="size-4 shrink-0 text-text-3" />
              {jour ? "Rien de prévu ce jour-là." : "Rien de prévu prochainement."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {liste.map((e) => {
                const contenu = (
                  <>
                    <span aria-hidden className="mt-1 w-1 shrink-0 self-stretch rounded-full" style={{ background: TYPES_AGENDA[e.type].couleur }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 text-xs text-text-3">
                        <span className="font-semibold" style={{ color: TYPES_AGENDA[e.type].couleur }}>
                          {TYPES_AGENDA[e.type].label}
                        </span>
                        <span className="capitalize" suppressHydrationWarning>{plage(e)}</span>
                      </span>
                      <span className="mt-0.5 block truncate font-semibold text-text">{e.titre}</span>
                      {e.lieu || e.description ? (
                        <span className="mt-0.5 flex items-center gap-1 truncate text-sm text-text-2">
                          {e.lieu ? <MapPin aria-hidden className="size-3 shrink-0" /> : null}
                          <span className="truncate">{e.lieu ?? e.description}</span>
                        </span>
                      ) : null}
                    </span>
                  </>
                );
                const classes = "group flex gap-3 rounded-md border border-line px-3 py-3";
                return (
                  <li key={`${e.type}-${e.id}`}>
                    {e.href ? (
                      e.href.startsWith("/") ? (
                        <Link href={e.href} className={cn(classes, "transition-colors hover:bg-sunken")}>
                          {contenu}
                        </Link>
                      ) : (
                        <a href={e.href} target="_blank" rel="noreferrer" className={cn(classes, "transition-colors hover:bg-sunken")}>
                          {contenu}
                        </a>
                      )
                    ) : (
                      <div className={classes}>{contenu}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
