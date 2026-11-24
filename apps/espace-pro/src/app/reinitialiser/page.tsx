import type { Metadata } from "next";
import { CadreAuth } from "@/components/auth/cadre-auth";
import { FormulaireNouveauMdp } from "./formulaire";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function Page() {
  return (
    <CadreAuth>
      <h1 className="font-display text-xl font-semibold text-text">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-text-2">Choisissez un mot de passe d’au moins 10 caractères.</p>
      <FormulaireNouveauMdp />
    </CadreAuth>
  );
}
