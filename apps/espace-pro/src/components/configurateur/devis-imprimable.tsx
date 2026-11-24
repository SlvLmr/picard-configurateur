"use client";

import { FilePen, Printer } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { formatEuros } from "@/lib/format";

type Taux = "10" | "20";

/**
 * Devis client à l'en-tête du professionnel. À l'impression, seule la feuille est conservée
 * (navigation, en-tête et commandes masqués) ; mise en page A4.
 */
export function DevisImprimable({
  reference,
  date,
  emetteur,
  chantier,
  clientFinal,
  designation,
  prixVenteHt,
  delaiSemaines,
  commande,
  configurationId,
  modifiable,
}: {
  reference: string;
  date: string;
  emetteur: { nom: string; adresse: string; mention: string };
  chantier: string | null;
  clientFinal: string | null;
  designation: { titre: string; details: string[] };
  prixVenteHt: number;
  delaiSemaines: number;
  commande: { reference: string } | null;
  configurationId: string;
  modifiable: boolean;
}) {
  const [taux, setTaux] = useState<Taux>("10");
  const tva = Math.round(prixVenteHt * (Number(taux) / 100) * 100) / 100;
  const ttc = prixVenteHt + tva;
  const emis = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
  const validite = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(new Date(date).getTime() + 30 * 86400000));
  const deuxDecimales = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@page { size: A4; margin: 16mm; }
@media print {
  body * { visibility: hidden; }
  .devis-feuille, .devis-feuille * { visibility: visible; }
  .devis-feuille { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
  :root, :root[data-theme] { --surface: #ffffff; --bg: #ffffff; --text: #0b2545; --text-2: #3b4f6b; --text-3: #5f6f86; --line: #e4dccb; --line-strong: #cfc4ae; }
  html, body { background: var(--surface) !important; }
}`,
        }}
      />

      <div className="print:hidden">
        <PageHeader
          title={`Devis ${reference}`}
          meta={commande ? <Badge variant="success">Commande {commande.reference}</Badge> : <Badge variant="accent">À remettre au client</Badge>}
          description="Vérifiez le taux de TVA, puis imprimez ou enregistrez le devis en PDF depuis la fenêtre d’impression."
          actions={
            <>
              {modifiable ? (
                <ButtonLink href={`/configurateur?reprendre=${configurationId}`} variant="ghost">
                  <FilePen aria-hidden />
                  Modifier
                </ButtonLink>
              ) : null}
              <Button variant="primary" onClick={() => window.print()}>
                <Printer aria-hidden />
                Imprimer ou enregistrer en PDF
              </Button>
            </>
          }
        />
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-text">Taux de TVA</span>
          <Segmented
            label="Taux de TVA"
            value={taux}
            onChange={setTaux}
            options={[
              { value: "10", label: "10 %, rénovation" },
              { value: "20", label: "20 %, neuf ou local professionnel" },
            ]}
          />
        </div>
      </div>

      <article className="devis-feuille mx-auto max-w-[210mm] rounded-lg border border-line bg-surface p-12 text-text shadow-card">
        <header className="flex flex-wrap items-start justify-between gap-8 border-b-2 border-text pb-6">
          <div>
            <p className="font-display text-xl font-semibold">{emetteur.nom}</p>
            {emetteur.adresse ? <p className="mt-1 text-sm">{emetteur.adresse}</p> : null}
            {emetteur.mention ? <p className="mt-1 text-xs text-text-3">{emetteur.mention}</p> : null}
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-semibold">Devis {reference}</p>
            <p className="mt-1 text-sm">Émis le {emis}</p>
            <p className="text-xs text-text-3">Valable jusqu’au {validite}</p>
          </div>
        </header>

        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-text-3">Client</p>
            <p className="mt-1 font-semibold">{clientFinal || "À compléter"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-3">Chantier</p>
            <p className="mt-1 font-semibold">{chantier || "À compléter"}</p>
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left">
              <th className="py-2 pr-4 font-semibold">Désignation</th>
              <th className="py-2 pl-4 text-right font-semibold">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="align-top">
              <td className="py-4 pr-4">
                <p className="font-semibold">{designation.titre}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-text-2">
                  {designation.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <p className="mt-2 text-text-2">Dépose de l’existant, fourniture, pose, réglages et évacuation des déchets.</p>
              </td>
              <td className="tabular py-4 pl-4 text-right font-semibold">{deuxDecimales(prixVenteHt)}</td>
            </tr>
          </tbody>
        </table>

        <dl className="tabular ml-auto mt-4 w-full max-w-80 border-t border-line-strong text-sm">
          <div className="flex justify-between py-2">
            <dt>Total HT</dt>
            <dd className="font-semibold">{deuxDecimales(prixVenteHt)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt>TVA {taux} %</dt>
            <dd>{deuxDecimales(tva)}</dd>
          </div>
          <div className="flex justify-between border-t-2 border-text py-2 text-base">
            <dt className="font-semibold">Total TTC</dt>
            <dd className="font-bold">{deuxDecimales(ttc)}</dd>
          </div>
        </dl>

        <section className="mt-8 border-t border-line pt-6 text-xs leading-5 text-text-2">
          <p className="font-semibold text-text">Conditions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Devis valable 30 jours à compter de sa date d’émission.</li>
            <li>Acompte de 30 % à la commande, soit {formatEuros(Math.round(ttc * 0.3))} TTC ; solde à la fin de la pose.</li>
            <li>Délai indicatif : fabrication en {delaiSemaines} semaines après validation des cotes sur place, puis pose sur rendez-vous.</li>
            <li>Porte et serrure garanties selon les conditions du fabricant Picard Serrures ; certification A2P délivrée par le CNPP.</li>
            {taux === "10" ? (
              <li>TVA à taux réduit applicable aux travaux dans un logement achevé depuis plus de deux ans, sous réserve de l’attestation du client.</li>
            ) : null}
          </ul>
        </section>

        <footer className="mt-10 grid gap-8 text-xs sm:grid-cols-2">
          <div className="h-24 rounded-md border border-dashed border-line-strong p-3 text-text-3">Bon pour accord, date et signature du client</div>
          <div className="h-24 rounded-md border border-dashed border-line-strong p-3 text-text-3">Cachet et signature de l’entreprise</div>
        </footer>
      </article>
    </>
  );
}
