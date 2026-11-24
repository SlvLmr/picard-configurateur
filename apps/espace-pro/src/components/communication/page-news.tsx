"use client";

import { BadgeCheck, ChevronRight, Info, Lock, Megaphone, Pin, SendHorizontal, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { cn } from "@/lib/cn";
import type { Annonce } from "@/lib/data/accueil";

type Filtre = "toutes" | Annonce["ton"];

const STYLE = {
  info: { icon: Info, couleur: "var(--accent)", label: "Information" },
  operation: { icon: Megaphone, couleur: "var(--cta-deep, var(--cta))", label: "Opération" },
  important: { icon: TriangleAlert, couleur: "var(--warning)", label: "Important" },
} as const;

const jour = (iso: string) => iso.slice(0, 10);
const dateLongue = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

function libelleJour(iso: string) {
  const d = new Date(`${jour(iso)}T12:00:00`);
  const auj = new Date();
  auj.setHours(12, 0, 0, 0);
  const ecart = Math.round((auj.getTime() - d.getTime()) / 86400000);
  if (ecart === 0) return "Aujourd’hui";
  if (ecart === 1) return "Hier";
  if (ecart > 1 && ecart < 7) return new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(d);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(d);
}

function heure(iso: string) {
  return iso.length > 10 ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : null;
}

/** Aperçu de lien intégré à la bulle, comme dans une messagerie. */
function ApercuLien({ a }: { a: Annonce }) {
  if (!a.lienUrl) return null;
  const interne = a.lienUrl.startsWith("/");
  const contenu = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface">
        <SymboleEspacePro className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text">{a.lienLibelle ?? "En savoir plus"}</span>
        <span className="block truncate text-xs text-text-3">{interne ? "Espace Pro" : a.lienUrl.replace(/^https?:\/\//, "").split("/")[0]}</span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-text-3 transition-transform group-hover/lien:translate-x-0.5" />
    </>
  );
  const classe = "group/lien mt-3 flex items-center gap-3 rounded-md border-l-4 bg-sunken p-2 pr-3 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-sunken))]";
  return interne ? (
    <Link href={a.lienUrl} className={classe} style={{ borderLeftColor: STYLE[a.ton].couleur }}>
      {contenu}
    </Link>
  ) : (
    <a href={a.lienUrl} target="_blank" rel="noreferrer" className={classe} style={{ borderLeftColor: STYLE[a.ton].couleur }}>
      {contenu}
    </a>
  );
}

/** Actualités du réseau, présentées comme un canal de messagerie de Picard Serrures. */
export function PageNews({ annonces, admin }: { annonces: Annonce[]; admin: boolean }) {
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [surbrillance, setSurbrillance] = useState<string | null>(null);
  const filRef = useRef<HTMLDivElement>(null);

  // Ordre chronologique, la plus récente en bas, comme une conversation
  const liste = useMemo(
    () => (filtre === "toutes" ? annonces : annonces.filter((a) => a.ton === filtre)).slice().sort((a, b) => a.debut.localeCompare(b.debut)),
    [annonces, filtre],
  );
  const epinglee = annonces.find((a) => a.epinglee) ?? null;
  const compte = (t: Annonce["ton"]) => annonces.filter((a) => a.ton === t).length;

  useEffect(() => {
    const f = filRef.current;
    if (f) f.scrollTo({ top: f.scrollHeight, behavior: "instant" as ScrollBehavior });
  }, [filtre]);

  const allerA = (id: string) => {
    setFiltre("toutes");
    setTimeout(() => {
      document.getElementById(`annonce-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setSurbrillance(id);
      setTimeout(() => setSurbrillance(null), 1600);
    }, 50);
  };

  const groupes: { jour: string; annonces: Annonce[] }[] = [];
  for (const a of liste) {
    const j = jour(a.debut);
    if (groupes.at(-1)?.jour === j) groupes.at(-1)!.annonces.push(a);
    else groupes.push({ jour: j, annonces: [a] });
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-120px)] min-h-[560px] max-w-4xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      {/* En-tête du canal */}
      <header className="flex flex-col gap-3 border-b border-line bg-nav-gradient px-4 py-3 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <SymboleEspacePro className="size-8" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1 font-display text-lg font-semibold">
              Picard Serrures
              <BadgeCheck aria-label="Canal officiel" className="size-4 text-cta" />
            </h1>
            <p className="truncate text-xs text-nav-muted">Canal officiel du réseau, {annonces.length} annonce{annonces.length > 1 ? "s" : ""} en cours</p>
          </div>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrer les actualités">
          {(
            [
              ["toutes", "Toutes", annonces.length],
              ["operation", "Opérations", compte("operation")],
              ["important", "Important", compte("important")],
              ["info", "Informations", compte("info")],
            ] as const
          ).map(([v, l, n]) => (
            <button
              key={v}
              type="button"
              aria-pressed={filtre === v}
              onClick={() => setFiltre(v)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors",
                filtre === v ? "bg-white text-[#0b2545]" : "bg-white/10 text-white hover:bg-white/20",
              )}
            >
              {l}
              <span className={cn("tabular text-xs", filtre === v ? "text-[#0b2545]/60" : "text-white/60")}>{n}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Message épinglé */}
      {epinglee ? (
        <button type="button" onClick={() => allerA(epinglee.id)} className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2 text-left transition-colors hover:bg-sunken sm:px-6">
          <span className="h-8 w-1 shrink-0 rounded-full bg-cta" aria-hidden />
          <Pin aria-hidden className="size-4 shrink-0 text-cta-deep" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-cta-deep">Message épinglé</span>
            <span className="block truncate text-sm text-text">{epinglee.titre}</span>
          </span>
        </button>
      ) : null}

      {/* Fil */}
      <div
        ref={filRef}
        className="scroll-nav flex-1 overflow-y-auto px-3 py-6 sm:px-6"
        style={{
          backgroundColor: "color-mix(in srgb, var(--accent) 4%, var(--surface-sunken))",
          backgroundImage: "radial-gradient(color-mix(in srgb, var(--accent) 14%, transparent) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {liste.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-full bg-surface px-4 py-2 text-sm text-text-2 shadow-card">Aucune annonce dans cette catégorie pour le moment.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-6">
            {groupes.map((g) => (
              <li key={g.jour} className="flex flex-col gap-2">
                <p className="sticky top-0 z-10 mx-auto rounded-full bg-surface/95 px-3 py-1 text-xs font-medium capitalize text-text-2 shadow-card backdrop-blur">{libelleJour(g.jour)}</p>
                <ul className="flex flex-col gap-2">
                  {g.annonces.map((a, i) => {
                    const s = STYLE[a.ton];
                    const Icone = s.icon;
                    const premier = i === 0;
                    return (
                      <li key={a.id} id={`annonce-${a.id}`} className="bulle-entree flex items-end gap-2" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0b2545]", !premier && "invisible")} aria-hidden>
                          <SymboleEspacePro className="size-5" />
                        </span>
                        <article
                          className={cn(
                            "relative max-w-[min(560px,85%)] rounded-lg bg-surface px-4 pb-2 pt-3 shadow-card transition-shadow duration-500",
                            premier && "rounded-bl-sm",
                            a.ton === "important" && "ring-1 ring-warning/40",
                            surbrillance === a.id && "ring-2 ring-cta",
                          )}
                        >
                          {premier ? <span aria-hidden className="absolute -left-1 bottom-0 size-3 bg-surface [clip-path:polygon(100%_0,100%_100%,0_100%)]" /> : null}
                          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: s.couleur }}>
                            <Icone aria-hidden className="size-4" />
                            {s.label}
                            {a.epinglee ? (
                              <span className="inline-flex items-center gap-1 font-medium text-cta-deep">
                                <Pin aria-hidden className="size-3" />
                                Épinglé
                              </span>
                            ) : null}
                          </p>
                          <h2 className="mt-1 text-base font-semibold text-text">{a.titre}</h2>
                          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-text">{a.contenu}</p>
                          <ApercuLien a={a} />
                          <p className="mt-2 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-text-3">
                            {a.fin ? <span>Valable jusqu’au {dateLongue(a.fin)}</span> : null}
                            {heure(a.debut) ? <span className="tabular">{heure(a.debut)}</span> : null}
                          </p>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Barre du bas */}
      <footer className="border-t border-line bg-surface px-3 py-3 sm:px-4">
        {admin ? (
          <Link href="/administration/contenus" className="group flex items-center gap-2">
            <span className="flex h-10 flex-1 items-center rounded-full border border-line-strong bg-sunken px-4 text-sm text-text-3 transition-colors group-hover:border-accent">
              Écrire une annonce au réseau…
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-cta text-cta-text shadow-cta transition-transform group-hover:scale-105" aria-hidden>
              <SendHorizontal className="size-4" />
            </span>
            <span className="sr-only">Publier une annonce</span>
          </Link>
        ) : (
          <p className="flex items-center justify-center gap-2 py-2 text-xs text-text-3">
            <Lock aria-hidden className="size-3" />
            Seul Picard Serrures publie dans ce canal
          </p>
        )}
      </footer>
    </div>
  );
}
