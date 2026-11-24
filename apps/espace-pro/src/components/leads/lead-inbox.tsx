"use client";

import { Check, Ruler, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Cote } from "@/components/ui/cote";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatDuree } from "@/lib/format";
import type { Lead } from "@/lib/mock/leads";

/** Leads reçus par un installateur : acceptation sous délai, mesurée par une cote. */
export function LeadInbox({ leads, readOnly = false }: { leads: Lead[]; readOnly?: boolean }) {
  const toast = useToast();
  const [acceptes, setAcceptes] = useState<string[]>([]);
  const [refuses, setRefuses] = useState<string[]>([]);

  const visibles = leads.filter((l) => !refuses.includes(l.id));

  if (visibles.length === 0)
    return <p className="px-6 py-10 text-sm text-text-2">Aucun lead en attente. Vous serez prévenu par SMS dès qu’un nouveau lead vous est attribué.</p>;

  return (
    <ul>
      {visibles.map((l, i) => {
        const ok = acceptes.includes(l.id);
        const total = l.delaiTotalMin ?? 1440;
        const reste = l.delaiRestantMin ?? total;
        const ecoule = total - reste;
        const urgent = reste < total * 0.3;
        return (
          <li key={l.id} className={cn("px-6 py-5", i > 0 && "border-t border-line")}>
            <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-text">{l.projet}</p>
                <p className="mt-1 text-sm text-text-2">
                  {l.contact}, {l.ville}
                  {l.suggestion.distanceKm !== undefined ? ` à ${l.suggestion.distanceKm.toLocaleString("fr-FR")} km` : ""}
                </p>
              </div>
              <Badge variant="neutral">{l.source}</Badge>
            </div>

            {l.configurationMaPorte ? (
              <p className="mt-3 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent-strong">
                Déjà configurée par le client dans Ma Porte : {l.configurationMaPorte}.
              </p>
            ) : null}

            {!ok ? (
              <Cote
                className="mt-4 max-w-xl"
                label={`Délai d’acceptation du lead ${l.id}`}
                value={ecoule}
                max={total}
                tone={urgent ? "warning" : "accent"}
                valueLabel={`Encore ${formatDuree(reste)}`}
                startLabel="Reçu"
                endLabel="Réattribution automatique"
              />
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {readOnly ? (
                <>
                  <span className="text-sm text-text-2">Attribué à {l.suggestion.nom}</span>
                  <Button size="sm" className="ml-auto" onClick={() => toast(`Relance envoyée à ${l.suggestion.nom}`)}>
                    Relancer le client
                  </Button>
                </>
              ) : ok ? (
                <>
                  <Badge variant="success">
                    <Check aria-hidden />
                    Accepté
                  </Badge>
                  <span className="text-sm text-text-2">Coordonnées débloquées : 06 12 34 56 78</span>
                  <ButtonLink href="/configurateur" variant="primary" size="sm" className="ml-auto">
                    <Ruler aria-hidden />
                    Configurer la porte
                  </ButtonLink>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setAcceptes((a) => [...a, l.id]);
                      toast(`Lead accepté. ${l.contact} est prévenu(e) de votre appel.`);
                    }}
                  >
                    <Check aria-hidden />
                    Accepter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRefuses((r) => [...r, l.id]);
                      toast("Lead refusé. Il est proposé au professionnel suivant.");
                    }}
                  >
                    <X aria-hidden />
                    Refuser
                  </Button>
                  <span className="ml-auto text-xs text-text-3">+20 points à l’acceptation</span>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
