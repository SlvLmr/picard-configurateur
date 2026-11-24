"use client";

import { ArrowLeft, ChevronRight, Download, FileText, Pencil, Plus, Search, Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { enregistrerProduit, lienTelechargement } from "@/app/(app)/mediatheque/actions";
import { PanneauEdition } from "@/components/administration/panneau-edition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Gamme, ProduitMedia, Ressource, StatsMediatheque, TypeRessource } from "@/lib/data/mediatheque";
import { estMiseAJour, formatJour, formatTaille, MARQUES, TYPES } from "./libelles";

// Chargé seulement à l'ouverture : embarque le client de stockage, inutile aux non-administrateurs.
const FormulaireAjout = dynamic(() => import("./formulaire-ajout").then((m) => m.FormulaireAjout), {
  loading: () => <p className="text-sm text-text-3">Chargement du formulaire…</p>,
});

/** Ordre d'affichage des téléchargements d'un produit */
const ORDRE_TYPES: TypeRessource[] = ["doc_commerciale", "doc_technique", "video", "photo"];

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Esquisse de porte propre à chaque gamme, pour reconnaître la gamme d'un coup d'œil. */
function DessinGamme({ code, className }: { code: string; className?: string }) {
  const trait = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      {code === "pavillonnaires" ? (
        <>
          <path d="M10 36 40 12l30 24" {...trait} />
          <path d="M18 30v40h44V30" {...trait} />
          <path d="M32 70V44h16v26" {...trait} />
          <circle cx="44" cy="58" r="1.6" fill="currentColor" />
        </>
      ) : code === "techniques" ? (
        <>
          <path d="M22 70V12h36v58" {...trait} />
          <path d="M28 22h24M28 28h24M28 34h24" {...trait} strokeWidth={1.4} />
          <path d="M14 70h52" {...trait} />
          <path d="M52 46v6" {...trait} />
        </>
      ) : code === "hall" ? (
        <>
          <path d="M12 70V12h56v58" {...trait} />
          <path d="M40 12v58" {...trait} />
          <path d="M18 18h16v46H18zM46 18h16v46H46z" {...trait} strokeWidth={1.4} />
          <path d="M36 42v6M44 42v6" {...trait} />
        </>
      ) : (
        <>
          <path d="M20 70V10h40v60" {...trait} />
          <path d="M26 70V16h28v54" {...trait} strokeWidth={1.4} />
          <path d="M48 42h3" {...trait} />
          <path d="M12 70h56" {...trait} />
        </>
      )}
    </svg>
  );
}

function LigneRessource({ r }: { r: Ressource }) {
  const toast = useToast();
  const [enCours, start] = useTransition();
  const t = TYPES[r.type];
  const Icone = t.icon;
  const telecharger = () =>
    start(async () => {
      const res = await lienTelechargement(r.id);
      toast(res.message);
      if (res.ok && res.donnee) window.location.assign(res.donnee);
    });
  return (
    <li className="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sunken">
      <Icone aria-hidden className="size-4 shrink-0 text-text-3" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-text">{r.titre}</span>
          {r.nouveau ? <Badge variant="success">Nouveau</Badge> : estMiseAJour(r.version, r.misAJourLe) ? <Badge variant="accent">Mis à jour</Badge> : null}
        </p>
        <p className="truncate text-xs text-text-3">
          {[r.format, formatTaille(r.tailleOctets), `v${r.version}`, formatJour(r.misAJourLe)].filter(Boolean).join(", ")}
        </p>
      </div>
      <Button size="sm" variant="secondary" disabled={enCours || !r.fichierChemin} onClick={telecharger} aria-label={`Télécharger ${r.titre}`} title={r.fichierChemin ? "Télécharger" : "Fichier pas encore déposé"}>
        <Download aria-hidden />
        <span className="hidden sm:inline">Télécharger</span>
      </Button>
    </li>
  );
}

/** Les quatre familles de téléchargements d'un produit (ou d'une gamme), en colonnes. */
function Telechargements({ ressources }: { ressources: Ressource[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ORDRE_TYPES.map((type) => {
        const t = TYPES[type];
        const Icone = t.icon;
        const liste = ressources.filter((r) => r.type === type);
        return (
          <section key={type} className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <h3 className="mb-2 flex items-center gap-2 px-3 font-semibold text-text">
              <Icone aria-hidden className="size-4 text-accent" />
              {t.pluriel}
              <span className="tabular ml-auto text-sm font-normal text-text-3">{liste.length}</span>
            </h3>
            {liste.length ? (
              <ul className="flex flex-col">
                {liste.map((r) => (
                  <LigneRessource key={r.id} r={r} />
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2 text-sm text-text-3">Rien pour l’instant.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

type FormProduit = { id: string | null; gamme: string; nom: string; description: string; marque: string; actif: boolean };

/** Médiathèque : une gamme, ses produits, et pour chaque produit ses documents, vidéos et photos. */
export function Mediatheque({
  ressources,
  gammes,
  produits,
  peutPublier,
}: {
  ressources: Ressource[];
  stats: StatsMediatheque | null;
  gammes: Gamme[];
  produits: ProduitMedia[];
  peutPublier: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [gamme, setGamme] = useState(gammes[0]?.code ?? "");
  const [produitId, setProduitId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ajout, setAjout] = useState(false);
  const [edition, setEdition] = useState<FormProduit | null>(null);

  const g = gammes.find((x) => x.code === gamme) ?? null;
  const produitsGamme = produits.filter((p) => p.gammeCode === gamme);
  const produit = produits.find((p) => p.id === produitId) ?? null;
  const parProduit = (id: string) => ressources.filter((r) => r.produitId === id);
  const generauxGamme = ressources.filter((r) => !r.produitId && r.gammeCode === gamme);
  const generaux = ressources.filter((r) => !r.produitId && !r.gammeCode);
  const compteGamme = (code: string) => ressources.filter((r) => r.gammeCode === code).length;

  const resultats = useMemo(() => {
    const n = sansAccents(q.trim());
    if (!n) return null;
    const nomProduit = new Map(produits.map((p) => [p.id, p.nom]));
    return ressources.filter((r) => sansAccents(`${r.titre} ${r.description ?? ""} ${r.produitId ? nomProduit.get(r.produitId) ?? "" : ""} ${r.gamme ?? ""}`).includes(n));
  }, [q, ressources, produits]);

  const cible = produit ? `p:${produit.id}` : gamme ? `g:${gamme}` : "";

  return (
    <>
      <PageHeader
        title="Médiathèque"
        meta={ressources.some((r) => r.demo) || produits.some((p) => p.demo) ? <Badge variant="warning">Contenus de démonstration</Badge> : null}
        description="Choisissez une gamme, puis un produit : sa documentation commerciale et technique, ses vidéos et ses photos, toujours dans la dernière version."
        actions={
          peutPublier ? (
            <span className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setEdition({ id: null, gamme, nom: "", description: "", marque: "picard", actif: true })}>
                <Plus aria-hidden />
                Ajouter un produit
              </Button>
              <Button variant="primary" onClick={() => setAjout((a) => !a)}>
                <Plus aria-hidden />
                Ajouter un fichier
              </Button>
            </span>
          ) : null
        }
      />

      {ajout ? (
        <div className="mb-8">
          <FormulaireAjout key={cible} onDone={() => setAjout(false)} gammes={gammes} produits={produits} cible={cible} />
        </div>
      ) : null}

      {/* Recherche globale */}
      <label className="mb-6 flex h-12 max-w-xl items-center gap-3 rounded-full border border-line-strong bg-surface px-4 shadow-card focus-within:border-accent">
        <Search aria-hidden className="size-4 text-text-3" />
        <span className="sr-only">Rechercher un document</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit, une notice, un catalogue…" className="h-full min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-3 focus:outline-none" />
        {q ? (
          <button type="button" aria-label="Effacer" onClick={() => setQ("")} className="text-text-3 hover:text-text">
            <X className="size-4" />
          </button>
        ) : null}
      </label>

      {resultats ? (
        <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
          <h2 className="mb-2 px-3 font-semibold text-text">
            {resultats.length} résultat{resultats.length > 1 ? "s" : ""}
          </h2>
          {resultats.length ? (
            <ul className="flex flex-col">
              {resultats.map((r) => (
                <LigneRessource key={r.id} r={r} />
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-text-3">Aucun document ne correspond à votre recherche.</p>
          )}
        </section>
      ) : (
        <>
          {/* Gammes */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {gammes.map((x) => {
              const actif = x.code === gamme;
              const nb = produits.filter((p) => p.gammeCode === x.code && p.actif).length;
              return (
                <button
                  key={x.code}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => {
                    setGamme(x.code);
                    setProduitId(null);
                  }}
                  className={cn(
                    "group relative flex flex-col items-start gap-3 overflow-hidden rounded-lg border p-4 text-left transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 sm:p-5",
                    actif ? "border-transparent bg-nav-gradient text-white shadow-lg" : "border-line bg-surface text-text shadow-card hover:shadow-lg",
                  )}
                >
                  <DessinGamme code={x.code} className={cn("size-12 transition-colors sm:size-16", actif ? "text-cta" : "text-accent")} />
                  <span className="font-display text-base font-semibold leading-tight">{x.nom}</span>
                  <span className={cn("text-xs", actif ? "text-white/70" : "text-text-3")}>
                    {nb} produit{nb > 1 ? "s" : ""}, {compteGamme(x.code)} fichier{compteGamme(x.code) > 1 ? "s" : ""}
                  </span>
                  {actif ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-cta" /> : null}
                </button>
              );
            })}
          </div>

          {produit ? (
            /* Produit choisi */
            <section className="mt-8">
              <button type="button" onClick={() => setProduitId(null)} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                <ArrowLeft aria-hidden className="size-4" />
                {g?.nom}
              </button>
              <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-5 shadow-card">
                <span className="flex size-20 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))]">
                  <DessinGamme code={produit.gammeCode} className="size-12 text-accent" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-3">{g?.nom}</p>
                  <h2 className="font-display text-xl font-semibold text-text">{produit.nom}</h2>
                  {produit.description ? <p className="mt-1 text-sm text-text-2">{produit.description}</p> : null}
                </div>
                <Badge>{MARQUES[produit.marque]}</Badge>
                {peutPublier ? (
                  <Button size="sm" variant="ghost" onClick={() => setEdition({ id: produit.id, gamme: produit.gammeCode, nom: produit.nom, description: produit.description ?? "", marque: produit.marque, actif: produit.actif })}>
                    <Pencil aria-hidden />
                    Modifier
                  </Button>
                ) : null}
              </div>
              <Telechargements ressources={parProduit(produit.id)} />
            </section>
          ) : (
            /* Produits de la gamme */
            <section className="mt-8">
              <h2 className="mb-1 font-display text-lg font-semibold text-text">{g?.nom}</h2>
              {g?.description ? <p className="mb-4 text-sm text-text-2">{g.description}</p> : null}
              {produitsGamme.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center text-sm text-text-2">Aucun produit dans cette gamme pour l’instant.</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {produitsGamme.map((p) => {
                    const fichiers = parProduit(p.id);
                    const nouveau = fichiers.some((r) => r.nouveau || estMiseAJour(r.version, r.misAJourLe));
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setProduitId(p.id)}
                          className={cn("group flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-surface text-left shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg", !p.actif && "opacity-60")}
                        >
                          <span className="relative flex h-40 items-center justify-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--accent)_16%,var(--surface)),var(--surface-sunken))]">
                            <DessinGamme code={p.gammeCode} className="size-20 text-accent transition-transform duration-300 group-hover:scale-110" />
                            {nouveau ? (
                              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-cta px-2 py-0.5 text-xs font-semibold text-cta-text">
                                <Sparkles aria-hidden className="size-3" />
                                Nouveautés
                              </span>
                            ) : null}
                          </span>
                          <span className="flex flex-1 flex-col gap-2 p-4">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-display text-base font-semibold text-text">{p.nom}</span>
                              <ChevronRight aria-hidden className="size-4 text-text-3 transition-transform group-hover:translate-x-0.5" />
                            </span>
                            {p.description ? <span className="line-clamp-2 text-sm text-text-2">{p.description}</span> : null}
                            <span className="mt-auto flex flex-wrap gap-2 pt-2">
                              {ORDRE_TYPES.map((t) => {
                                const n = fichiers.filter((r) => r.type === t).length;
                                const Icone = TYPES[t].icon;
                                return (
                                  <span key={t} title={TYPES[t].pluriel} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs", n ? "bg-accent-soft text-accent-strong" : "bg-sunken text-text-3")}>
                                    <Icone aria-hidden className="size-3" />
                                    {n}
                                  </span>
                                );
                              })}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {generauxGamme.length ? (
                <div className="mt-8">
                  <h3 className="mb-3 font-semibold text-text">Documents de toute la gamme</h3>
                  <Telechargements ressources={generauxGamme} />
                </div>
              ) : null}
            </section>
          )}

          {/* Documents généraux */}
          {generaux.length && !produit ? (
            <section className="mt-10">
              <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-text">
                <FileText aria-hidden className="size-5 text-accent" />
                Documents généraux
              </h2>
              <p className="mb-4 text-sm text-text-2">Catalogues, tarifs, certifications et supports communs à toutes les gammes.</p>
              <Telechargements ressources={generaux} />
            </section>
          ) : null}
        </>
      )}

      {/* Produit : création ou modification */}
      {edition ? (
        <PanneauEdition
          titre={edition.id ? "Modifier le produit" : "Ajouter un produit"}
          description={edition.nom || undefined}
          onFermer={() => setEdition(null)}
          pied={
            <>
              <Button variant="ghost" onClick={() => setEdition(null)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                disabled={pending || !edition.nom.trim()}
                onClick={() =>
                  start(async () => {
                    const r = await enregistrerProduit(edition.id, edition);
                    toast(r.message);
                    if (r.ok) setEdition(null);
                  })
                }
              >
                Enregistrer
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Gamme" htmlFor="pr-gamme">
              <Select id="pr-gamme" value={edition.gamme} onChange={(e) => setEdition({ ...edition, gamme: e.target.value })}>
                {gammes.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.nom}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nom du produit" htmlFor="pr-nom">
              <Input id="pr-nom" value={edition.nom} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="pr-desc">
              <textarea
                id="pr-desc"
                rows={3}
                value={edition.description}
                onChange={(e) => setEdition({ ...edition, description: e.target.value })}
                className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
            </Field>
            <Field label="Marque" htmlFor="pr-marque">
              <Select id="pr-marque" value={edition.marque} onChange={(e) => setEdition({ ...edition, marque: e.target.value })}>
                <option value="picard">Picard Serrures</option>
                <option value="eliot">Eliot</option>
                <option value="commune">Toutes marques</option>
              </Select>
            </Field>
            <label className="flex items-center gap-3 text-sm font-medium text-text">
              <input type="checkbox" checked={edition.actif} onChange={(e) => setEdition({ ...edition, actif: e.target.checked })} className="size-4 accent-[var(--accent)]" />
              Produit visible dans la médiathèque
            </label>
          </div>
        </PanneauEdition>
      ) : null}
    </>
  );
}
