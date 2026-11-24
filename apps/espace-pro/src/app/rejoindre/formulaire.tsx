"use client";

import { Send } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { demanderAcces, type Etat } from "../connexion/actions";

function Envoyer() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-2 w-full">
      <Send aria-hidden />
      {pending ? "Envoi…" : "Envoyer ma demande"}
    </Button>
  );
}

export function FormulaireRejoindre() {
  const [etat, action] = useFormState<Etat, FormData>(demanderAcces, {});
  if (etat.info) return <p role="status" className="mt-8 rounded-md bg-success-soft px-4 py-3 text-sm text-success">{etat.info}</p>;
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="prenom"><Input id="prenom" name="prenom" autoComplete="given-name" required /></Field>
        <Field label="Nom" htmlFor="nom"><Input id="nom" name="nom" autoComplete="family-name" required /></Field>
      </div>
      <Field label="Adresse e-mail professionnelle" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Téléphone" htmlFor="telephone"><Input id="telephone" name="telephone" type="tel" autoComplete="tel" /></Field>
      <Field label="Entreprise" htmlFor="entreprise"><Input id="entreprise" name="entreprise" autoComplete="organization" /></Field>
      <Field label="Vous êtes" htmlFor="profil">
        <Select id="profil" name="profil" defaultValue="iap">
          <option value="iap">Installateur agréé Picard (IAP)</option>
          <option value="serrurier">Serrurier</option>
          <option value="fenetrier">Fenêtrier</option>
          <option value="interne">Salarié Picard Serrures</option>
          <option value="autre">Autre</option>
        </Select>
      </Field>
      <Field label="Message" htmlFor="message" hint="Facultatif : votre commercial, votre numéro client…">
        <textarea id="message" name="message" maxLength={1000} className="min-h-24 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
      </Field>
      {etat.erreur ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{etat.erreur}</p> : null}
      <Envoyer />
    </form>
  );
}
