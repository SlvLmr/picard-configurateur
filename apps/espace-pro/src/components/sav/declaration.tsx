"use client";

import { Camera, Check, Paperclip, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { declarerDemande, enregistrerFichier, type NouvelleDemande } from "@/app/(app)/sav/actions";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { CompteChoix } from "@/lib/data/sav";
import { supabaseNavigateur } from "@/lib/supabase/client";
import { Textarea, TypePicto, tailleLisible } from "./elements";
import { GAMMES, TYPES, type SavType } from "./libelles";

const ETAPES = ["Type de demande", "Produit", "Description", "Photos et vidéos", "Vérification"] as const;
const TAILLE_MAX = 200 * 1024 * 1024;

export function Declaration({ comptes, choisirCompte }: { comptes: CompteChoix[]; choisirCompte: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [etape, setEtape] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, startEnvoi] = useTransition();
  const [progression, setProgression] = useState<string | null>(null);
  const [fichiers, setFichiers] = useState<File[]>([]);
  const saisie = useRef<HTMLInputElement>(null);
  const [d, setD] = useState<NouvelleDemande>({
    type: "reclamation_garantie",
    compteId: null,
    gamme: "",
    produit: "",
    referenceProduit: "",
    numeroCommande: "",
    numeroSerie: "",
    description: "",
    adresse: "",
  });
  const maj = (k: keyof NouvelleDemande, v: string) => setD((x) => ({ ...x, [k]: v }));

  const verifier = (i: number): string | null => {
    if (i === 1) {
      if (choisirCompte && !d.compteId) return "Choisissez le client concerné.";
      if (d.type === "reclamation_garantie" && !d.numeroCommande.trim()) return "Le numéro de commande d’origine est nécessaire pour vérifier la garantie.";
    }
    if (i === 2 && d.description.trim().length < 10) return "Décrivez le problème en quelques phrases.";
    return null;
  };

  const suivant = () => {
    const e = verifier(etape);
    setErreur(e);
    if (!e) setEtape((x) => Math.min(x + 1, ETAPES.length - 1));
  };

  const ajouterFichiers = (liste: FileList | null) => {
    if (!liste) return;
    const ok = Array.from(liste).filter((f) => (f.type.startsWith("image/") || f.type.startsWith("video/")) && f.size <= TAILLE_MAX);
    if (ok.length < liste.length) setErreur("Seules les photos et vidéos de moins de 200 Mo sont acceptées.");
    setFichiers((x) => [...x, ...ok].slice(0, 10));
  };

  const envoyer = () =>
    startEnvoi(async () => {
      setErreur(null);
      const r = await declarerDemande(d);
      if (!r.ok || !r.donnee) {
        setErreur(r.message);
        return;
      }
      const { id, reference } = r.donnee;
      const supabase = supabaseNavigateur();
      let echecs = 0;
      for (let i = 0; i < fichiers.length; i++) {
        const f = fichiers[i];
        setProgression(`Envoi des fichiers : ${i + 1} sur ${fichiers.length}`);
        const nom = f.name.normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-80);
        const chemin = `${id}/${crypto.randomUUID()}-${nom}`;
        const { error } = await supabase.storage.from("ep-sav").upload(chemin, f, { contentType: f.type });
        if (error) {
          echecs++;
          continue;
        }
        const e = await enregistrerFichier(id, chemin, f.name, f.type, f.size);
        if (!e.ok) echecs++;
      }
      setProgression(null);
      toast(echecs ? `Demande ${reference} envoyée, mais ${echecs} fichier(s) n’ont pas pu être joints` : `Demande ${reference} envoyée au service SAV`);
      router.push(`/sav/${id}`);
    });

  const compteChoisi = comptes.find((c) => c.id === d.compteId);

  return (
    <>
      <PageHeader title="Déclarer un problème" description="Quelques informations suffisent. Le service SAV vous répond dans le fil d’échanges de la demande." />
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Étapes">
          {ETAPES.map((e, i) => (
            <li key={e} className="shrink-0">
              <button
                type="button"
                disabled={i > etape}
                onClick={() => i < etape && setEtape(i)}
                aria-current={i === etape ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  i === etape ? "bg-accent-soft text-text" : i < etape ? "text-text hover:bg-sunken" : "text-text-3",
                )}
              >
                <span
                  className={cn(
                    "tabular grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                    i < etape ? "border-accent-strong bg-accent-strong text-surface" : i === etape ? "border-accent bg-accent text-surface" : "border-line-strong",
                  )}
                >
                  {i < etape ? <Check className="size-3" aria-hidden /> : i + 1}
                </span>
                {e}
              </button>
            </li>
          ))}
        </ol>

        <Panel>
          <PanelBody className="pt-6">
            {etape === 0 ? (
              <fieldset>
                <legend className="text-base font-semibold text-text">Quel est le problème ?</legend>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {(Object.keys(TYPES) as SavType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setD((x) => ({ ...x, type: t }))}
                      aria-pressed={d.type === t}
                      className={cn(
                        "flex gap-3 rounded-lg border p-4 text-left transition-colors",
                        d.type === t ? "border-accent bg-accent-soft" : "border-line-strong hover:border-text-3",
                      )}
                    >
                      <TypePicto type={t} size="md" />
                      <span>
                        <span className="block font-semibold text-text">{TYPES[t].label}</span>
                        <span className="mt-0.5 block text-sm text-text-2">{TYPES[t].aide}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {etape === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {choisirCompte ? (
                  <Field label="Client concerné" htmlFor="sav-compte" className="md:col-span-2">
                    <Select id="sav-compte" value={d.compteId ?? ""} onChange={(e) => setD((x) => ({ ...x, compteId: e.target.value || null }))}>
                      <option value="">Choisir un client</option>
                      {comptes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                          {c.ville ? `, ${c.ville}` : ""}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
                <Field label="Gamme" htmlFor="sav-gamme">
                  <Select id="sav-gamme" value={d.gamme} onChange={(e) => maj("gamme", e.target.value)}>
                    <option value="">Je ne sais pas</option>
                    {GAMMES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Produit" htmlFor="sav-produit" hint="Ex. bloc-porte, cylindre, gâche">
                  <Input id="sav-produit" value={d.produit} onChange={(e) => maj("produit", e.target.value)} />
                </Field>
                <Field
                  label={d.type === "reclamation_garantie" ? "Numéro de commande d’origine" : "Numéro de commande (facultatif)"}
                  htmlFor="sav-commande"
                  hint={d.type === "reclamation_garantie" ? "Sert à vérifier la garantie" : undefined}
                >
                  <Input id="sav-commande" value={d.numeroCommande} onChange={(e) => maj("numeroCommande", e.target.value)} required={d.type === "reclamation_garantie"} />
                </Field>
                <Field label="Référence du produit (facultatif)" htmlFor="sav-ref">
                  <Input id="sav-ref" value={d.referenceProduit} onChange={(e) => maj("referenceProduit", e.target.value)} />
                </Field>
                <Field label="Numéro de série (facultatif)" htmlFor="sav-serie" hint="Sur l’étiquette, sur le chant de la porte">
                  <Input id="sav-serie" value={d.numeroSerie} onChange={(e) => maj("numeroSerie", e.target.value)} />
                </Field>
                <Field label="Adresse du chantier (facultatif)" htmlFor="sav-adresse">
                  <Input id="sav-adresse" value={d.adresse} onChange={(e) => maj("adresse", e.target.value)} />
                </Field>
              </div>
            ) : null}

            {etape === 2 ? (
              <Field label="Décrivez le problème" htmlFor="sav-description" hint="Ce qui se passe, depuis quand, ce que vous avez déjà essayé.">
                <Textarea id="sav-description" rows={8} value={d.description} onChange={(e) => maj("description", e.target.value)} />
              </Field>
            ) : null}

            {etape === 3 ? (
              <div>
                <p className="text-base font-semibold text-text">Ajoutez des photos ou des vidéos</p>
                <p className="mt-1 text-sm text-text-2">Une vue d’ensemble, puis un gros plan du défaut et de l’étiquette du produit. Dix fichiers au maximum.</p>
                <input
                  ref={saisie}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    ajouterFichiers(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button className="mt-4" onClick={() => saisie.current?.click()}>
                  <Camera aria-hidden />
                  Prendre ou choisir des fichiers
                </Button>
                {fichiers.length ? (
                  <ul className="mt-4">
                    {fichiers.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center gap-3 border-t border-line py-3">
                        <Paperclip className="size-4 text-text-3" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm text-text">{f.name}</span>
                        <span className="tabular text-xs text-text-3">{tailleLisible(f.size)}</span>
                        <Button variant="ghost" size="sm" iconOnly aria-label={`Retirer ${f.name}`} onClick={() => setFichiers((x) => x.filter((_, j) => j !== i))}>
                          <X />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-text-3">Aucun fichier pour l’instant. Cette étape est facultative mais accélère le traitement.</p>
                )}
              </div>
            ) : null}

            {etape === 4 ? (
              <div>
                <p className="text-base font-semibold text-text">Vérifiez avant d’envoyer</p>
                <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm md:grid-cols-[200px_minmax(0,1fr)]">
                  <dt className="text-text-3">Type</dt>
                  <dd className="font-medium text-text">{TYPES[d.type].label}</dd>
                  {choisirCompte ? (
                    <>
                      <dt className="text-text-3">Client</dt>
                      <dd className="font-medium text-text">{compteChoisi?.nom}</dd>
                    </>
                  ) : null}
                  <dt className="text-text-3">Produit</dt>
                  <dd className="text-text">{[d.gamme, d.produit, d.referenceProduit].filter(Boolean).join(", ") || "Non précisé"}</dd>
                  <dt className="text-text-3">Commande</dt>
                  <dd className="text-text">{d.numeroCommande || "Non précisée"}</dd>
                  <dt className="text-text-3">Description</dt>
                  <dd className="whitespace-pre-line text-text">{d.description}</dd>
                  <dt className="text-text-3">Fichiers</dt>
                  <dd className="text-text">{fichiers.length ? `${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""}` : "Aucun"}</dd>
                </dl>
              </div>
            ) : null}

            {erreur ? (
              <p role="alert" className="mt-6 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                {erreur}
              </p>
            ) : null}
            {progression ? (
              <p role="status" className="mt-6">
                <Badge variant="accent">{progression}</Badge>
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-6">
              {etape > 0 ? (
                <Button variant="ghost" onClick={() => setEtape((x) => x - 1)} disabled={envoi}>
                  Retour
                </Button>
              ) : (
                <ButtonLink href="/sav" variant="ghost">
                  Annuler
                </ButtonLink>
              )}
              <span className="ml-auto" />
              {etape < ETAPES.length - 1 ? (
                <Button variant="primary" onClick={suivant}>
                  Continuer
                </Button>
              ) : (
                <Button variant="primary" onClick={envoyer} disabled={envoi}>
                  <Check aria-hidden />
                  {envoi ? "Envoi en cours" : "Envoyer la demande"}
                </Button>
              )}
            </div>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
