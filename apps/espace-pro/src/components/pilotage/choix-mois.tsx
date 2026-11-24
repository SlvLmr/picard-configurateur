"use client";

import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";
import { MOIS_LONGS } from "./montants";
import { lienPilotage, type EtatVue } from "./navigation";

/** Choix du mois affiché en vue mensuelle (mois saisis uniquement). */
export function ChoixMois({ etat, mois, dernier, annee }: { etat: EtatVue; mois: number; dernier: number; annee: number }) {
  const router = useRouter();
  const options = Array.from({ length: Math.max(dernier, 1) }, (_, i) => i + 1)
    .reverse()
    .map((m) => ({ value: String(m), label: `${MOIS_LONGS[m - 1].charAt(0).toUpperCase()}${MOIS_LONGS[m - 1].slice(1)} ${annee}`, detail: m === dernier ? "Mois en cours" : undefined }));
  return (
    <Combobox
      label="Mois affiché"
      size="sm"
      className="w-60"
      options={options}
      value={String(mois)}
      onChange={(v) => router.push(lienPilotage(etat, { mois: Number(v) }), { scroll: false })}
    />
  );
}
