import type { Metadata } from "next";
import Link from "next/link";
import { CadreAuth } from "@/components/auth/cadre-auth";
import { FormulaireConnexion } from "./formulaire";

export const metadata: Metadata = { title: "Connexion" };

export default function Page() {
  return (
    <CadreAuth>
      <h1 className="font-display text-xl font-semibold text-text">Connexion</h1>
      <p className="mt-2 text-sm text-text-2">Utilisez l’adresse e-mail communiquée par Picard Serrures.</p>
      <FormulaireConnexion />
      <div className="mt-8 border-t border-line pt-6 text-sm text-text-2">
        Pas encore d’accès ?{" "}
        <Link href="/rejoindre" className="font-semibold text-accent hover:underline">
          Demander à rejoindre l’Espace Pro
        </Link>
      </div>
    </CadreAuth>
  );
}
