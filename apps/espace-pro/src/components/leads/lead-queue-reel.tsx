"use client";

import { Check } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { attribuerLead } from "@/app/(app)/leads/actions";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { LeadReel } from "@/lib/data/types";
import { ilYa } from "@/lib/temps";
import { SourcePicto } from "./source-picto";

type Filtre = "tous" | "sans_pro" | "gros";

/** File de validation branchée sur la base : l'attribution appelle ep_attribuer_lead. */
export function LeadQueueReel({ leads, peutAttribuer, compact = false }: { leads: LeadReel[]; peutAttribuer: boolean; compact?: boolean }) {
  const toast = useToast();
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [partis, setPartis] = useState<string[]>([]);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const restants = leads.filter((l) => !partis.includes(l.id));
  const visibles = useMemo(
    () => restants.filter((l) => (filtre === "sans_pro" ? l.suggestion?.type !== "compte" : filtre === "gros" ? l.grosProjet : true)),
    [restants, filtre],
  );

  const attribuer = (l: LeadReel) => {
    const compteId = choix[l.id] && choix[l.id] !== "suggestion" ? choix[l.id] : null;
    setEnCours(l.id);
    startTransition(async () => {
      const r = await attribuerLead(l.id, compteId);
      setEnCours(null);
      if (r.ok) setPartis((p) => [...p, l.id]);
      toast(r.message);
    });
  };

  return (
    <div>
      {!compact ? (
        <div className="px-6 pb-4">
          <Segmented
            label="Filtrer les leads"
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "tous", label: "Tous", count: restants.length },
              { value: "sans_pro", label: "Sans pro à proximité", count: restants.filter((l) => l.suggestion?.type !== "compte").length },
              { value: "gros", label: "Gros projets", count: restants.filter((l) => l.grosProjet).length },
            ]}
          />
        </div>
      ) : null}

      {visibles.length === 0 ? (
        <p className="border-t border-line px-6 py-10 text-sm text-text-2">Aucun lead à valider dans cette vue. Les prochains apparaîtront ici dès leur réception.</p>
      ) : (
        <ul>
          {(compact ? visibles.slice(0, 4) : visibles).map((l) => {
            const s = l.suggestion;
            return (
              <li
                key={l.id}
                className={cn(
                  "grid gap-4 border-t border-line px-6 py-4 transition-opacity md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] md:items-center",
                  enCours === l.id && "opacity-60",
                )}
              >
                <div className="flex min-w-0 gap-3">
                  <SourcePicto source={l.source} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/leads/${l.id}`} className="font-semibold text-text hover:text-accent hover:underline">
                        {l.contact}
                      </Link>
                      <span className="text-text-3">
                        {l.ville} ({l.departement})
                      </span>
                      {l.grosProjet ? <Badge variant="warning">Gros projet</Badge> : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-text-2">{l.projet}</p>
                    <p className="mt-0.5 text-xs text-text-3" suppressHydrationWarning>
                      {l.reference}, reçu {ilYa(l.recuLe)} via {l.source}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  {peutAttribuer && l.candidats.length ? (
                    <>
                      <Combobox
                        size="sm"
                        className="max-w-64"
                        label={`Destinataire du lead ${l.reference}`}
                        value={choix[l.id] ?? "suggestion"}
                        onChange={(v) => setChoix((c) => ({ ...c, [l.id]: v }))}
                        options={[
                          {
                            value: "suggestion",
                            label: s ? s.nom : "Choisir un professionnel",
                            detail: s ? "Suggestion automatique" : undefined,
                            prefixe: s?.type === "compte" ? <NiveauBadge type={s.niveau ?? "Client"} /> : s?.type === "commercial" ? <NiveauBadge type="ATC" /> : undefined,
                          },
                          ...l.candidats.map((c) => ({
                            value: c.id,
                            label: c.nom,
                            detail: c.ville ?? undefined,
                            prefixe: <NiveauBadge type={c.niveau ?? "Client"} />,
                          })),
                        ]}
                      />
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-text">{s?.nom ?? "À choisir"}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {s?.type === "compte" ? (
                      <>
                        {s.niveau ? <NiveauBadge type={s.niveau} /> : <NiveauBadge type="Client" />}
                        <span className="text-xs text-text-3">{s.ville ?? `Département ${l.departement}`}</span>
                      </>
                    ) : s?.type === "commercial" ? (
                      <>
                        <NiveauBadge type="ATC" />
                        <span className="text-xs text-text-3">Aucun client dans le département</span>
                      </>
                    ) : (
                      <span className="text-xs text-danger">Aucun professionnel ni commercial trouvé</span>
                    )}
                  </div>
                </div>

                {peutAttribuer ? (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={enCours === l.id || (!s && !choix[l.id])}
                    onClick={() => attribuer(l)}
                    className="justify-self-start md:justify-self-end"
                  >
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
