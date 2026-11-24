"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { enregistrerCommercial } from "@/app/(app)/administration/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { CommercialAdmin } from "@/lib/data/administration";
import { PanneauEdition } from "./panneau-edition";

type Form = { prenom: string; nom: string; equipe: string; fonction: string; email: string; telephone: string; iapObjectif: number; actif: boolean };
const VIDE: Form = { prenom: "", nom: "", equipe: "", fonction: "ATC", email: "", telephone: "", iapObjectif: 0, actif: true };
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export function GestionCommerciaux({ commerciaux }: { commerciaux: CommercialAdmin[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [zone, setZone] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [edition, setEdition] = useState<{ id: string | null; f: Form } | null>(null);

  const zones = useMemo(() => {
    const m = new Map<string, { atc: number; comptes: number; iap: number }>();
    for (const c of commerciaux.filter((x) => x.actif)) {
      const z = m.get(c.equipe) ?? { atc: 0, comptes: 0, iap: 0 };
      m.set(c.equipe, { atc: z.atc + 1, comptes: z.comptes + c.comptes, iap: z.iap + c.iap });
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [commerciaux]);

  const liste = commerciaux.filter((c) => (!zone || c.equipe === zone) && `${c.prenom} ${c.nom} ${c.fonction ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  const ouvrir = (c?: CommercialAdmin) =>
    setEdition(c ? { id: c.id, f: { prenom: c.prenom, nom: c.nom, equipe: c.equipe, fonction: c.fonction ?? "", email: c.email ?? "", telephone: c.telephone ?? "", iapObjectif: c.iapObjectif, actif: c.actif } } : { id: null, f: { ...VIDE, equipe: zone ?? "" } });

  const set = (patch: Partial<Form>) => edition && setEdition({ ...edition, f: { ...edition.f, ...patch } });

  return (
    <>
      <PageHeader
        title="Commerciaux et zones"
        description="Les zones regroupent les commerciaux. Le portefeuille de chaque commercial se règle depuis la rubrique Clients."
        actions={<Button variant="primary" onClick={() => ouvrir()}><Plus aria-hidden />Ajouter un commercial</Button>}
      />

      <ul className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {zones.map(([z, n]) => (
          <li key={z}>
            <button
              type="button"
              onClick={() => setZone(zone === z ? null : z)}
              aria-pressed={zone === z}
              className={cn("flex w-full flex-col items-start gap-1 rounded-lg border bg-surface p-4 text-left shadow-card transition-colors hover:border-text-3", zone === z ? "border-cta" : "border-line")}
            >
              <span className="text-sm font-semibold text-text">{cap(z)}</span>
              <span className="text-xs text-text-3">
                {n.atc} commercia{n.atc > 1 ? "ux" : "l"}, {n.comptes} clients
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 px-6 py-4">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 sm:max-w-sm">
            <Search aria-hidden className="size-4 shrink-0 text-text-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un commercial" aria-label="Rechercher un commercial" className="min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-3 focus:outline-none" />
          </div>
          {zone ? <Button size="sm" variant="ghost" onClick={() => setZone(null)}>Toutes les zones</Button> : null}
        </div>
        <ul>
          {liste.map((c) => (
            <li key={c.id} className="border-t border-line">
              <button type="button" onClick={() => ouvrir(c)} className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-sunken">
                <Avatar name={`${c.prenom} ${c.nom}`} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-text">{c.prenom} {cap(c.nom)}</span>
                  <span className="block truncate text-sm text-text-2">{c.fonction ?? "Commercial"}, {cap(c.equipe)}</span>
                </span>
                <span className="hidden text-right text-sm text-text-2 sm:block">
                  {c.comptes} clients
                  <span className="block text-xs text-text-3">{c.iap} IAP, objectif {c.iapObjectif}</span>
                </span>
                {!c.actif ? <Badge variant="danger">Inactif</Badge> : null}
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {edition ? (
        <PanneauEdition
          titre={edition.id ? "Modifier le commercial" : "Ajouter un commercial"}
          description="Fiche partagée avec l’outil Commerce"
          onFermer={() => setEdition(null)}
          pied={
            <>
              <Button
                variant="primary"
                disabled={pending || !edition.f.nom.trim() || !edition.f.equipe.trim()}
                onClick={() =>
                  start(async () => {
                    const r = await enregistrerCommercial(edition.id, edition.f);
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
            <Field label="Prénom" htmlFor="c-prenom"><Input id="c-prenom" value={edition.f.prenom} onChange={(e) => set({ prenom: e.target.value })} /></Field>
            <Field label="Nom" htmlFor="c-nom"><Input id="c-nom" value={edition.f.nom} onChange={(e) => set({ nom: e.target.value })} /></Field>
            <Field label="Zone" htmlFor="c-zone" hint="Choisissez une zone existante ou saisissez-en une nouvelle" className="sm:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Combobox id="c-zone" className="flex-1" placeholder="Choisir une zone" value={zones.some(([z]) => z === edition.f.equipe.toUpperCase()) ? edition.f.equipe.toUpperCase() : null} onChange={(v) => set({ equipe: v })} options={zones.map(([z]) => ({ value: z, label: cap(z) }))} />
                <Input aria-label="Nouvelle zone" placeholder="Nouvelle zone" value={zones.some(([z]) => z === edition.f.equipe.toUpperCase()) ? "" : edition.f.equipe} onChange={(e) => set({ equipe: e.target.value })} className="sm:w-40" />
              </div>
            </Field>
            <Field label="Fonction" htmlFor="c-fonction"><Input id="c-fonction" value={edition.f.fonction} onChange={(e) => set({ fonction: e.target.value })} placeholder="ATC dédié" /></Field>
            <Field label="Objectif de recrutement IAP" htmlFor="c-obj"><Input id="c-obj" type="number" min={0} value={edition.f.iapObjectif} onChange={(e) => set({ iapObjectif: Number(e.target.value) })} /></Field>
            <Field label="E-mail" htmlFor="c-email"><Input id="c-email" type="email" value={edition.f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label="Téléphone" htmlFor="c-tel"><Input id="c-tel" value={edition.f.telephone} onChange={(e) => set({ telephone: e.target.value })} /></Field>
            <label className="flex items-center gap-3 text-sm font-medium text-text sm:col-span-2">
              <input type="checkbox" checked={edition.f.actif} onChange={(e) => set({ actif: e.target.checked })} className="size-4 accent-[var(--accent)]" />
              Commercial actif
            </label>
          </div>
        </PanneauEdition>
      ) : null}
    </>
  );
}
