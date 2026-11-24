"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { ChampMotDePasse } from "@/components/auth/champ-mot-de-passe";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { seConnecter, type Etat } from "./actions";

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
  const [etat, action] = useFormState<Etat, FormData>(seConnecter, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field label="Adresse e-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="mot_de_passe" className="text-sm font-medium text-text">Mot de passe</label>
          <Link href="/mot-de-passe-oublie" className="text-sm font-medium text-accent hover:underline">Mot de passe oublié ?</Link>
        </div>
        <ChampMotDePasse id="mot_de_passe" name="mot_de_passe" autoComplete="current-password" />
      </div>
      {etat.erreur ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{etat.erreur}</p> : null}
      <Envoyer />
    </form>
  );
}
