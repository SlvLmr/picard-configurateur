"use client";

import { LogIn } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { seConnecter, type EtatConnexion } from "./actions";

function Envoyer() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-2 w-full">
      <LogIn aria-hidden />
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  );
}

export function FormulaireConnexion() {
  const [etat, action] = useFormState<EtatConnexion, FormData>(seConnecter, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field label="Adresse e-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Mot de passe" htmlFor="mot_de_passe">
        <Input id="mot_de_passe" name="mot_de_passe" type="password" autoComplete="current-password" required />
      </Field>
      {etat.erreur ? (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {etat.erreur}
        </p>
      ) : null}
      <Envoyer />
    </form>
  );
}
