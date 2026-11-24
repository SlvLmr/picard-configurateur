"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { enregistrerCompte } from "@/app/(app)/administration/actions";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import type { CommercialAdmin, CompteAdmin } from "@/lib/data/administration";
import { PanneauEdition } from "./panneau-edition";

type Form = { raisonSociale: string; type: CompteAdmin["type"]; niveau: CompteAdmin["niveau"]; numero: string; cp: string; ville: string; commercialId: string | null; actif: boolean };
type Filtre = "tous" | "Elite" | "Premium" | "Officiel" | "autres" | "inactifs";
const PAGE = 50;
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export function GestionClients({ comptes, commerciaux }: { comptes: CompteAdmin[]; commerciaux: CommercialAdmin[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [commercial, setCommercial] = useState<string>("tous");
  const [nb, setNb] = useState(PAGE);
  const [edition, setEdition] = useState<{ id: string | null; f: Form } | null>(null);

  const nomCommercial = useMemo(() => new Map(commerciaux.map((c) => [c.id, `${c.prenom} ${cap(c.nom)}`])), [commerciaux]);
  const optionsCommerciaux = commerciaux.filter((c) => c.actif).map((c) => ({ value: c.id, label: `${c.prenom} ${cap(c.nom)}`, detail: cap(c.equipe), groupe: cap(c.equipe) }));

  const liste = comptes.filter((c) => {
    if (filtre === "inactifs" ? c.actif : !c.actif) return false;
    if (filtre === "autres" && c.niveau) return false;
    if (["Elite", "Premium", "Officiel"].includes(filtre) && c.niveau !== filtre) return false;
    if (commercial !== "tous" && c.commercialId !== commercial) return false;
    return `${c.raisonSociale} ${c.ville ?? ""} ${c.cp ?? ""} ${c.numero ?? ""}`.toLowerCase().includes(q.toLowerCase());
  });
  const compte = (f: Filtre) => comptes.filter((c) => (f === "inactifs" ? !c.actif : c.actif && (f === "tous" || (f === "autres" ? !c.niveau : c.niveau === f)))).length;

  const ouvrir = (c?: CompteAdmin) =>
    setEdition(c ? { id: c.id, f: { raisonSociale: c.raisonSociale, type: c.type, niveau: c.niveau, numero: c.numero ?? "", cp: c.cp ?? "", ville: c.ville ?? "", commercialId: c.commercialId, actif: c.actif } } : { id: null, f: { raisonSociale: "", type: "IAP", niveau: "Officiel", numero: "", cp: "", ville: "", commercialId: null, actif: true } });
  const set = (patch: Partial<Form>) => edition && setEdition({ ...edition, f: { ...edition.f, ...patch } });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Entreprises clientes : type, niveau IAP, commercial responsable. Le niveau et la zone servent à l’attribution des leads et aux droits d’accès."
        actions={<Button variant="primary" onClick={() => ouvrir()}><Plus aria-hidden />Ajouter un client</Button>}
      />
      <Panel>
        <div className="flex flex-col gap-3 px-6 py-4">
          <div className="overflow-x-auto">
            <Segmented
              label="Filtrer par niveau"
              value={filtre}
              onChange={(v) => { setFiltre(v); setNb(PAGE); }}
              options={[
                { value: "tous", label: "Tous", count: compte("tous") },
                { value: "Elite", label: "Elite", count: compte("Elite") },
                { value: "Premium", label: "Premium", count: compte("Premium") },
                { value: "Officiel", label: "Officiel", count: compte("Officiel") },
                { value: "autres", label: "Autres", count: compte("autres") },
                { value: "inactifs", label: "Inactifs", count: compte("inactifs") },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-line-strong bg-surface px-3">
              <Search aria-hidden className="size-4 shrink-0 text-text-3" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setNb(PAGE); }} placeholder="Raison sociale, ville, code postal, numéro" aria-label="Rechercher un client" className="min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-3 focus:outline-none" />
            </div>
            <Combobox label="Commercial" className="sm:w-72" value={commercial} onChange={setCommercial} options={[{ value: "tous", label: "Tous les commerciaux" }, ...optionsCommerciaux]} />
          </div>
        </div>
        {liste.length === 0 ? (
          <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun client ne correspond à ces critères.</p>
        ) : (
          <ul>
            {liste.slice(0, nb).map((c) => (
              <li key={c.id} className="border-t border-line">
                <button type="button" onClick={() => ouvrir(c)} className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-sunken">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-text">{c.raisonSociale}</span>
                      {c.niveau ? <NiveauBadge type={c.niveau} /> : <Badge>{c.type}</Badge>}
                      {!c.actif ? <Badge variant="danger">Inactif</Badge> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-text-2">
                      {[c.ville, c.cp].filter(Boolean).join(", ") || "Adresse non renseignée"}
                      {c.commercialId ? `, ${nomCommercial.get(c.commercialId) ?? ""}` : ", sans commercial"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {liste.length > nb ? (
          <div className="border-t border-line px-6 py-4">
            <Button size="sm" onClick={() => setNb(nb + PAGE)}>Afficher plus ({liste.length - nb} restants)</Button>
          </div>
        ) : null}
      </Panel>

      {edition ? (
        <PanneauEdition
          titre={edition.id ? "Modifier le client" : "Ajouter un client"}
          description={edition.f.raisonSociale || undefined}
          onFermer={() => setEdition(null)}
          pied={
            <>
              <Button
                variant="primary"
                disabled={pending || !edition.f.raisonSociale.trim()}
                onClick={() =>
                  start(async () => {
                    const r = await enregistrerCompte(edition.id, edition.f);
                    toast(r.message);
                    if (r.ok) setEdition(null);
                  })
                }
              >
                Enregistrer
              </Button>
              <Button variant="ghost" onClick={() => setEdition(null)}>Annuler</Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Raison sociale" htmlFor="k-raison" className="sm:col-span-2"><Input id="k-raison" value={edition.f.raisonSociale} onChange={(e) => set({ raisonSociale: e.target.value })} /></Field>
            <Field label="Type" htmlFor="k-type">
              <Combobox id="k-type" value={edition.f.type} onChange={(v) => set({ type: v as Form["type"], niveau: v === "IAP" ? edition.f.niveau ?? "Officiel" : null })} options={["IAP", "Serrurier", "Fenêtrier", "Autre"].map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Niveau IAP" htmlFor="k-niveau">
              <Combobox id="k-niveau" disabled={edition.f.type !== "IAP"} value={edition.f.niveau ?? ""} onChange={(v) => set({ niveau: v as Form["niveau"] })} options={["Elite", "Premium", "Officiel"].map((n) => ({ value: n, label: n }))} />
            </Field>
            <Field label="Numéro client" htmlFor="k-num"><Input id="k-num" value={edition.f.numero} onChange={(e) => set({ numero: e.target.value })} /></Field>
            <Field label="Code postal" htmlFor="k-cp" hint="Détermine le département pour les leads"><Input id="k-cp" inputMode="numeric" value={edition.f.cp} onChange={(e) => set({ cp: e.target.value })} /></Field>
            <Field label="Ville" htmlFor="k-ville" className="sm:col-span-2"><Input id="k-ville" value={edition.f.ville} onChange={(e) => set({ ville: e.target.value })} /></Field>
            <Field label="Commercial responsable" htmlFor="k-com" className="sm:col-span-2">
              <Combobox id="k-com" placeholder="Choisir un commercial" value={edition.f.commercialId} onChange={(v) => set({ commercialId: v })} options={optionsCommerciaux} />
            </Field>
            <label className="flex items-center gap-3 text-sm font-medium text-text sm:col-span-2">
              <input type="checkbox" checked={edition.f.actif} onChange={(e) => set({ actif: e.target.checked })} className="size-4 accent-[var(--accent)]" />
              Client actif
            </label>
          </div>
        </PanneauEdition>
      ) : null}
    </>
  );
}
