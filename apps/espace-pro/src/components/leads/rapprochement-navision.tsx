"use client";

import { ChevronLeft, FileSpreadsheet, Link2, Receipt, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { importerNavision, type LigneNavision } from "@/app/(app)/lead-management/navision/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { CommandeNavision, ImportNavision } from "@/lib/data/navision";

type Champ = keyof LigneNavision;
const CHAMPS: { cle: Champ; label: string; indices: string[]; requis?: boolean }[] = [
  { cle: "numero", label: "N° de commande", indices: ["n° commande", "no commande", "numero", "numéro", "commande", "n°", "document"], requis: true },
  { cle: "code_lead", label: "Code lead", indices: ["code lead", "lead", "référence lead", "reference lead", "ref lead"], requis: true },
  { cle: "date", label: "Date", indices: ["date commande", "date"] },
  { cle: "client", label: "Client", indices: ["nom client", "client", "raison sociale", "nom"] },
  { cle: "code_client", label: "Code client", indices: ["code client", "n° client", "no client", "client n°"] },
  { cle: "montant", label: "Montant HT", indices: ["montant ht", "montant", "total ht", "ca ht", "total"] },
];
const euros = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const dateFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/** Lecture d'un CSV (séparateur ; , ou tabulation, guillemets gérés). */
function lireCsv(texte: string): string[][] {
  const premiere = texte.split(/\r?\n/)[0] ?? "";
  const sep = [";", "\t", ","].sort((a, b) => premiere.split(b).length - premiere.split(a).length)[0];
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let cellule = "";
  let guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"' && texte[i + 1] === '"') {
        cellule += '"';
        i++;
      } else if (c === '"') guillemets = false;
      else cellule += c;
    } else if (c === '"') guillemets = true;
    else if (c === sep) {
      ligne.push(cellule);
      cellule = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i++;
      ligne.push(cellule);
      if (ligne.some((x) => x.trim())) lignes.push(ligne);
      ligne = [];
      cellule = "";
    } else cellule += c;
  }
  ligne.push(cellule);
  if (ligne.some((x) => x.trim())) lignes.push(ligne);
  return lignes;
}

/** Date française (31/12/2026) ou ISO vers AAAA-MM-JJ. */
function dateIso(v: string) {
  const s = v.trim();
  const fr = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (fr) return `${fr[3].length === 2 ? `20${fr[3]}` : fr[3]}-${fr[2].padStart(2, "0")}-${fr[1].padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "";
}

/** Rapprochement des leads avec les commandes Navision : import de l'export mensuel, puis suivi de la transformation. */
export function RapprochementNavision({ commandes, imports, leadsAttribues, modifiable }: { commandes: CommandeNavision[]; imports: ImportNavision[]; leadsAttribues: number; modifiable: boolean }) {
  const toast = useToast();
  const champFichier = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<{ nom: string; entetes: string[]; lignes: string[][] } | null>(null);
  const [colonnes, setColonnes] = useState<Record<Champ, number>>({} as Record<Champ, number>);
  const [filtre, setFiltre] = useState<"rapprochees" | "sans_lead">("rapprochees");
  const [pending, start] = useTransition();

  const rapprochees = commandes.filter((c) => c.lead);
  const ca = rapprochees.reduce((s, c) => s + (c.montant ?? 0), 0);
  const leadsSignes = new Set(rapprochees.map((c) => c.lead!.id)).size;
  const visibles = filtre === "rapprochees" ? rapprochees : commandes.filter((c) => !c.lead && c.codeLead);

  const charger = async (f: File) => {
    if (!/\.(csv|txt)$/i.test(f.name)) return toast("Enregistrez l’export Navision au format CSV (Fichier, Enregistrer sous, CSV) puis importez-le.");
    const brut = await f.text();
    const tableau = lireCsv(brut);
    if (tableau.length < 2) return toast("Le fichier ne contient pas de commandes.");
    const entetes = tableau[0].map((e) => e.trim());
    // Correspondance automatique des colonnes par leur intitulé
    const auto = {} as Record<Champ, number>;
    CHAMPS.forEach((c) => {
      const k = entetes.findIndex((e) => c.indices.some((ind) => e.toLowerCase() === ind)) ;
      const k2 = k >= 0 ? k : entetes.findIndex((e) => c.indices.some((ind) => e.toLowerCase().includes(ind)));
      if (k2 >= 0) auto[c.cle] = k2;
    });
    setColonnes(auto);
    setFichier({ nom: f.name, entetes, lignes: tableau.slice(1) });
  };

  const apercu = useMemo(() => {
    if (!fichier) return [];
    return fichier.lignes.map((l) => ({
      numero: colonnes.numero !== undefined ? (l[colonnes.numero] ?? "").trim() : "",
      code_lead: colonnes.code_lead !== undefined ? (l[colonnes.code_lead] ?? "").trim() : "",
      date: colonnes.date !== undefined ? dateIso(l[colonnes.date] ?? "") : "",
      client: colonnes.client !== undefined ? (l[colonnes.client] ?? "").trim() : "",
      code_client: colonnes.code_client !== undefined ? (l[colonnes.code_client] ?? "").trim() : "",
      montant: colonnes.montant !== undefined ? (l[colonnes.montant] ?? "").replace(/[^\d,.-]/g, "") : "",
    }));
  }, [fichier, colonnes]);
  const valides = apercu.filter((l) => l.numero);
  const avecCode = valides.filter((l) => l.code_lead).length;

  const importer = () =>
    start(async () => {
      const r = await importerNavision(fichier!.nom, valides);
      toast(r.message);
      if (r.ok) setFichier(null);
    });

  return (
    <>
      <Link href="/lead-management" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        <ChevronLeft aria-hidden className="size-4" />
        Lead management
      </Link>
      <PageHeader
        title="Commandes Navision"
        description="Chaque mois, importez l’export des commandes Navision : les commandes portant un code lead sont rapprochées de leur lead, qui passe à « signé »."
        actions={
          modifiable ? (
            <>
              <input ref={champFichier} type="file" accept=".csv,.txt" hidden onChange={(e) => e.target.files?.[0] && charger(e.target.files[0]).finally(() => (e.target.value = ""))} />
              <Button variant="primary" onClick={() => champFichier.current?.click()}>
                <Upload aria-hidden />
                Importer l’export
              </Button>
            </>
          ) : null
        }
      />

      <KpiBand
        className="mb-6"
        items={[
          { label: "Commandes importées", value: commandes.length, icon: FileSpreadsheet, tone: "neutral", note: imports[0] ? `Dernier import le ${dateFr(imports[0].le)}` : "Aucun import" },
          { label: "Rapprochées d’un lead", value: rapprochees.length, icon: Link2, tone: "accent", note: commandes.length ? `${Math.round((rapprochees.length / commandes.length) * 100)} % des commandes` : undefined },
          { label: "CA issu des leads", value: euros(ca), icon: Receipt, tone: "success", note: "Montant HT des commandes rapprochées" },
          { label: "Transformation", value: leadsAttribues ? Math.round((leadsSignes / leadsAttribues) * 100) : "–", unit: leadsAttribues ? "%" : undefined, icon: Link2, tone: "cta", note: `${leadsSignes} lead${leadsSignes > 1 ? "s" : ""} commandé${leadsSignes > 1 ? "s" : ""} sur ${leadsAttribues} attribués` },
        ]}
      />

      {/* Import en cours : correspondance des colonnes et aperçu */}
      {fichier ? (
        <Panel className="mb-6">
          <PanelHeader title={`Import de ${fichier.nom}`} description={`${valides.length} commandes lues, dont ${avecCode} avec un code lead. Vérifiez la correspondance des colonnes.`} />
          <PanelBody className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {CHAMPS.map((c) => (
                <label key={c.cle} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-text">
                    {c.label}
                    {c.requis ? <span className="text-cta-deep"> *</span> : null}
                  </span>
                  <select
                    value={colonnes[c.cle] ?? ""}
                    onChange={(e) => setColonnes((x) => ({ ...x, [c.cle]: e.target.value === "" ? undefined : Number(e.target.value) }) as Record<Champ, number>)}
                    className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm text-text focus:border-accent focus:outline-none"
                  >
                    <option value="">Non renseigné</option>
                    {fichier.entetes.map((e, i) => (
                      <option key={i} value={i}>
                        {e || `Colonne ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full text-sm">
                <thead className="bg-sunken text-left text-xs text-text-3">
                  <tr>
                    {CHAMPS.map((c) => (
                      <th key={c.cle} className="px-3 py-2 font-medium">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {apercu.slice(0, 5).map((l, i) => (
                    <tr key={i}>
                      {CHAMPS.map((c) => (
                        <td key={c.cle} className="whitespace-nowrap px-3 py-2 text-text-2">
                          {l[c.cle] || "–"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setFichier(null)}>
                Annuler
              </Button>
              <Button variant="primary" disabled={pending || colonnes.numero === undefined || colonnes.code_lead === undefined || !valides.length} onClick={importer}>
                Importer {valides.length} commandes
              </Button>
            </div>
          </PanelBody>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <PanelHeader
            title="Commandes"
            actions={
              <Segmented
                size="sm"
                label="Filtre"
                value={filtre}
                onChange={setFiltre}
                options={[
                  { value: "rapprochees", label: "Rapprochées", count: rapprochees.length },
                  { value: "sans_lead", label: "Code lead inconnu", count: commandes.filter((c) => !c.lead && c.codeLead).length },
                ]}
              />
            }
          />
          {visibles.length ? (
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-text-3">
                  <tr>
                    <th className="px-6 py-2 font-medium">Commande</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Client</th>
                    <th className="px-3 py-2 font-medium">Lead</th>
                    <th className="px-6 py-2 text-right font-medium">Montant HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibles.slice(0, 200).map((c) => (
                    <tr key={c.numero} className="hover:bg-sunken">
                      <td className="tabular px-6 py-2 font-medium text-text">{c.numero}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-text-2">{c.date ? dateFr(c.date) : "–"}</td>
                      <td className="max-w-60 truncate px-3 py-2 text-text-2">{c.client ?? "–"}</td>
                      <td className="px-3 py-2">
                        {c.lead ? (
                          <Link href={`/lead-management/${c.lead.id}`} className="font-medium text-accent hover:underline">
                            {c.lead.reference}
                          </Link>
                        ) : (
                          <Badge variant="warning">{c.codeLead} introuvable</Badge>
                        )}
                      </td>
                      <td className={cn("tabular px-6 py-2 text-right", c.montant ? "text-text" : "text-text-3")}>{c.montant ? euros(c.montant) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <PanelBody>
              <p className="text-sm text-text-3">{filtre === "rapprochees" ? "Aucune commande rapprochée pour l’instant." : "Tous les codes lead ont été reconnus."}</p>
            </PanelBody>
          )}
        </Panel>

        <Panel className="self-start">
          <PanelHeader title="Imports" description="Les douze derniers" />
          <PanelBody>
            {imports.length ? (
              <ul className="divide-y divide-line">
                {imports.map((i) => (
                  <li key={i.id} className="py-2">
                    <p className="truncate text-sm font-medium text-text">{i.fichier}</p>
                    <p className="text-xs text-text-3">
                      {dateFr(i.le)}, {i.lignes} commandes, {i.rapprochees} rapprochées
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-3">Aucun import. Le fichier attendu est l’export CSV des commandes, avec au moins le numéro de commande et le code lead.</p>
            )}
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
