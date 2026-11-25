"use client";

import { BellRing, Check, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { attribuerLead, attribuerLeads, relancerPro } from "@/app/(app)/leads/actions";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Attribution, LeadGestion } from "@/lib/data/types";
import { ilYa } from "@/lib/temps";
import { SourcePicto } from "./source-picto";
import { SOURCES_LEAD, STATUTS_LEAD, TEMPERATURES } from "./statuts";

type Onglet = "a_valider" | "attente" | "en_cours" | "termines" | "tous";
type Tri = "recents" | "anciens" | "departement";

const DANS_ONGLET: Record<Onglet, (l: LeadGestion) => boolean> = {
  a_valider: (l) => l.statut === "a_valider",
  attente: (l) => l.statut === "attribue",
  en_cours: (l) => ["accepte", "contacte", "rdv", "devis"].includes(l.statut),
  termines: (l) => ["signe", "pose", "perdu"].includes(l.statut),
  tous: () => true,
};

const PAR_PAGE = 40;

const sansAccents = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Délai d'acceptation dépassé pour un lead attribué. */
export const delaiDepasse = (l: LeadGestion) =>
  l.statut === "attribue" && !!l.attribueLe && Date.now() - new Date(l.attribueLe).getTime() > l.delaiMin * 60000;

function Destinataire({ a, prefixe }: { a: Attribution | null; prefixe?: string }) {
  if (!a) return <span className="text-sm text-danger">Aucun professionnel trouvé</span>;
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-sm font-semibold text-text">
        {prefixe ? <span className="font-normal text-text-3">{prefixe} </span> : null}
        {a.nom}
      </span>
      <span>{a.type === "commercial" ? <NiveauBadge type="ATC" /> : a.niveau ? <NiveauBadge type={a.niveau} /> : <NiveauBadge type="Client" />}</span>
    </span>
  );
}

/** Poste de travail du Lead Manager : tous les leads, filtres, actions unitaires et groupées. */
export function GestionLeads({ leads, peutGerer }: { leads: LeadGestion[]; peutGerer: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [onglet, setOnglet] = useState<Onglet>("a_valider");
  const [q, setQ] = useState("");
  const [source, setSource] = useState("toutes");
  const [dep, setDep] = useState("tous");
  const [periode, setPeriode] = useState("365");
  const [gros, setGros] = useState(false);
  const [temp, setTemp] = useState("toutes");
  const [tri, setTri] = useState<Tri>("recents");
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [limite, setLimite] = useState(PAR_PAGE);
  const [enCours, setEnCours] = useState<string | null>(null);

  const departements = useMemo(
    () => Array.from(new Set(leads.map((l) => l.departement).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    [leads],
  );

  const filtresHorsOnglet = useMemo(() => {
    const n = sansAccents(q.trim());
    const depuis = Date.now() - Number(periode) * 86400000;
    return leads.filter(
      (l) =>
        (!n || sansAccents(`${l.contact} ${l.ville ?? ""} ${l.reference} ${l.cp} ${l.projet}`).includes(n)) &&
        (source === "toutes" || l.source === source) &&
        (dep === "tous" || l.departement === dep) &&
        (!gros || l.grosProjet) &&
        (temp === "toutes" || (temp === "non" ? !l.temperature : l.temperature === temp)) &&
        new Date(l.recuLe).getTime() >= depuis,
    );
  }, [leads, q, source, dep, periode, gros, temp]);

  const compte = (o: Onglet) => filtresHorsOnglet.filter(DANS_ONGLET[o]).length;

  const visibles = useMemo(() => {
    const liste = filtresHorsOnglet.filter(DANS_ONGLET[onglet]);
    const parDate = (a: LeadGestion, b: LeadGestion) => a.recuLe.localeCompare(b.recuLe);
    if (tri === "anciens") return [...liste].sort(parDate);
    if (tri === "departement") return [...liste].sort((a, b) => (a.departement ?? "").localeCompare(b.departement ?? "", "fr", { numeric: true }) || -parDate(a, b));
    return [...liste].sort((a, b) => -parDate(a, b));
  }, [filtresHorsOnglet, onglet, tri]);

  const selectionnables = visibles.filter((l) => l.statut === "a_valider" && l.suggestion);
  const toutSelectionne = selectionnables.length > 0 && selectionnables.every((l) => selection.includes(l.id));
  const filtresActifs = [source !== "toutes", dep !== "tous", periode !== "365", gros, temp !== "toutes"].filter(Boolean).length;

  const basculer = (id: string) => setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const executer = (id: string | null, f: () => Promise<{ ok: boolean; message: string }>, apres?: () => void) => {
    setEnCours(id);
    start(async () => {
      const r = await f();
      setEnCours(null);
      toast(r.message);
      if (r.ok) apres?.();
    });
  };

  const changerOnglet = (o: Onglet) => {
    setOnglet(o);
    setSelection([]);
    setLimite(PAR_PAGE);
  };

  return (
    <Panel>
      {/* Onglets */}
      <div className="overflow-x-auto px-6 pb-4 pt-5">
        <Segmented
          label="Statut des leads"
          value={onglet}
          onChange={changerOnglet}
          options={[
            { value: "a_valider", label: "À valider", count: compte("a_valider") },
            { value: "attente", label: "En attente de l’installateur", count: compte("attente") },
            { value: "en_cours", label: "En cours", count: compte("en_cours") },
            { value: "termines", label: "Terminés", count: compte("termines") },
            { value: "tous", label: "Tous", count: compte("tous") },
          ]}
        />
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col gap-3 px-6 pb-4">
        <div className="flex gap-2">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 shadow-card focus-within:border-accent">
            <Search aria-hidden className="size-4 shrink-0 text-text-3" />
            <span className="sr-only">Rechercher un lead</span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLimite(PAR_PAGE);
              }}
              placeholder="Contact, ville, référence, code postal"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-3 focus:outline-none"
            />
            {q ? (
              <button type="button" onClick={() => setQ("")} aria-label="Effacer la recherche" className="text-text-3 hover:text-text">
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <Button variant="secondary" className="md:hidden" onClick={() => setFiltresOuverts((o) => !o)} aria-expanded={filtresOuverts}>
            <SlidersHorizontal aria-hidden />
            Filtres{filtresActifs ? ` (${filtresActifs})` : ""}
          </Button>
        </div>
        <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:flex-wrap md:items-center", !filtresOuverts && "hidden md:flex")}>
          <Combobox
            label="Source"
            className="md:w-60"
            value={source}
            onChange={setSource}
            options={[{ value: "toutes", label: "Toutes les sources" }, ...SOURCES_LEAD.map((s) => ({ value: s, label: s }))]}
          />
          <Combobox
            label="Température"
            className="md:w-60"
            value={temp}
            onChange={setTemp}
            options={[
              { value: "toutes", label: "Toutes les températures" },
              { value: "chaud", label: "Chauds" },
              { value: "tiede", label: "Tièdes" },
              { value: "froid", label: "Froids" },
              { value: "non", label: "Non qualifiés" },
            ]}
          />
          <Combobox
            label="Département"
            className="md:w-60"
            value={dep}
            onChange={setDep}
            options={[{ value: "tous", label: "Tous les départements" }, ...departements.map((d) => ({ value: d, label: `Département ${d}` }))]}
          />
          <Combobox
            label="Période"
            className="md:w-60"
            value={periode}
            onChange={setPeriode}
            options={[
              { value: "7", label: "7 derniers jours" },
              { value: "30", label: "30 derniers jours" },
              { value: "90", label: "90 derniers jours" },
              { value: "365", label: "12 derniers mois" },
            ]}
          />
          <Combobox
            label="Tri"
            className="md:w-60"
            value={tri}
            onChange={(v) => setTri(v as Tri)}
            options={[
              { value: "recents", label: "Plus récents d’abord" },
              { value: "anciens", label: "Plus anciens d’abord" },
              { value: "departement", label: "Par département" },
            ]}
          />
          <Button variant={gros ? "primary" : "secondary"} aria-pressed={gros} onClick={() => setGros((g) => !g)}>
            {gros ? <Check aria-hidden /> : null}
            Gros projets
          </Button>
        </div>
      </div>

      {/* Actions groupées */}
      {peutGerer && onglet === "a_valider" && selectionnables.length ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-sunken px-6 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text">
            <input
              type="checkbox"
              checked={toutSelectionne}
              onChange={() => setSelection(toutSelectionne ? [] : selectionnables.map((l) => l.id))}
              className="size-4 accent-[var(--accent)]"
            />
            {selection.length ? `${selection.length} sélectionné${selection.length > 1 ? "s" : ""}` : "Tout sélectionner"}
          </label>
          {selection.length ? (
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button size="sm" variant="ghost" onClick={() => setSelection([])}>
                Désélectionner
              </Button>
              <Button size="sm" variant="primary" disabled={pending} onClick={() => executer(null, () => attribuerLeads(selection), () => setSelection([]))}>
                <Check aria-hidden />
                Attribuer à la suggestion
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Liste */}
      {visibles.length === 0 ? (
        <p className="border-t border-line px-6 py-10 text-sm text-text-2">Aucun lead ne correspond à ces critères.</p>
      ) : (
        <ul>
          {visibles.slice(0, limite).map((l) => {
            const depasse = delaiDepasse(l);
            const selectionnable = peutGerer && l.statut === "a_valider" && !!l.suggestion;
            return (
              <li
                key={l.id}
                className={cn(
                  "group relative grid gap-3 border-t border-line px-6 py-4 transition-colors hover:bg-sunken md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] md:items-center md:gap-4",
                  enCours === l.id && "opacity-60",
                  selection.includes(l.id) && "bg-accent-soft hover:bg-accent-soft",
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  {selectionnable ? (
                    <input
                      type="checkbox"
                      checked={selection.includes(l.id)}
                      onChange={() => basculer(l.id)}
                      aria-label={`Sélectionner le lead ${l.reference}`}
                      className="relative z-10 mt-2 size-4 shrink-0 accent-[var(--accent)]"
                    />
                  ) : null}
                  <SourcePicto source={l.source} />
                  <div className="min-w-0">
                    <Link href={`/lead-management/${l.id}`} className="font-semibold text-text after:absolute after:inset-0 focus-visible:outline-none">
                      {l.contact}
                    </Link>
                    <p className="truncate text-sm text-text-2">{l.projet}</p>
                    <p className="mt-0.5 text-xs text-text-3" suppressHydrationWarning>
                      {l.reference}, {l.ville ?? l.cp} ({l.departement}), reçu {ilYa(l.recuLe)}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 pl-12 md:pl-0">
                  {l.statut === "a_valider" ? <Destinataire a={l.suggestion} prefixe="Suggéré :" /> : <Destinataire a={l.attribueA} />}
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-12 md:pl-0">
                  <Badge variant={STATUTS_LEAD[l.statut].badge}>{STATUTS_LEAD[l.statut].label}</Badge>
                  {l.temperature ? (
                    <Badge variant={TEMPERATURES[l.temperature].badge}>{TEMPERATURES[l.temperature].label}</Badge>
                  ) : l.statut === "a_valider" ? (
                    <Badge>À qualifier</Badge>
                  ) : null}
                  {l.creeParPro ? <Badge>Créé par l’installateur</Badge> : null}
                  {depasse ? <Badge variant="danger">Délai dépassé</Badge> : null}
                  {l.grosProjet ? <Badge variant="warning">Gros projet</Badge> : null}
                </div>

                <div className="relative z-10 flex items-center gap-2 pl-12 md:justify-end md:pl-0">
                  {peutGerer && l.statut === "a_valider" && l.suggestion ? (
                    <Button size="sm" variant="primary" disabled={pending} onClick={() => executer(l.id, () => attribuerLead(l.id, null))}>
                      <Check aria-hidden />
                      Attribuer
                    </Button>
                  ) : null}
                  {peutGerer && l.statut === "attribue" ? (
                    <Button size="sm" variant="secondary" disabled={pending} onClick={() => executer(l.id, () => relancerPro(l.id))}>
                      <BellRing aria-hidden />
                      Relancer
                    </Button>
                  ) : null}
                  <ChevronRight aria-hidden className="hidden size-4 text-text-3 transition-transform group-hover:translate-x-0.5 md:block" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {visibles.length > limite ? (
        <div className="border-t border-line px-6 py-4">
          <Button variant="secondary" onClick={() => setLimite((x) => x + PAR_PAGE)}>
            Afficher {Math.min(PAR_PAGE, visibles.length - limite)} leads de plus
          </Button>
        </div>
      ) : null}
    </Panel>
  );
}
