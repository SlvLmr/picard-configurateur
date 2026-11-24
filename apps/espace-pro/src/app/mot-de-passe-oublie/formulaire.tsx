"use client";

import { Mail } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { demanderReinitialisation, type Etat } from "../connexion/actions";

function Envoyer() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-2 w-full">
      <Mail aria-hidden />
      {pending ? "Envoi…" : "Recevoir le lien"}
    </Button>
  );
}

export function FormulaireOubli() {
  const [etat, action] = useFormState<Etat, FormData>(demanderReinitialisation, {});
  if (etat.info) return <p role="status" className="mt-8 rounded-md bg-success-soft px-4 py-3 text-sm text-success">{etat.info}</p>;
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field label="Adresse e-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      {etat.erreur ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{etat.erreur}</p> : null}
      <Envoyer />
    </form>
  );
}
