"use client";

import { CalendarPlus, Megaphone, Pin } from "lucide-react";
import { useState, useTransition } from "react";
import { archiverAnnonce, archiverEvenement, creerEvenement, publierAnnonce } from "@/app/(app)/administration/contenus/actions";
import { CIBLES, type Cible } from "@/lib/cibles";
import { TYPES_AGENDA } from "@/components/accueil/calendrier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import type { Annonce, ElementAgenda } from "@/lib/data/accueil";

const OPTIONS_CIBLES = (Object.keys(CIBLES) as Cible[]).map((k) => ({ value: k, label: CIBLES[k].label }));
const TYPES_EVENEMENT = (["salon", "campagne", "digital", "ressource", "pos", "reseau"] as const).map((t) => ({
  value: t,
  label: TYPES_AGENDA[t].label,
  prefixe: <span aria-hidden className="block size-2 rounded-full" style={{ background: TYPES_AGENDA[t].couleur }} />,
}));
const TONS = { info: "Information", operation: "Opération", important: "Important" } as const;

const dateFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
const textarea =
  "min-h-24 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none";

export function GestionContenus({ annonces, evenements }: { annonces: Annonce[]; evenements: ElementAgenda[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [a, setA] = useState({ titre: "", contenu: "", ton: "info" as keyof typeof TONS, lienLibelle: "", lienUrl: "", cible: "tous" as Cible, debut: "", fin: "", epinglee: false });
  const [e, setE] = useState({ titre: "", type: "salon", debut: "", fin: "", lieu: "", description: "", lienUrl: "", cible: "tous" as Cible });

  const executer = (f: () => Promise<{ ok: boolean; message: string }>, apres?: () => void) =>
    start(async () => {
      const r = await f();
      toast(r.message);
      if (r.ok) apres?.();
    });

  const actives = annonces.filter((x) => !x.archivee);

  return (
    <>
      <PageHeader title="Actualités et calendrier" description="Les annonces s’affichent en haut de l’accueil (trois au plus, épinglées d’abord). Les événements alimentent le calendrier. Chacun est visible par le public choisi." />
      <div className="grid gap-8 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Publier une annonce" />
          <PanelBody className="flex flex-col gap-4">
            <Field label="Titre" htmlFor="a-titre">
              <Input id="a-titre" value={a.titre} onChange={(x) => setA({ ...a, titre: x.target.value })} />
            </Field>
            <Field label="Message" htmlFor="a-contenu" hint="Deux ou trois phrases : l’accueil en affiche trois lignes.">
              <textarea id="a-contenu" className={textarea} value={a.contenu} onChange={(x) => setA({ ...a, contenu: x.target.value })} />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text">Ton</span>
              <Segmented label="Ton de l’annonce" value={a.ton} onChange={(v) => setA({ ...a, ton: v })} options={(Object.keys(TONS) as (keyof typeof TONS)[]).map((k) => ({ value: k, label: TONS[k] }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Public" htmlFor="a-cible">
                <Combobox id="a-cible" options={OPTIONS_CIBLES} value={a.cible} onChange={(v) => setA({ ...a, cible: v as Cible })} />
              </Field>
              <label className="flex items-center gap-3 self-end pb-2 text-sm font-medium text-text">
                <input type="checkbox" checked={a.epinglee} onChange={(x) => setA({ ...a, epinglee: x.target.checked })} className="size-4 accent-[var(--accent)]" />
                Épingler en premier
              </label>
              <Field label="Visible à partir du" htmlFor="a-debut" hint="Aujourd’hui si vide">
                <Input id="a-debut" type="date" value={a.debut} onChange={(x) => setA({ ...a, debut: x.target.value })} />
              </Field>
              <Field label="Jusqu’au" htmlFor="a-fin" hint="Sans fin si vide">
                <Input id="a-fin" type="date" value={a.fin} onChange={(x) => setA({ ...a, fin: x.target.value })} />
              </Field>
              <Field label="Texte du lien" htmlFor="a-lien-libelle" hint="Facultatif">
                <Input id="a-lien-libelle" value={a.lienLibelle} onChange={(x) => setA({ ...a, lienLibelle: x.target.value })} placeholder="Voir l’opération" />
              </Field>
              <Field label="Adresse du lien" htmlFor="a-lien-url" hint="Page de l’Espace Pro (/marketing) ou site externe">
                <Input id="a-lien-url" value={a.lienUrl} onChange={(x) => setA({ ...a, lienUrl: x.target.value })} placeholder="/marketing" />
              </Field>
            </div>
            <Button
              variant="primary"
              className="self-start"
              disabled={pending || !a.titre.trim() || !a.contenu.trim()}
              onClick={() => executer(() => publierAnnonce(a), () => setA({ ...a, titre: "", contenu: "", lienLibelle: "", lienUrl: "", debut: "", fin: "", epinglee: false }))}
            >
              <Megaphone aria-hidden />
              Publier l’annonce
            </Button>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Ajouter un événement" />
          <PanelBody className="flex flex-col gap-4">
            <Field label="Titre" htmlFor="e-titre">
              <Input id="e-titre" value={e.titre} onChange={(x) => setE({ ...e, titre: x.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" htmlFor="e-type">
                <Combobox id="e-type" options={TYPES_EVENEMENT} value={e.type} onChange={(v) => setE({ ...e, type: v })} />
              </Field>
              <Field label="Public" htmlFor="e-cible">
                <Combobox id="e-cible" options={OPTIONS_CIBLES} value={e.cible} onChange={(v) => setE({ ...e, cible: v as Cible })} />
              </Field>
              <Field label="Début" htmlFor="e-debut">
                <Input id="e-debut" type="datetime-local" value={e.debut} onChange={(x) => setE({ ...e, debut: x.target.value })} />
              </Field>
              <Field label="Fin" htmlFor="e-fin" hint="Facultatif">
                <Input id="e-fin" type="datetime-local" value={e.fin} onChange={(x) => setE({ ...e, fin: x.target.value })} />
              </Field>
              <Field label="Lieu" htmlFor="e-lieu">
                <Input id="e-lieu" value={e.lieu} onChange={(x) => setE({ ...e, lieu: x.target.value })} placeholder="Paris Expo, ou En ligne" />
              </Field>
              <Field label="Lien d’inscription" htmlFor="e-lien" hint="Facultatif">
                <Input id="e-lien" value={e.lienUrl} onChange={(x) => setE({ ...e, lienUrl: x.target.value })} />
              </Field>
            </div>
            <Field label="Description" htmlFor="e-desc">
              <textarea id="e-desc" className={textarea} value={e.description} onChange={(x) => setE({ ...e, description: x.target.value })} />
            </Field>
            <Button
              variant="primary"
              className="self-start"
              disabled={pending || !e.titre.trim() || !e.debut}
              onClick={() => executer(() => creerEvenement(e), () => setE({ ...e, titre: "", debut: "", fin: "", lieu: "", description: "", lienUrl: "" }))}
            >
              <CalendarPlus aria-hidden />
              Ajouter au calendrier
            </Button>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Annonces publiées" description={`${actives.length} active${actives.length > 1 ? "s" : ""}`} />
          {actives.length === 0 ? (
            <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucune annonce active.</p>
          ) : (
            <ul>
              {actives.map((x) => (
                <li key={x.id} className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {x.epinglee ? <Pin aria-label="Épinglée" className="size-4 text-cta-deep" /> : null}
                      <span className="font-semibold text-text">{x.titre}</span>
                      <Badge variant={x.ton === "important" ? "warning" : x.ton === "operation" ? "accent" : "neutral"}>{TONS[x.ton]}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-text-2">
                      Du {dateFr(x.debut)}
                      {x.fin ? ` au ${dateFr(x.fin)}` : ", sans fin"}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => executer(() => archiverAnnonce(x.id))}>
                    Retirer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Événements à venir" />
          {evenements.length === 0 ? (
            <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun événement.</p>
          ) : (
            <ul>
              {evenements.map((x) => (
                <li key={x.id} className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center">
                  <span aria-hidden className="hidden w-1 self-stretch rounded-full sm:block" style={{ background: TYPES_AGENDA[x.type].couleur }} />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-text">{x.titre}</span>
                    <p className="mt-0.5 text-sm text-text-2">
                      {TYPES_AGENDA[x.type].label}, le {dateFr(x.debut)}
                      {x.lieu ? `, ${x.lieu}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => executer(() => archiverEvenement(x.id))}>
                    Retirer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
