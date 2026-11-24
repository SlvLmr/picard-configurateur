"use client";

import { Check } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { ChampMotDePasse } from "@/components/auth/champ-mot-de-passe";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { definirMotDePasse, type Etat } from "../connexion/actions";

function Envoyer() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-2 w-full">
      <Check aria-hidden />
      {pending ? "Enregistrement…" : "Enregistrer et me connecter"}
    </Button>
  );
}

export function FormulaireNouveauMdp() {
  const [etat, action] = useFormState<Etat, FormData>(definirMotDePasse, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field label="Nouveau mot de passe" htmlFor="mot_de_passe">
        <ChampMotDePasse id="mot_de_passe" name="mot_de_passe" autoComplete="new-password" />
      </Field>
      <Field label="Confirmez le mot de passe" htmlFor="confirmation">
        <ChampMotDePasse id="confirmation" name="confirmation" autoComplete="new-password" />
      </Field>
      {etat.erreur ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{etat.erreur}</p> : null}
      <Envoyer />
    </form>
  );
}
