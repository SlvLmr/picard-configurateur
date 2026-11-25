"use client";

import { BellRing, Check, Flame, Search, Snowflake, Sun, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { attribuerLead, relancerPro } from "@/app/(app)/leads/actions";
import { NiveauBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { LeadGestion, Temperature } from "@/lib/data/types";
import { formatDuree } from "@/lib/format";
import { ilYa } from "@/lib/temps";
import { SourcePicto } from "./source-picto";

type Colonne = { id: string; titre: string; aide: string; couleur: string; filtre: (l: LeadGestion) => boolean };

const COLONNES: Colonne[] = [
  { id: "qualifier", titre: "À qualifier", aide: "Nouvelles demandes", couleur: "var(--line-strong)", filtre: (l) => l.statut === "a_valider" && !l.temperature },
  { id: "attribuer", titre: "À attribuer", aide: "Qualifiées, prêtes à partir", couleur: "var(--cta)", filtre: (l) => l.statut === "a_valider" && !!l.temperature },
  { id: "installateur", titre: "Chez l’installateur", aide: "24 h pour accepter", couleur: "var(--bleu-400)", filtre: (l) => l.statut === "attribue" },
  { id: "cours", titre: "En cours", aide: "Accepté, contacté, rendez-vous, devis", couleur: "var(--accent)", filtre: (l) => ["accepte", "contacte", "rdv", "devis"].includes(l.statut) },
  { id: "gagnes", titre: "Gagnés", aide: "Signés et posés", couleur: "var(--success)", filtre: (l) => l.statut === "signe" || l.statut === "pose" },
];

const COULEUR_TEMP: Record<Temperature, string> = { chaud: "var(--danger)", tiede: "var(--warning)", froid: "var(--bleu-400)" };
const PICTO_TEMP = { chaud: Flame, tiede: Sun, froid: Snowflake } as const;
const ETAPES = ["accepte", "contacte", "rdv", "devis"];
const PAR_COLONNE = 25;

const sansAccents = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Tableau du Lead Manager : chaque lead est une carte qui avance d'une colonne à l'autre. */
export function TableauLeads({ leads, peutGerer }: { leads: LeadGestion[]; peutGerer: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [temp, setTemp] = useState<Temperature | "toutes">("toutes");
  const [q, setQ] = useState("");

  const visibles = useMemo(() => {
    const n = sansAccents(q.trim());
    const depuis = Date.now() - 60 * 86400000;
    return leads.filter(
      (l) =>
        (temp === "toutes" || l.temperature === temp) &&
        (!n || sansAccents(`${l.contact} ${l.ville ?? ""} ${l.reference} ${l.cp} ${l.projet}`).includes(n)) &&
        // les gagnés ne restent que deux mois au tableau
        (!(l.statut === "signe" || l.statut === "pose") || new Date(l.recuLe).getTime() >= depuis),
    );
  }, [leads, temp, q]);

  const compteTemp = (t: Temperature) => leads.filter((l) => l.temperature === t && !["signe", "pose", "perdu"].includes(l.statut)).length;

  const agir = (id: string, f: () => Promise<{ ok: boolean; message: string }>) => {
    setEnCours(id);
    start(async () => {
      const r = await f();
      setEnCours(null);
      toast(r.message);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filtres par température et recherche */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par température">
          <button
            type="button"
            aria-pressed={temp === "toutes"}
            onClick={() => setTemp("toutes")}
            className={cn("h-10 rounded-full border px-4 text-sm font-semibold transition-colors", temp === "toutes" ? "border-accent bg-accent text-white" : "border-line-strong bg-surface text-text hover:bg-sunken")}
          >
            Tous
          </button>
          {(["chaud", "tiede", "froid"] as Temperature[]).map((t) => {
            const Picto = PICTO_TEMP[t];
            const actif = temp === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={actif}
                onClick={() => setTemp(actif ? "toutes" : t)}
                className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", actif ? "text-white" : "border-line-strong bg-surface text-text hover:bg-sunken")}
                style={actif ? { background: COULEUR_TEMP[t], borderColor: COULEUR_TEMP[t] } : undefined}
              >
                <Picto aria-hidden className="size-4" style={actif ? undefined : { color: COULEUR_TEMP[t] }} />
                {t === "chaud" ? "Chauds" : t === "tiede" ? "Tièdes" : "Froids"}
                <span className={cn("tabular text-xs", actif ? "text-white/80" : "text-text-3")}>{compteTemp(t)}</span>
              </button>
            );
          })}
        </div>
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 focus-within:border-accent lg:ml-auto lg:w-80">
          <Search aria-hidden className="size-4 shrink-0 text-text-3" />
          <span className="sr-only">Rechercher</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client, ville, référence" className="h-full min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-3 focus:outline-none" />
          {q ? (
            <button type="button" aria-label="Effacer" onClick={() => setQ("")} className="text-text-3 hover:text-text">
              <X className="size-4" />
            </button>
          ) : null}
        </label>
      </div>

      {/* Colonnes */}
      <div className="scroll-nav -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {COLONNES.map((c) => {
          const cartes = visibles.filter(c.filtre).sort((a, b) => {
            // les plus urgents d'abord : chauds, puis les plus anciens
            const poids = (l: LeadGestion) => (l.temperature === "chaud" ? 0 : l.temperature === "tiede" ? 1 : 2);
            return poids(a) - poids(b) || a.recuLe.localeCompare(b.recuLe);
          });
          return (
            <section key={c.id} aria-label={c.titre} className="flex w-80 shrink-0 snap-start flex-col rounded-lg bg-sunken lg:w-auto">
              <header className="rounded-t-lg border-t-4 px-4 pb-3 pt-3" style={{ borderTopColor: c.couleur }}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-text">{c.titre}</h3>
                  <span className="tabular rounded-full bg-surface px-2 text-sm font-semibold text-text">{cartes.length}</span>
                </div>
                <p className="text-xs text-text-3">{c.aide}</p>
              </header>
              <ul className="flex flex-col gap-2 px-2 pb-2">
                {cartes.length === 0 ? <li className="px-2 py-6 text-center text-sm text-text-3">Rien ici</li> : null}
                {cartes.slice(0, PAR_COLONNE).map((l) => {
                  const ecoule = l.attribueLe ? (Date.now() - new Date(l.attribueLe).getTime()) / 60000 : 0;
                  const reste = l.delaiMin - ecoule;
                  const part = Math.min(1, Math.max(0, ecoule / l.delaiMin));
                  const destinataire = l.statut === "a_valider" ? l.suggestion : l.attribueA;
                  return (
                    <li
                      key={l.id}
                      className={cn(
                        "group relative rounded-md border border-line bg-surface p-3 shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lg",
                        enCours === l.id && "opacity-50",
                      )}
                    >
                      <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r-full" style={{ background: l.temperature ? COULEUR_TEMP[l.temperature] : "var(--line-strong)" }} />
                      <div className="flex items-start gap-2 pl-1">
                        <SourcePicto source={l.source} />
                        <div className="min-w-0 flex-1">
                          <Link href={`/lead-management/${l.id}`} className="block truncate text-sm font-semibold text-text after:absolute after:inset-0 focus-visible:outline-none">
                            {l.contact}
                          </Link>
                          <p className="truncate text-xs text-text-2">{l.projet}</p>
                          <p className="text-xs text-text-3" suppressHydrationWarning>
                            {l.ville ?? l.cp}, {ilYa(l.recuLe)}
                          </p>
                        </div>
                      </div>

                      {destinataire ? (
                        <p className="mt-2 flex items-center gap-2 pl-1 text-xs">
                          <span className="min-w-0 truncate text-text-2">
                            {l.statut === "a_valider" ? "Suggéré : " : ""}
                            {destinataire.nom}
                          </span>
                          {destinataire.type === "commercial" ? <NiveauBadge type="ATC" /> : destinataire.niveau ? <NiveauBadge type={destinataire.niveau} /> : null}
                        </p>
                      ) : null}

                      {l.statut === "attribue" ? (
                        <div className="mt-2 pl-1">
                          <div className="h-1 overflow-hidden rounded-full bg-sunken">
                            <div className="h-full rounded-full transition-[width]" style={{ width: `${part * 100}%`, background: reste <= 0 ? "var(--danger)" : part > 0.7 ? "var(--warning)" : "var(--accent)" }} />
                          </div>
                          <p className={cn("mt-1 text-xs", reste <= 0 ? "font-semibold text-danger" : "text-text-3")}>{reste > 0 ? `Encore ${formatDuree(reste)}` : "Délai dépassé"}</p>
                        </div>
                      ) : null}

                      {ETAPES.includes(l.statut) ? (
                        <div className="mt-2 flex gap-1 pl-1" aria-label={`Étape ${ETAPES.indexOf(l.statut) + 1} sur 4`}>
                          {ETAPES.map((e, i) => (
                            <span key={e} className="h-1 flex-1 rounded-full" style={{ background: i <= ETAPES.indexOf(l.statut) ? "var(--accent)" : "var(--line)" }} />
                          ))}
                        </div>
                      ) : null}

                      {peutGerer && c.id === "attribuer" && l.suggestion ? (
                        <Button size="sm" variant="primary" className="relative z-10 mt-3 w-full" disabled={pending} onClick={() => agir(l.id, () => attribuerLead(l.id, null))}>
                          <Check aria-hidden />
                          Attribuer
                        </Button>
                      ) : null}
                      {peutGerer && c.id === "installateur" && reste < l.delaiMin * 0.3 ? (
                        <Button size="sm" variant="secondary" className="relative z-10 mt-3 w-full" disabled={pending} onClick={() => agir(l.id, () => relancerPro(l.id))}>
                          <BellRing aria-hidden />
                          Relancer
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
                {cartes.length > PAR_COLONNE ? <li className="px-2 py-2 text-center text-xs text-text-3">et {cartes.length - PAR_COLONNE} autres, à voir dans la liste</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
