import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DevisImprimable } from "@/components/configurateur/devis-imprimable";
import { chiffrer } from "@/lib/configurateur/regles";
import { depuisDonnees, designation } from "@/lib/configurateur/persistance";
import { configurationParId } from "@/lib/data/configurations";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Devis client" };

export default async function Page({ params }: { params: { id: string } }) {
  const profil = await profilCourant();
  if (!profil) redirect("/connexion");
  const c = await configurationParId(params.id);
  if (!c) notFound();
  if (c.statut === "brouillon") redirect(`/configurateur?reprendre=${c.id}`);

  const conf = depuisDonnees(c.donnees);
  const delai = chiffrer(conf, null).delaiSemaines;
  const emetteur = c.compte
    ? {
        nom: c.compte.raisonSociale,
        adresse: [c.compte.cp, c.compte.ville].filter(Boolean).join(" "),
        mention: c.compte.numeroClient ? `Installateur agréé Picard Serrures, client n° ${c.compte.numeroClient}` : "Installateur agréé Picard Serrures",
      }
    : { nom: "Picard Serrures", adresse: "", mention: [profil.prenom, profil.nom].filter(Boolean).join(" ") || "" };

  return (
    <DevisImprimable
      reference={c.reference}
      date={c.devisLe ?? c.majLe}
      emetteur={emetteur}
      chantier={c.chantier}
      clientFinal={c.clientFinal}
      designation={designation(conf)}
      prixVenteHt={c.prixVente ?? 0}
      delaiSemaines={delai}
      commande={c.commande ? { reference: c.commande.reference } : null}
      configurationId={c.id}
      modifiable={c.statut !== "commande"}
    />
  );
}
