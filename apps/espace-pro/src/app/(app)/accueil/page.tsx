import type { Metadata } from "next";
import { agenda, annoncesActives, recapAccueil } from "@/lib/data/accueil";
import { ANNEE_DEPART, ANNEES } from "@/lib/periode-calendrier";
import { parametres } from "@/lib/data/administration";
import { journeeCommercial } from "@/lib/data/crm";
import { leadsAValider, leadsProfessionnel, statsLeads, statsPro } from "@/lib/data/leads";
import { ressourcesVisibles } from "@/lib/data/mediatheque";
import { supabaseServeur } from "@/lib/supabase/server";
import type { DonneesClient } from "@/components/accueil/accueil-client";
import { isClient } from "@/lib/roles";
import { peutPiloter, signauxPilotage } from "@/lib/data/pilotage";
import { estInterne, peutAttribuer, profilCourant } from "@/lib/data/session";
import { AccueilParRole } from "./accueil-par-role";

export const metadata: Metadata = { title: "Accueil" };

export default async function Page() {
  const profil = await profilCourant();
  const maintenant = new Date();
  // Même période que la frise de l'agenda : à partir de janvier 2027, sur deux ans
  const depart = Math.max(ANNEE_DEPART, maintenant.getFullYear());
  const debut = new Date(depart, 0, 1);
  const fin = new Date(depart + ANNEES - 1, 11, 31, 23, 59);
  const interne = estInterne(profil);
  const avecJournee = !!profil && ["atc", "admin", "codir", "chef_service", "chef_marche"].includes(profil.role);

  const [recap, annonces, elements, leads, stats, journee, signaux, params] = await Promise.all([
    recapAccueil(),
    annoncesActives(),
    agenda(debut, fin).catch(() => []),
    interne ? leadsAValider(4) : Promise.resolve([]),
    interne ? statsLeads(30) : Promise.resolve(null),
    avecJournee ? journeeCommercial().catch(() => null) : Promise.resolve(null),
    peutPiloter(profil) ? signauxPilotage().catch(() => []) : Promise.resolve([]),
    parametres().catch(() => []),
  ]);
  const palier = params.find((p) => p.cle === "palier_points")?.valeur ?? 6500;

  // Accueil client : ses leads, son SAV, les dernières ressources (l'administrateur en voit un aperçu réel)
  let client: DonneesClient | null = null;
  if (profil && (isClient(profil.role) || profil.role === "admin")) {
    const supabase = supabaseServeur();
    const [leadsPro, sav, media, statsClient, compte] = await Promise.all([
      leadsProfessionnel().catch(() => []),
      supabase.from("ep_sav_demandes").select("id, reference, type, statut, mis_a_jour_le, produit").not("statut", "in", "(cloturee)").order("mis_a_jour_le", { ascending: false }).limit(6),
      ressourcesVisibles().catch(() => ({ ressources: [], stats: null })),
      isClient(profil.role) ? statsPro().catch(() => null) : Promise.resolve(null),
      profil.compteId ? supabase.from("ep_comptes").select("raison_sociale, niveau_iap").eq("id", profil.compteId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    client = {
      leads: leadsPro.slice(0, 20),
      sav: ((sav.data ?? []) as DonneesClient["sav"]).slice(0, 6),
      ressources: media.ressources.slice(0, 4),
      stats: statsClient,
      compte: (compte.data as DonneesClient["compte"]) ?? null,
      apercu: profil.roleReel === "admin",
    };
  }

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
      client={client}
    />
  );
}
