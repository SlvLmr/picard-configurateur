import { FilePen, FileText, Plus, Ruler, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { modele } from "@/lib/configurateur/catalogue";
import { depuisDonnees } from "@/lib/configurateur/persistance";
import { mesConfigurations, type StatutCommandePorte, type StatutConfiguration } from "@/lib/data/configurations";
import { profilCourant } from "@/lib/data/session";
import { formatEuros } from "@/lib/format";

export const metadata: Metadata = { title: "Mes configurations" };

const STATUT: Record<StatutConfiguration, { label: string; variant: "neutral" | "accent" | "success" }> = {
  brouillon: { label: "Brouillon", variant: "neutral" },
  devis: { label: "Devis généré", variant: "accent" },
  commande: { label: "Commandée", variant: "success" },
};

const STATUT_COMMANDE: Record<StatutCommandePorte, string> = {
  transmise_adv: "transmise à l’ADV",
  en_fabrication: "en fabrication",
  expediee: "expédiée",
};

const date = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export default async function Page() {
  const profil = await profilCourant();
  if (!profil) redirect("/connexion");
  const configurations = await mesConfigurations();
  const nb = (s: StatutConfiguration) => configurations.filter((c) => c.statut === s).length;
  const montantDevis = configurations.filter((c) => c.statut === "devis").reduce((s, c) => s + (c.prixVente ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Mes configurations"
        description="Reprenez un brouillon, réimprimez un devis ou suivez une commande de porte."
        actions={
          <ButtonLink href="/configurateur" variant="primary">
            <Plus aria-hidden />
            Nouvelle configuration
          </ButtonLink>
        }
      />

      {configurations.length === 0 ? (
        <EmptyState
          title="Aucune configuration pour l’instant"
          action={
            <ButtonLink href="/configurateur" variant="primary">
              <Ruler aria-hidden />
              Configurer une porte
            </ButtonLink>
          }
        >
          <p>Chaque porte enregistrée depuis le configurateur apparaît ici, avec son devis et le suivi de sa commande.</p>
        </EmptyState>
      ) : (
        <>
          <KpiBand
            items={[
              { label: "Brouillons", value: nb("brouillon"), icon: FilePen, tone: "neutral" },
              { label: "Devis en attente", value: nb("devis"), icon: FileText, note: montantDevis ? `${formatEuros(montantDevis)} HT proposés` : undefined },
              { label: "Portes commandées", value: nb("commande"), icon: Truck, tone: "success" },
              { label: "Configurations", value: configurations.length, icon: Ruler, tone: "cta" },
            ]}
          />
          <Panel className="mt-8">
            <PanelHeader title="Toutes les configurations" description="Les plus récemment modifiées d’abord" />
            <ul>
              {configurations.map((c) => {
                const conf = depuisDonnees(c.donnees);
                const s = STATUT[c.statut];
                return (
                  <li key={c.id} className="grid gap-4 border-t border-line px-6 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
                    <div className="flex min-w-0 gap-3">
                      <Picto icon={c.statut === "commande" ? Truck : c.statut === "devis" ? FileText : FilePen} tone={c.statut === "commande" ? "success" : c.statut === "devis" ? "accent" : "neutral"} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={c.statut === "commande" ? `/configurateur/devis/${c.id}` : `/configurateur?reprendre=${c.id}`} className="font-semibold text-text hover:text-accent">
                            {c.chantier || "Chantier sans nom"}
                          </Link>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-text-2">
                          Porte {modele(conf.modele).nom}, {conf.securite.replace("BP", "A2P BP")}, {conf.largeur} × {conf.hauteur} mm
                          {c.clientFinal ? `, pour ${c.clientFinal}` : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-text-3">
                          {c.reference}, modifiée le {date(c.majLe)}
                          {c.commande ? `. Commande ${c.commande.reference} ${STATUT_COMMANDE[c.commande.statut]}` : ""}
                          {c.compte ? `. ${c.compte.raisonSociale}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="tabular text-sm text-text-2">
                      {c.prixVente ? (
                        <>
                          <span className="font-semibold text-text">{formatEuros(c.prixVente)}</span> HT proposé
                        </>
                      ) : (
                        <span className="text-text-3">Prix de vente non renseigné</span>
                      )}
                      <span className="block text-xs text-text-3">Achat {formatEuros(c.prixAchat)} HT</span>
                    </div>
                    <div className="flex gap-2 md:justify-self-end">
                      {c.statut !== "brouillon" ? (
                        <ButtonLink href={`/configurateur/devis/${c.id}`} size="sm">
                          <FileText aria-hidden />
                          Devis
                        </ButtonLink>
                      ) : null}
                      {c.statut !== "commande" ? (
                        <ButtonLink href={`/configurateur?reprendre=${c.id}`} size="sm" variant={c.statut === "brouillon" ? "secondary" : "ghost"}>
                          <FilePen aria-hidden />
                          Reprendre
                        </ButtonLink>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </>
      )}
    </>
  );
}
