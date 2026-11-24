"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { basculerAction } from "@/app/(app)/crm/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { ActionCrm } from "@/lib/data/crm";
import { aujourdhuiParis, formatJourCourt } from "./libelles-activites";

/** Actions à cocher. L'échéance passe en rouge quand elle est dépassée. */
export function ListeActions({
  actions,
  peutEcrire,
  afficherCompte = false,
  vide,
}: {
  actions: ActionCrm[];
  peutEcrire: boolean;
  afficherCompte?: boolean;
  vide: string;
}) {
  const toast = useToast();
  const [faites, setFaites] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();
  const auj = aujourdhuiParis();

  if (!actions.length) return <p className="border-t border-line px-6 py-6 text-sm text-text-2">{vide}</p>;

  const basculer = (a: ActionCrm, fait: boolean) => {
    setFaites((f) => ({ ...f, [a.id]: fait }));
    startTransition(async () => {
      const r = await basculerAction(a.id, fait, a.compteId);
      if (!r.ok) setFaites((f) => ({ ...f, [a.id]: !fait }));
      toast(r.message);
    });
  };

  return (
    <ul>
      {actions.map((a) => {
        const fait = faites[a.id] ?? a.statut === "fait";
        const enRetard = !fait && a.echeance !== null && a.echeance < auj;
        return (
          <li key={a.id} className="flex items-start gap-3 border-t border-line px-6 py-3">
            <input
              id={`action-${a.id}`}
              type="checkbox"
              checked={fait}
              disabled={!peutEcrire}
              onChange={(e) => basculer(a, e.target.checked)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm accent-[color:var(--accent)] disabled:cursor-not-allowed"
            />
            <label htmlFor={`action-${a.id}`} className="min-w-0 flex-1 cursor-pointer">
              <span className={cn("block text-sm font-medium", fait ? "text-text-3 line-through" : "text-text")}>{a.titre}</span>
              <span className="mt-0.5 block text-xs text-text-3">
                {afficherCompte && a.compteNom ? (
                  <>
                    <Link href={`/crm/${a.compteId}`} className="font-medium text-accent hover:underline">
                      {a.compteNom}
                    </Link>
                    {a.echeance ? ", " : ""}
                  </>
                ) : null}
                {a.echeance ? (
                  <span className={cn(enRetard && "font-medium text-danger")}>
                    {enRetard ? "En retard, prévue le " : "Pour le "}
                    {formatJourCourt(a.echeance)}
                  </span>
                ) : !afficherCompte ? (
                  "Sans échéance"
                ) : null}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
