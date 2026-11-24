import type { Metadata } from "next";
import Link from "next/link";
import { CadreAuth } from "@/components/auth/cadre-auth";
import { FormulaireOubli } from "./formulaire";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function Page({ searchParams }: { searchParams: { expire?: string } }) {
  return (
    <CadreAuth>
      <h1 className="font-display text-xl font-semibold text-text">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-text-2">
        {searchParams.expire ? "Ce lien a expiré ou a déjà servi. " : ""}Indiquez votre adresse e-mail : nous vous envoyons un lien pour choisir un nouveau mot de passe.
      </p>
      <FormulaireOubli />
      <p className="mt-8 border-t border-line pt-6 text-sm">
        <Link href="/connexion" className="font-semibold text-accent hover:underline">Retour à la connexion</Link>
      </p>
    </CadreAuth>
  );
}
