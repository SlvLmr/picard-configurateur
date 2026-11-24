"use client";

import { useState, useTransition } from "react";
import { majParametre } from "@/app/(app)/administration/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import type { Parametre } from "@/lib/data/administration";

export function GestionParametres({ parametres }: { parametres: Parametre[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [valeurs, setValeurs] = useState<Record<string, string>>(() => Object.fromEntries(parametres.map((p) => [p.cle, String(p.valeur)])));
  const groupes = Array.from(new Set(parametres.map((p) => p.groupe)));

  return (
    <>
      <PageHeader title="Paramètres" description="Les règles de fonctionnement de l’Espace Pro. Une modification s’applique immédiatement." />
      <div className="flex flex-col gap-8">
        {groupes.map((g) => (
          <Panel key={g}>
            <PanelHeader title={g} />
            <ul>
              {parametres.filter((p) => p.groupe === g).map((p) => {
                const modifie = valeurs[p.cle] !== String(p.valeur);
                return (
                  <li key={p.cle} className="grid gap-3 border-t border-line px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <label htmlFor={`p-${p.cle}`} className="font-semibold text-text">{p.libelle}</label>
                      {p.aide ? <p className="mt-0.5 text-sm text-text-2">{p.aide}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input id={`p-${p.cle}`} type="number" min={0} value={valeurs[p.cle]} onChange={(e) => setValeurs({ ...valeurs, [p.cle]: e.target.value })} className="w-24 text-right tabular" />
                      <span className="w-12 text-sm text-text-3">{p.unite}</span>
                      <Button
                        size="sm"
                        variant={modifie ? "primary" : "secondary"}
                        disabled={pending || !modifie}
                        onClick={() => start(async () => toast((await majParametre(p.cle, Number(valeurs[p.cle]))).message))}
                      >
                        Enregistrer
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>
    </>
  );
}
