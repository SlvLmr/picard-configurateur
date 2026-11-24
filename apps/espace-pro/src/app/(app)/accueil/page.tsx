import type { Metadata } from "next";
import { agenda, annoncesAccueil, recapAccueil } from "@/lib/data/accueil";
import { parametres } from "@/lib/data/administration";
import { journeeCommercial } from "@/lib/data/crm";
import { leadsAValider, statsLeads } from "@/lib/data/leads";
import { peutPiloter, signauxPilotage } from "@/lib/data/pilotage";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { AccueilParRole } from "./accueil-par-role";

export const metadata: Metadata = { title: "Accueil" };

export default async function Page() {
  const profil = await profilCourant();
  const maintenant = new Date();
  const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
  const fin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 4, 0);
  const interne = estInterne(profil);
  const avecJournee = !!profil && ["atc", "admin", "codir", "chef_service", "chef_marche"].includes(profil.role);

  const [recap, annonces, elements, leads, stats, journee, signaux, params] = await Promise.all([
    recapAccueil(),
    annoncesAccueil(),
    agenda(debut, fin).catch(() => []),
    interne ? leadsAValider(4) : Promise.resolve([]),
    interne ? statsLeads(30) : Promise.resolve(null),
    avecJournee ? journeeCommercial().catch(() => null) : Promise.resolve(null),
    peutPiloter(profil) ? signauxPilotage().catch(() => []) : Promise.resolve([]),
    parametres().catch(() => []),
  ]);
  const palier = params.find((p) => p.cle === "palier_points")?.valeur ?? 6500;

  return (
    <AccueilParRole
      profil={profil}
      recap={recap}
      annonces={annonces}
      agenda={elements}
      reel={interne ? { leads, stats, peutAttribuer: peutAttribuer(profil) } : null}
      journee={journee}
      signaux={signaux}
      palier={palier}
    />
  );
}
