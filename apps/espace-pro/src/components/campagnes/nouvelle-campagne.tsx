"use client";

import { ArrowDown, ArrowUp, Plus, Rocket, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { apercuCiblage, creerCampagne } from "@/app/(app)/campagnes/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { NiveauIAP } from "@/lib/roles";
import { ORDRE_TYPES, TYPES_ETAPE, type TypeEtape } from "./libelles";

type EtapeForm = { cle: number; type: TypeEtape; libelle: string };

const NIVEAUX: NiveauIAP[] = ["Elite", "Premium", "Officiel"];
const textarea =
  "min-h-24 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none";

let compteur = 0;
const nouvelleEtape = (type: TypeEtape): EtapeForm => ({ cle: ++compteur, type, libelle: TYPES_ETAPE[type].label });

export function NouvelleCampagne({ zones }: { zones: string[] }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [titre, setTitre] = useState("");
  const [objectif, setObjectif] = useState("");
  const [description, setDescription] = useState("");
  const [debut, setDebut] = useState(new Date().toISOString().slice(0, 10));
  const [fin, setFin] = useState("");
  const [etapes, setEtapes] = useState<EtapeForm[]>(() => [nouvelleEtape("appel"), nouvelleEtape("email"), nouvelleEtape("relance")]);
  const [niveaux, setNiveaux] = useState<NiveauIAP[]>([]);
  const [zonesChoisies, setZonesChoisies] = useState<string[]>([]);
  const [apercu, setApercu] = useState<{ comptes: number; commerciaux: number } | null>(null);

  useEffect(() => {
    let annule = false;
    apercuCiblage(niveaux, zonesChoisies).then((r) => {
      if (!annule) setApercu(r);
    });
    return () => {
      annule = true;
    };
  }, [niveaux, zonesChoisies]);

  const basculer = <T,>(liste: T[], v: T) => (liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);
  const deplacer = (i: number, d: -1 | 1) =>
    setEtapes((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const n = [...xs];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const creer = (activer: boolean) =>
    start(async () => {
      const r = await creerCampagne({
        titre,
        objectif,
        description,
        debut,
        fin,
        etapes: etapes.map((e) => ({ type: e.type, libelle: e.libelle })),
        niveaux,
        zones: zonesChoisies,
        activer,
      });
      toast(r.message);
      if (r.ok && r.id) router.push(`/campagnes/${r.id}`);
    });

  const valide = titre.trim().length > 0 && etapes.length > 0 && (apercu?.comptes ?? 0) > 0;

  return (
    <>
      <PageHeader title="Nouvelle campagne" description="Définissez les étapes à mener chez chaque client et les clients concernés. Chaque commercial retrouvera ses clients dans la campagne." />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">
          <Panel>
            <PanelHeader title="La campagne" />
            <PanelBody className="flex flex-col gap-4">
              <Field label="Titre" htmlFor="c-titre">
                <Input id="c-titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Boost IAP fin d’année" />
              </Field>
              <Field label="Objectif" htmlFor="c-objectif" hint="En une phrase, ce que chaque commercial doit obtenir">
                <Input id="c-objectif" value={objectif} onChange={(e) => setObjectif(e.target.value)} placeholder="Une commande par IAP avant le 31 décembre" />
              </Field>
              <Field label="Consignes" htmlFor="c-description" hint="Facultatif : argumentaire, offre, documents à transmettre">
                <textarea id="c-description" className={textarea} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Début" htmlFor="c-debut">
                  <Input id="c-debut" type="date" value={debut} onChange={(e) => setDebut(e.target.value)} />
                </Field>
                <Field label="Fin" htmlFor="c-fin" hint="Facultatif">
                  <Input id="c-fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
                </Field>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Étapes" description="Dans l’ordre où elles se mènent. Renommez-les si besoin." />
            <ol>
              {etapes.map((e, i) => {
                const t = TYPES_ETAPE[e.type];
                return (
                  <li key={e.cle} className="flex flex-wrap items-center gap-3 border-t border-line px-6 py-4">
                    <span className="tabular w-4 text-sm font-semibold text-text-3">{i + 1}</span>
                    <Picto icon={t.icon} tone={e.type === "commande" ? "cta" : "accent"} size="sm" />
                    <Input
                      aria-label={`Libellé de l’étape ${i + 1}`}
                      value={e.libelle}
                      onChange={(ev) => setEtapes((xs) => xs.map((x) => (x.cle === e.cle ? { ...x, libelle: ev.target.value } : x)))}
                      className="min-w-0 flex-1 basis-40"
                    />
                    <span className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" iconOnly aria-label="Monter" disabled={i === 0} onClick={() => deplacer(i, -1)}>
                        <ArrowUp />
                      </Button>
                      <Button size="sm" variant="ghost" iconOnly aria-label="Descendre" disabled={i === etapes.length - 1} onClick={() => deplacer(i, 1)}>
                        <ArrowDown />
                      </Button>
                      <Button size="sm" variant="ghost" iconOnly aria-label="Retirer l’étape" disabled={etapes.length === 1} onClick={() => setEtapes((xs) => xs.filter((x) => x.cle !== e.cle))}>
                        <X />
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap gap-2 border-t border-line px-6 py-4">
              {ORDRE_TYPES.map((type) => {
                const t = TYPES_ETAPE[type];
                return (
                  <Button key={type} size="sm" disabled={etapes.length >= 12} onClick={() => setEtapes((xs) => [...xs, nouvelleEtape(type)])} title={t.aide}>
                    <Plus aria-hidden />
                    {t.label}
                  </Button>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-8">
          <Panel>
            <PanelHeader title="Clients ciblés" description="Sans sélection, tous les comptes actifs sont ciblés." />
            <PanelBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text">Niveau IAP</span>
                <div className="flex flex-wrap gap-2">
                  {NIVEAUX.map((n) => (
                    <Choix key={n} actif={niveaux.includes(n)} onClick={() => setNiveaux((l) => basculer(l, n))}>
                      IAP {n}
                    </Choix>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text">Zones</span>
                <div className="flex flex-wrap gap-2">
                  {zones.map((z) => (
                    <Choix key={z} actif={zonesChoisies.includes(z)} onClick={() => setZonesChoisies((l) => basculer(l, z))}>
                      {z}
                    </Choix>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-accent-soft px-4 py-3">
                <Picto icon={Users} size="sm" />
                <p className="text-sm text-accent-strong">
                  {apercu === null ? "Calcul du ciblage…" : `${apercu.comptes} compte${apercu.comptes > 1 ? "s" : ""}, répartis entre ${apercu.commerciaux} commercia${apercu.commerciaux > 1 ? "ux" : "l"}`}
                </p>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Lancement" />
            <PanelBody className="flex flex-col gap-3">
              <p className="text-sm text-text-2">
                {etapes.length} étape{etapes.length > 1 ? "s" : ""} pour {apercu?.comptes ?? 0} client{(apercu?.comptes ?? 0) > 1 ? "s" : ""}, soit {etapes.length * (apercu?.comptes ?? 0)} actions à mener.
              </p>
              <Button variant="primary" size="lg" disabled={pending || !valide} onClick={() => creer(true)}>
                <Rocket aria-hidden />
                Lancer la campagne
              </Button>
              <Button disabled={pending || !valide} onClick={() => creer(false)}>
                Enregistrer en brouillon
              </Button>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Choix({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors sm:h-8 sm:px-3",
        actif ? "border-text bg-text text-surface" : "border-line-strong bg-surface text-text-2 hover:border-text-3",
      )}
    >
      {children}
    </button>
  );
}
