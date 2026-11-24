import type { Metadata } from "next";
import Link from "next/link";
import { CadreAuth } from "@/components/auth/cadre-auth";
import { FormulaireRejoindre } from "./formulaire";

export const metadata: Metadata = { title: "Demander un accès" };

export default function Page() {
  return (
    <CadreAuth>
      <h1 className="font-display text-xl font-semibold text-text">Rejoindre l’Espace Pro</h1>
      <p className="mt-2 text-sm text-text-2">Votre demande est étudiée par Picard Serrures. Vous recevrez vos accès par e-mail.</p>
      <FormulaireRejoindre />
      <p className="mt-8 border-t border-line pt-6 text-sm text-text-2">
        Déjà un compte ? <Link href="/connexion" className="font-semibold text-accent hover:underline">Se connecter</Link>
      </p>
    </CadreAuth>
  );
}
