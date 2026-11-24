import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Configurateur, type ConfigurationReprise, type LeadSource } from "@/components/configurateur/configurateur";
import { CONFIGURATION_INITIALE, depuisMaPorte } from "@/lib/configurateur/catalogue";
import { depuisDonnees } from "@/lib/configurateur/persistance";
import { configurationParId } from "@/lib/data/configurations";
import { profilCourant } from "@/lib/data/session";
import type { NiveauIAP } from "@/lib/roles";
import { supabaseServeur } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configurateur" };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function Page({ searchParams }: { searchParams: { lead?: string; reprendre?: string } }) {
  const profil = await profilCourant();
  if (!profil) redirect("/connexion");
  const supabase = supabaseServeur();

  // Remise selon le niveau IAP du compte client connecté
  let niveau: NiveauIAP | null = null;
  if (profil.compteId) {
    const { data } = await supabase.from("ep_comptes").select("niveau_iap").eq("id", profil.compteId).maybeSingle();
    niveau = (data?.niveau_iap as NiveauIAP | null) ?? null;
  }

  let initiale = CONFIGURATION_INITIALE;
  let reprise: ConfigurationReprise = null;
  let idLead = typeof searchParams.lead === "string" && UUID.test(searchParams.lead) ? searchParams.lead : null;

  // Reprise d'une configuration enregistrée (lecture soumise aux droits de l'utilisateur)
  const idReprise = typeof searchParams.reprendre === "string" ? searchParams.reprendre : null;
  if (idReprise) {
    const enregistree = await configurationParId(idReprise);
    if (enregistree) {
      initiale = depuisDonnees(enregistree.donnees);
      reprise = { id: enregistree.id, reference: enregistree.reference, statut: enregistree.statut, prixVente: enregistree.prixVente };
      idLead = enregistree.leadId ?? idLead;
    }
  }

  // Pré-remplissage depuis un lead Ma Porte
  let lead: LeadSource = null;
  if (idLead) {
    const { data } = await supabase
      .from("ep_leads")
      .select("id, reference, ville, projet, configuration_ma_porte")
      .eq("id", idLead)
      .maybeSingle();
    const { data: coords } = data ? await supabase.rpc("ep_leads_coordonnees", { p_ids: [data.id] }) : { data: null };
    const contact = ((coords ?? []) as { contact_nom: string | null }[])[0]?.contact_nom ?? "Client";
    if (data) {
      lead = { id: data.id, reference: data.reference, contact, ville: data.ville, projet: data.projet };
      if (!reprise) {
        initiale = {
          ...depuisMaPorte(data.configuration_ma_porte as Record<string, unknown> | null),
          reference: `${contact}${data.ville ? `, ${data.ville}` : ""}`,
          clientFinal: contact,
        };
      }
    }
  }

  return <Configurateur key={reprise?.id ?? "nouvelle"} initiale={initiale} niveau={niveau} lead={lead} role={profil.role} reprise={reprise} />;
}
