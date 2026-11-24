"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NiveauBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import type { CommercialNom, CompteCrm } from "@/lib/data/crm";
import { ilYa } from "@/lib/temps";

type FiltreNiveau = "tous" | "Elite" | "Premium" | "Officiel";
type Tri = "nom" | "activite" | "points";

const normaliser = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Liste filtrable du portefeuille : recherche, niveau IAP, commercial, département. */
export function Portefeuille({ comptes, commerciaux, afficherCommercial }: { comptes: CompteCrm[]; commerciaux: CommercialNom[]; afficherCommercial: boolean }) {
  const [recherche, setRecherche] = useState("");
  const [niveau, setNiveau] = useState<FiltreNiveau>("tous");
  const [commercial, setCommercial] = useState("tous");
  const [departement, setDepartement] = useState("tous");
  const [tri, setTri] = useState<Tri>("activite");

  const nomCommercial = useMemo(() => new Map(commerciaux.map((c) => [c.id, `${c.prenom} ${c.nom}`])), [commerciaux]);
  const departements = useMemo(
    () => Array.from(new Set(comptes.map((c) => c.departement).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    [comptes],
  );
  const commerciauxPresents = useMemo(
    () => commerciaux.filter((c) => comptes.some((x) => x.commercialId === c.id)),
    [commerciaux, comptes],
  );

  const visibles = useMemo(() => {
    const q = normaliser(recherche.trim());
    const l = comptes.filter(
      (c) =>
        (niveau === "tous" || c.niveau === niveau) &&
        (commercial === "tous" || c.commercialId === commercial) &&
        (departement === "tous" || c.departement === departement) &&
        (!q || normaliser(`${c.raisonSociale} ${c.ville ?? ""} ${c.cp ?? ""} ${c.numeroClient ?? ""}`).includes(q)),
    );
    return l.sort((a, b) =>
      tri === "nom" ? a.raisonSociale.localeCompare(b.raisonSociale, "fr") : tri === "points" ? b.points - a.points : b.leads - a.leads || b.signes - a.signes,
    );
  }, [comptes, recherche, niveau, commercial, departement, tri]);

  const compter = (n: FiltreNiveau) => comptes.filter((c) => n === "tous" || c.niveau === n).length;

  return (
    <div>
      <div className="flex flex-col gap-4 px-6 pb-4">
        <div className="relative max-w-md">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-3 size-4 text-text-3" />
          <label htmlFor="crm-recherche" className="sr-only">
            Rechercher un compte
          </label>
          <Input
            id="crm-recherche"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Raison sociale, ville, code postal, numéro client"
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Filtrer par niveau IAP"
            value={niveau}
            onChange={setNiveau}
            size="sm"
            options={[
              { value: "tous", label: "Tous", count: compter("tous") },
              { value: "Elite", label: "Elite", count: compter("Elite") },
              { value: "Premium", label: "Premium", count: compter("Premium") },
              { value: "Officiel", label: "Officiel", count: compter("Officiel") },
            ]}
          />
          {afficherCommercial && commerciauxPresents.length > 1 ? (
            <Filtre id="crm-commercial" label="Commercial" value={commercial} onChange={setCommercial}>
              <option value="tous">Tous les commerciaux</option>
              {commerciauxPresents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom}
                </option>
              ))}
            </Filtre>
          ) : null}
          <Filtre id="crm-departement" label="Département" value={departement} onChange={setDepartement}>
            <option value="tous">Tous les départements</option>
            {departements.map((d) => (
              <option key={d} value={d}>
                Département {d}
              </option>
            ))}
          </Filtre>
          <Filtre id="crm-tri" label="Trier par" value={tri} onChange={(v) => setTri(v as Tri)}>
            <option value="activite">Les plus actifs d’abord</option>
            <option value="points">Les plus de points d’abord</option>
            <option value="nom">Ordre alphabétique</option>
          </Filtre>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="border-t border-line px-6 py-10 text-sm text-text-2">Aucun compte ne correspond à ces critères. Élargissez la recherche ou retirez un filtre.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-t border-line text-left text-xs text-text-3">
                <th scope="col" className="px-6 py-3 font-medium">Compte</th>
                <th scope="col" className="px-3 py-3 font-medium">Niveau</th>
                {afficherCommercial ? <th scope="col" className="px-3 py-3 font-medium">Commercial</th> : null}
                <th scope="col" className="px-3 py-3 text-right font-medium">Leads sur 12 mois</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Signés</th>
                <th scope="col" className="px-6 py-3 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => (
                <tr key={c.id} className="group border-t border-line transition-colors hover:bg-sunken">
                  <td className="px-6 py-3">
                    <Link href={`/crm/${c.id}`} className="block rounded-sm font-semibold text-text group-hover:text-accent">
                      {c.raisonSociale}
                    </Link>
                    <span className="block text-xs text-text-3" suppressHydrationWarning>
                      {[c.cp, c.ville].filter(Boolean).join(" ") || "Adresse non renseignée"}
                      {c.dernierLead ? `, dernier lead ${ilYa(c.dernierLead)}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-3">{c.niveau ? <NiveauBadge type={c.niveau} /> : <NiveauBadge type="Client" />}</td>
                  {afficherCommercial ? <td className="px-3 py-3 text-text-2">{(c.commercialId && nomCommercial.get(c.commercialId)) || "Non affecté"}</td> : null}
                  <td className="tabular px-3 py-3 text-right text-text">{c.leads}</td>
                  <td className="tabular px-3 py-3 text-right font-semibold text-text">{c.signes}</td>
                  <td className="tabular px-6 py-3 text-right text-text-2">{c.points.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-6 py-3 text-xs text-text-3">
            {visibles.length} compte{visibles.length > 1 ? "s" : ""} sur {comptes.length}
          </p>
        </div>
      )}
    </div>
  );
}

function Filtre({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 cursor-pointer appearance-none rounded-md border border-line-strong bg-surface pl-3 pr-8 text-sm text-text hover:border-text-3 focus:border-accent"
        style={{ backgroundImage: "var(--chevron)", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
      >
        {children}
      </select>
    </>
  );
}
