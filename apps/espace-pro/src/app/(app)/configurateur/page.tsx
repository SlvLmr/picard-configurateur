import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Configurateur, type LeadSource } from "@/components/configurateur/configurateur";
import { CONFIGURATION_INITIALE, depuisMaPorte } from "@/lib/configurateur/catalogue";
import { profilCourant } from "@/lib/data/session";
import type { NiveauIAP } from "@/lib/roles";
import { supabaseServeur } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configurateur" };

export default async function Page({ searchParams }: { searchParams: { lead?: string } }) {
  const profil = await profilCourant();
  if (!profil) redirect("/connexion");
  const supabase = supabaseServeur();

  // Remise selon le niveau IAP du compte client connecté
  let niveau: NiveauIAP | null = null;
  if (profil.compteId) {
    const { data } = await supabase.from("ep_comptes").select("niveau_iap").eq("id", profil.compteId).maybeSingle();
    niveau = (data?.niveau_iap as NiveauIAP | null) ?? null;
  }

  // Pré-remplissage depuis un lead Ma Porte (lecture soumise aux droits de l'utilisateur)
  let lead: LeadSource = null;
  let initiale = CONFIGURATION_INITIALE;
  const idLead = typeof searchParams.lead === "string" ? searchParams.lead : null;
  if (idLead && /^[0-9a-f-]{36}$/i.test(idLead)) {
    const { data } = await supabase
      .from("ep_leads")
      .select("reference, contact_nom, ville, projet, configuration_ma_porte")
      .eq("id", idLead)
      .maybeSingle();
    if (data) {
      lead = { reference: data.reference, contact: data.contact_nom, ville: data.ville, projet: data.projet };
      initiale = {
        ...depuisMaPorte(data.configuration_ma_porte as Record<string, unknown> | null),
        reference: `${data.contact_nom}${data.ville ? `, ${data.ville}` : ""}`,
        clientFinal: data.contact_nom,
      };
    }
  }

  return <Configurateur initiale={initiale} niveau={niveau} lead={lead} role={profil.role} />;
}
