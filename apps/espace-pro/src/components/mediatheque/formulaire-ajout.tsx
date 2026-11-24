"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { creerRessource, type NouvelleRessource } from "@/app/(app)/mediatheque/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { supabaseNavigateur } from "@/lib/supabase/client";
import { TYPES } from "./libelles";

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "");

/** Publication d'une ressource (administrateur) : dépôt du fichier dans le stockage privé, puis enregistrement. */
export function FormulaireAjout({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function publier(form: FormData) {
    setErreur(null);
    const fichier = form.get("fichier");
    const titre = String(form.get("titre") ?? "").trim();
    if (!titre) return setErreur("Donnez un titre à la ressource.");
    if (!(fichier instanceof File) || fichier.size === 0) return setErreur("Choisissez le fichier à publier.");

    setEnvoi(true);
    const type = String(form.get("type")) as NouvelleRessource["type"];
    const chemin = `${type}/${Date.now()}-${slug(fichier.name)}`;
    const { error } = await supabaseNavigateur()
      .storage.from("ep-ressources")
      .upload(chemin, fichier, { contentType: fichier.type || undefined, upsert: false });
    if (error) {
      setEnvoi(false);
      return setErreur("Le dépôt du fichier a échoué. Vérifiez sa taille (500 Mo maximum) et réessayez.");
    }

    const res = await creerRessource({
      titre,
      description: String(form.get("description") ?? ""),
      type,
      gamme: String(form.get("gamme") ?? ""),
      marque: String(form.get("marque")) as NouvelleRessource["marque"],
      acces: String(form.get("acces")) as NouvelleRessource["acces"],
      kit: String(form.get("kit") ?? ""),
      fichierChemin: chemin,
      tailleOctets: fichier.size,
      format: fichier.name.split(".").pop() ?? "",
    });
    setEnvoi(false);
    if (!res.ok) return setErreur(res.message);
    toast(res.message);
    onDone();
  }

  return (
    <Panel>
      <PanelHeader title="Ajouter une ressource" description="Le fichier est stocké de façon privée et n’est accessible qu’aux publics choisis." />
      <PanelBody>
        <form action={publier} className="grid gap-6 md:grid-cols-2">
          <Field label="Titre" htmlFor="ajout-titre">
            <Input id="ajout-titre" name="titre" required placeholder="Fiche technique Altitude" />
          </Field>
          <Field label="Nature" htmlFor="ajout-type">
            <Select id="ajout-type" name="type" defaultValue="doc_technique">
              {Object.entries(TYPES).map(([k, t]) => (
                <option key={k} value={k}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" htmlFor="ajout-description" hint="Une ou deux phrases : ce que contient la ressource et à quoi elle sert." className="md:col-span-2">
            <textarea
              id="ajout-description"
              name="description"
              rows={3}
              className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
          </Field>
          <Field label="Gamme" htmlFor="ajout-gamme">
            <Input id="ajout-gamme" name="gamme" placeholder="Altitude, Toutes gammes…" />
          </Field>
          <Field label="Marque" htmlFor="ajout-marque">
            <Select id="ajout-marque" name="marque" defaultValue="picard">
              <option value="picard">Picard Serrures</option>
              <option value="eliot">Eliot</option>
              <option value="commune">Toutes marques</option>
            </Select>
          </Field>
          <Field label="Accessible à" htmlFor="ajout-acces">
            <Select id="ajout-acces" name="acces" defaultValue="tous">
              <option value="tous">Tout le réseau</option>
              <option value="internes">Équipes Picard uniquement</option>
              <option value="elite_premium">IAP Elite et Premium</option>
              <option value="elite">IAP Elite uniquement</option>
            </Select>
          </Field>
          <Field label="Kit de lancement" htmlFor="ajout-kit" hint="Facultatif. Regroupe les ressources d’une même opération.">
            <Input id="ajout-kit" name="kit" placeholder="Lancement Altitude" />
          </Field>
          <Field label="Fichier" htmlFor="ajout-fichier" hint="500 Mo maximum." className="md:col-span-2">
            <input
              id="ajout-fichier"
              name="fichier"
              type="file"
              required
              className="block w-full text-sm text-text-2 file:mr-4 file:h-10 file:cursor-pointer file:rounded-md file:border file:border-line-strong file:bg-surface file:px-4 file:text-sm file:font-medium file:text-text hover:file:bg-sunken"
            />
          </Field>
          {erreur ? (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger md:col-span-2">
              {erreur}
            </p>
          ) : null}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" variant="primary" disabled={envoi}>
              <Upload aria-hidden />
              {envoi ? "Publication…" : "Publier la ressource"}
            </Button>
            <Button type="button" variant="ghost" onClick={onDone} disabled={envoi}>
              Annuler
            </Button>
          </div>
        </form>
      </PanelBody>
    </Panel>
  );
}
