"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { seConnecter, type EtatConnexion } from "./actions";

function Envoyer({ mode, children, variant }: { mode: string; children: React.ReactNode; variant: "primary" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name="mode" value={mode} variant={variant} disabled={pending} className="w-full">
      {children}
    </Button>
  );
}

export function FormulaireConnexion() {
  const [etat, action] = useFormState<EtatConnexion, FormData>(seConnecter, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field label="Adresse e-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Mot de passe" htmlFor="mot_de_passe">
        <Input id="mot_de_passe" name="mot_de_passe" type="password" autoComplete="current-password" />
      </Field>
      {etat.erreur ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{etat.erreur}</p> : null}
      {etat.info ? <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-sm text-success">{etat.info}</p> : null}
      <div className="mt-2 flex flex-col gap-2">
        <Envoyer mode="mot_de_passe" variant="primary">Se connecter</Envoyer>
        <Envoyer mode="lien" variant="ghost">Recevoir un lien par e-mail</Envoyer>
      </div>
    </form>
  );
}
