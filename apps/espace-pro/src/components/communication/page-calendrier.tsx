"use client";

import { CalendarPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Calendrier, TYPES_AGENDA } from "@/components/accueil/calendrier";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import type { ElementAgenda, TypeAgenda } from "@/lib/data/accueil";

export function PageCalendrier({ elements, admin }: { elements: ElementAgenda[]; admin: boolean }) {
  const types = useMemo(() => Array.from(new Set(elements.map((e) => e.type))), [elements]);
  const [actifs, setActifs] = useState<Set<TypeAgenda>>(() => new Set(types));
  const visibles = elements.filter((e) => actifs.has(e.type));

  const basculer = (t: TypeAgenda) =>
    setActifs((s) => {
      const n = new Set(s);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });

  return (
    <>
      <PageHeader
        title="Calendrier"
        description="Salons, formations, webinaires et opérations du réseau, avec vos visites et vos échéances."
        actions={admin ? <ButtonLink href="/administration/contenus" variant="primary"><CalendarPlus aria-hidden />Ajouter un événement</ButtonLink> : null}
      />
      {types.length ? (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Types affichés">
          {types.map((t) => {
            const on = actifs.has(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => basculer(t)}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
                  on ? "border-line-strong bg-surface text-text shadow-card" : "border-line bg-transparent text-text-3",
                )}
              >
                <span aria-hidden className="size-2 rounded-full" style={{ background: on ? TYPES_AGENDA[t].couleur : "var(--line-strong)" }} />
                {TYPES_AGENDA[t].label}
                <span className="tabular text-xs text-text-3">{elements.filter((e) => e.type === t).length}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <Calendrier elements={visibles} />
    </>
  );
}
