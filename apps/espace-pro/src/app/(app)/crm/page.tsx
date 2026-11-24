import { Building2, Coins, Handshake, Inbox } from "lucide-react";
import type { Metadata } from "next";
import { Portefeuille } from "@/components/crm/portefeuille";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { commerciaux, peutVoirCrm, portefeuille } from "@/lib/data/crm";
import { profilCourant } from "@/lib/data/session";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "CRM" };

export default async function Page() {
  const profil = await profilCourant();

  if (!peutVoirCrm(profil)) {
    return (
      <>
        <PageHeader title="Portefeuille clients" />
        <EmptyState title="Accès réservé">Le CRM est réservé aux équipes commerciales de Picard Serrures.</EmptyState>
      </>
    );
  }

  const atc = profil?.role === "atc";
  const [comptes, noms] = await Promise.all([portefeuille(), commerciaux()]);
  const actifs = comptes.filter((c) => c.actif);
  const leads = comptes.reduce((s, c) => s + c.leads, 0);
  const signes = comptes.reduce((s, c) => s + c.signes, 0);
  const points = comptes.reduce((s, c) => s + c.points, 0);
  const elite = actifs.filter((c) => c.niveau === "Elite").length;
  const premium = actifs.filter((c) => c.niveau === "Premium").length;

  return (
    <>
      <PageHeader
        title={atc ? "Mon portefeuille" : "Portefeuille clients"}
        description={
          atc
            ? "Vos comptes, leur niveau et leur activité. Ouvrez une fiche pour préparer une visite."
            : "Tous les comptes du réseau, leur niveau, leur commercial et leur activité sur les douze derniers mois."
        }
      />
      <KpiBand
        items={[
          { label: "Comptes actifs", value: formatNumber(actifs.length), icon: Building2, tone: "accent", note: `${elite} Elite, ${premium} Premium` },
          { label: "Leads reçus sur 12 mois", value: formatNumber(leads), icon: Inbox, tone: "neutral", note: `${comptes.filter((c) => c.leads > 0).length} comptes servis` },
          {
            label: "Ventes signées",
            value: formatNumber(signes),
            icon: Handshake,
            tone: "success",
            note: leads ? `${Math.round((signes / leads) * 100)} % des leads reçus` : undefined,
          },
          { label: "Points distribués", value: formatNumber(points), icon: Coins, tone: "cta", note: "Cumul du programme de fidélité" },
        ]}
      />
      <Panel className="mt-8">
        <PanelHeader title="Comptes" description="Cliquez sur un compte pour ouvrir sa fiche" />
        {comptes.length ? (
          <Portefeuille comptes={comptes} commerciaux={noms} afficherCommercial={!atc} />
        ) : (
          <p className="border-t border-line px-6 py-10 text-sm text-text-2">Aucun compte n’est encore rattaché à votre portefeuille. Contactez l’administrateur.</p>
        )}
      </Panel>
    </>
  );
}
