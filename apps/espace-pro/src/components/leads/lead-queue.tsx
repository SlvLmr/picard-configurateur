"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatDuree } from "@/lib/format";
import type { Destinataire, Lead } from "@/lib/mock/leads";
import { SourcePicto } from "./source-picto";

type Filtre = "tous" | "sans_pro" | "gros";

/**
 * File de validation du répartiteur.
 * Chaque lead arrive avec une pré-attribution (Elite puis Premium, puis Officiel, puis client, puis ATC).
 * Le répartiteur valide ou choisit une alternative.
 */
export function LeadQueue({ leads, compact = false, readOnly = false }: { leads: Lead[]; compact?: boolean; readOnly?: boolean }) {
  const toast = useToast();
  const [items, setItems] = useState(leads);
  const [choix, setChoix] = useState<Record<string, number>>({});
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [leaving, setLeaving] = useState<string | null>(null);

  const visibles = useMemo(
    () =>
      items.filter((l) =>
        filtre === "sans_pro" ? l.suggestion.type === "ATC" : filtre === "gros" ? l.grosProjet : true,
      ),
    [items, filtre],
  );

  const destinataire = (l: Lead): Destinataire => {
    const i = choix[l.id] ?? -1;
    return i < 0 ? l.suggestion : l.alternatives[i];
  };

  const valider = (l: Lead) => {
    const d = destinataire(l);
    setLeaving(l.id);
    setTimeout(() => {
      setItems((xs) => xs.filter((x) => x.id !== l.id));
      setLeaving(null);
    }, 220);
    toast(`Lead ${l.id} attribué à ${d.nom}`);
  };

  return (
    <div>
      {!compact ? (
        <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
          <Segmented
            label="Filtrer les leads"
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "tous", label: "Tous", count: items.length },
              { value: "sans_pro", label: "Sans pro à proximité", count: items.filter((l) => l.suggestion.type === "ATC").length },
              { value: "gros", label: "Gros projets", count: items.filter((l) => l.grosProjet).length },
            ]}
          />
        </div>
      ) : null}

      {visibles.length === 0 ? (
        <p className="border-t border-line px-6 py-10 text-sm text-text-2">
          Aucun lead à valider dans cette vue. Les prochains arriveront ici dès leur réception.
        </p>
      ) : (
        <ul>
          {visibles.map((l) => {
            const d = destinataire(l);
            return (
              <li
                key={l.id}
                className={cn(
                  "grid gap-4 border-t border-line px-6 py-4 transition-all duration-200 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center",
                  leaving === l.id && "translate-x-4 opacity-0",
                )}
              >
                <div className="flex min-w-0 gap-3">
                  <SourcePicto source={l.source} />
                  <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-text">{l.contact}</span>
                    <span className="text-text-3">{l.ville} ({l.departement})</span>
                    {l.grosProjet ? <Badge variant="warning">Gros projet</Badge> : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-text-2">{l.projet}</p>
                  <p className="tabular mt-1 text-xs text-text-3">
                    Reçu il y a {formatDuree(l.recuIlYaMin)}, via {l.source}
                  </p>
                  </div>
                </div>

                <div className="min-w-0">
                  {l.alternatives.length && !readOnly ? (
                    <>
                      <Combobox
                        size="sm"
                        className="max-w-64"
                        label={`Destinataire du lead ${l.id}`}
                        value={String(choix[l.id] ?? -1)}
                        onChange={(v) => setChoix((c) => ({ ...c, [l.id]: Number(v) }))}
                        options={[
                          { value: "-1", label: l.suggestion.nom, detail: "Suggestion automatique", prefixe: <NiveauBadge type={l.suggestion.type} /> },
                          ...l.alternatives.map((a, i) => ({ value: String(i), label: a.nom, prefixe: <NiveauBadge type={a.type} /> })),
                        ]}
                      />
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-text">{d.nom}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <NiveauBadge type={d.type} />
                    {d.distanceKm !== undefined ? (
                      <span className="tabular text-xs text-text-3">{d.distanceKm.toLocaleString("fr-FR")} km</span>
                    ) : (
                      <span className="text-xs text-text-3">Aucun client à proximité</span>
                    )}
                  </div>
                </div>

                {!readOnly ? (
                  <Button variant="primary" size="sm" onClick={() => valider(l)} className="justify-self-start md:justify-self-end">
                    <Check aria-hidden />
                    Attribuer
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
