"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import type { CommercialCA } from "@/lib/data/pilotage";
import { BarreObjectif, Evolution } from "./barre-objectif";
import { evolution, montantCourt, ratio } from "./montants";

type Tri = "atteinte" | "realise" | "evolution";

/** Équipe commerciale : réalisé, atteinte du budget à date, évolution sur un an. */
export function TableauCommerciaux({ commerciaux }: { commerciaux: CommercialCA[] }) {
  const [tri, setTri] = useState<Tri>("atteinte");
  const lignes = useMemo(() => {
    const l = commerciaux.map((c) => ({
      ...c,
      atteinte: ratio(c.realise_cumul, c.budget_cumul),
      evol: evolution(c.realise_cumul, c.n1_cumul),
    }));
    const cle = (x: (typeof l)[number]) => (tri === "atteinte" ? x.atteinte ?? -1 : tri === "evolution" ? x.evol ?? -999 : x.realise_cumul);
    return l.sort((a, b) => cle(b) - cle(a));
  }, [commerciaux, tri]);

  return (
    <div>
      <div className="px-6 pb-4">
        <Segmented
          label="Trier l’équipe"
          value={tri}
          onChange={setTri}
          size="sm"
          options={[
            { value: "atteinte", label: "Atteinte du budget" },
            { value: "realise", label: "Réalisé" },
            { value: "evolution", label: "Évolution" },
          ]}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-t border-line text-left text-xs font-medium text-text-3">
              <th scope="col" className="px-6 py-3 font-medium">Commercial</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Comptes</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Réalisé à date</th>
              <th scope="col" className="px-3 py-3 font-medium">Atteinte du budget</th>
              <th scope="col" className="px-6 py-3 text-right font-medium">Sur un an</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((c) => (
              <tr key={c.id} className="border-t border-line transition-colors hover:bg-sunken">
                <td className="px-6 py-3">
                  <span className="block font-semibold text-text">
                    {c.prenom} {c.nom.charAt(0) + c.nom.slice(1).toLowerCase()}
                  </span>
                  <span className="block text-xs text-text-3">
                    {c.equipe}
                    {c.fonction ? `, ${c.fonction.toLowerCase()}` : ""}
                  </span>
                </td>
                <td className="tabular px-3 py-3 text-right text-text-2">{c.comptes}</td>
                <td className="tabular px-3 py-3 text-right font-semibold text-text">{montantCourt(c.realise_cumul)}</td>
                <td className="px-3 py-3">
                  <BarreObjectif pct={c.atteinte} label={`Atteinte du budget de ${c.prenom} ${c.nom}`} />
                </td>
                <td className="px-6 py-3 text-right">
                  <Evolution valeur={c.evol} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
