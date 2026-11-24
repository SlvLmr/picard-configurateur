"use client";

import { Download, FolderOpen, Package, Plus, RefreshCw, Search, Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { Segmented } from "@/components/ui/segmented";
import type { MarqueRessource, Ressource, StatsMediatheque, TypeRessource } from "@/lib/data/mediatheque";
import { CarteRessource } from "./carte-ressource";
import { DetailRessource } from "./detail-ressource";
import { MARQUES, TYPES } from "./libelles";

// Chargé seulement à l'ouverture : embarque le client de stockage, inutile aux non-administrateurs.
const FormulaireAjout = dynamic(() => import("./formulaire-ajout").then((m) => m.FormulaireAjout), {
  loading: () => <p className="text-sm text-text-3">Chargement du formulaire…</p>,
});

type FiltreType = "tout" | TypeRessource;

const sansAccents = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function Mediatheque({ ressources, stats, peutPublier }: { ressources: Ressource[]; stats: StatsMediatheque | null; peutPublier: boolean }) {
  const [ajout, setAjout] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState<FiltreType>("tout");
  const [gamme, setGamme] = useState("toutes");
  const [marque, setMarque] = useState<"toutes" | MarqueRessource>("toutes");
  const [kit, setKit] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);

  const gammes = useMemo(() => Array.from(new Set(ressources.map((r) => r.gamme).filter(Boolean))).sort() as string[], [ressources]);
  const kits = useMemo(() => {
    const m = new Map<string, Ressource[]>();
    ressources.forEach((r) => r.kit && m.set(r.kit, [...(m.get(r.kit) ?? []), r]));
    return Array.from(m.entries());
  }, [ressources]);

  // Filtres hors nature : les compteurs du sélecteur de nature restent cohérents avec la recherche
  const baseFiltree = useMemo(() => {
    const n = sansAccents(q.trim());
    return ressources.filter(
      (r) =>
        (gamme === "toutes" || r.gamme === gamme) &&
        (marque === "toutes" || r.marque === marque || r.marque === "commune") &&
        (!kit || r.kit === kit) &&
        (!n || sansAccents(`${r.titre} ${r.description ?? ""} ${r.gamme ?? ""}`).includes(n)),
    );
  }, [ressources, q, gamme, marque, kit]);
  const visibles = type === "tout" ? baseFiltree : baseFiltree.filter((r) => r.type === type);
  const choisie = ressources.find((r) => r.id === selection) ?? null;
  const filtresActifs = q || type !== "tout" || gamme !== "toutes" || marque !== "toutes" || kit;

  const reinitialiser = () => {
    setQ("");
    setType("tout");
    setGamme("toutes");
    setMarque("toutes");
    setKit(null);
  };

  return (
    <>
      <PageHeader
        title="Médiathèque"
        meta={ressources.some((r) => r.demo) ? <Badge variant="warning">Ressources de démonstration</Badge> : null}
        description="Photos, vidéos, documentations commerciales et techniques. Toujours la dernière version, filtrée selon votre profil."
        actions={
          peutPublier && !ajout ? (
            <Button variant="primary" size="lg" onClick={() => setAjout(true)}>
              <Plus aria-hidden />
              Ajouter une ressource
            </Button>
          ) : null
        }
      />

      {ajout ? (
        <div className="mb-8">
          <FormulaireAjout onDone={() => setAjout(false)} />
        </div>
      ) : null}

      <KpiBand
        items={[
          { label: "Ressources disponibles", value: stats?.ressources ?? ressources.length, icon: FolderOpen, note: "Selon votre profil" },
          { label: "Nouveautés", value: stats?.nouveautes ?? 0, icon: Sparkles, tone: "cta", note: "30 derniers jours" },
          { label: "Mises à jour", value: stats?.mises_a_jour ?? 0, icon: RefreshCw, tone: "warning", note: "Nouvelle version publiée" },
          { label: "Téléchargements", value: stats?.telechargements ?? 0, icon: Download, tone: "success", note: "30 derniers jours" },
        ]}
      />

      {kits.length ? (
        <Panel className="mt-8">
          <PanelHeader title="Kits de lancement" description="Tout ce qu’il faut pour une opération, réuni au même endroit" />
          <ul>
            {kits.map(([nom, items]) => (
              <li key={nom} className="border-t border-line">
                <div className="flex items-center gap-3 px-6 py-4">
                  <Picto icon={Package} tone="cta" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text">{nom}</p>
                    <p className="text-xs text-text-3">
                      {items.length} ressource{items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button size="sm" variant={kit === nom ? "primary" : "secondary"} onClick={() => setKit(kit === nom ? null : nom)} aria-pressed={kit === nom}>
                    {kit === nom ? "Affiché" : "Voir le kit"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <section aria-label="Ressources" className="mt-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-text-3" aria-hidden />
              <label htmlFor="media-recherche" className="sr-only">
                Rechercher une ressource
              </label>
              <Input id="media-recherche" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher : notice, catalogue, Altitude…" className="pl-10" />
            </div>
            <label htmlFor="media-gamme" className="sr-only">
              Gamme
            </label>
            <Select id="media-gamme" value={gamme} onChange={(e) => setGamme(e.target.value)} className="w-auto">
              <option value="toutes">Toutes les gammes</option>
              {gammes.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <label htmlFor="media-marque" className="sr-only">
              Marque
            </label>
            <Select id="media-marque" value={marque} onChange={(e) => setMarque(e.target.value as typeof marque)} className="w-auto">
              <option value="toutes">Toutes les marques</option>
              <option value="picard">{MARQUES.picard}</option>
              <option value="eliot">{MARQUES.eliot}</option>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="max-w-full overflow-x-auto">
              <Segmented
                label="Nature des ressources"
                value={type}
                onChange={setType}
                options={[
                  { value: "tout", label: "Tout", count: baseFiltree.length },
                  ...(Object.keys(TYPES) as TypeRessource[]).map((k) => ({
                    value: k,
                    label: TYPES[k].pluriel,
                    count: baseFiltree.filter((r) => r.type === k).length,
                  })),
                ]}
              />
            </div>
            {kit ? (
              <Badge variant="accent" className="h-8 px-3 text-sm">
                Kit {kit}
                <button type="button" onClick={() => setKit(null)} aria-label={`Retirer le filtre du kit ${kit}`} className="-mr-1 rounded-sm">
                  <X aria-hidden />
                </button>
              </Badge>
            ) : null}
            {filtresActifs ? (
              <Button variant="ghost" size="sm" onClick={reinitialiser}>
                Effacer les filtres
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          {visibles.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {visibles.map((r) => (
                <li key={r.id}>
                  <CarteRessource r={r} active={r.id === selection} onSelect={() => setSelection(r.id === selection ? null : r.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={ressources.length ? "Aucune ressource ne correspond" : "La médiathèque est encore vide"}
              action={
                ressources.length ? (
                  <Button onClick={reinitialiser}>Effacer les filtres</Button>
                ) : peutPublier ? (
                  <Button variant="primary" onClick={() => setAjout(true)}>
                    <Plus aria-hidden />
                    Ajouter une ressource
                  </Button>
                ) : null
              }
            >
              {ressources.length
                ? "Essayez un autre mot-clé ou retirez un filtre."
                : "Les premières ressources apparaîtront ici dès leur publication par l’équipe marketing."}
            </EmptyState>
          )}

          <div className="order-first xl:sticky xl:top-24 xl:order-none">
            {choisie ? (
              <DetailRessource r={choisie} onClose={() => setSelection(null)} />
            ) : (
              <p className="hidden rounded-lg border border-dashed border-line-strong px-6 py-8 text-sm text-text-2 xl:block">
                Choisissez une ressource pour voir son détail, ses publics et la télécharger.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
