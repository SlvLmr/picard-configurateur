"use client";

import { Info, Megaphone, Pin, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Picto } from "@/components/ui/picto";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import type { Annonce } from "@/lib/data/accueil";

type Filtre = "toutes" | Annonce["ton"];

const STYLE = {
  info: { icon: Info, tone: "accent" as const, bord: "border-l-accent", label: "Information" },
  operation: { icon: Megaphone, tone: "cta" as const, bord: "border-l-cta", label: "Opération" },
  important: { icon: TriangleAlert, tone: "warning" as const, bord: "border-l-warning", label: "Important" },
};

const dateFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export function PageNews({ annonces, admin }: { annonces: Annonce[]; admin: boolean }) {
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const liste = filtre === "toutes" ? annonces : annonces.filter((a) => a.ton === filtre);
  const compte = (t: Annonce["ton"]) => annonces.filter((a) => a.ton === t).length;

  return (
    <>
      <PageHeader
        title="News"
        description="Les actualités du réseau : opérations, nouveautés produits et informations importantes."
        actions={admin ? <ButtonLink href="/administration/contenus" variant="primary"><Megaphone aria-hidden />Publier une annonce</ButtonLink> : null}
      />
      <div className="mb-6 overflow-x-auto">
        <Segmented
          label="Filtrer les actualités"
          value={filtre}
          onChange={setFiltre}
          options={[
            { value: "toutes", label: "Toutes", count: annonces.length },
            { value: "operation", label: "Opérations", count: compte("operation") },
            { value: "important", label: "Important", count: compte("important") },
            { value: "info", label: "Informations", count: compte("info") },
          ]}
        />
      </div>
      {liste.length === 0 ? (
        <EmptyState title="Aucune actualité pour le moment">Les prochaines annonces apparaîtront ici et sur votre accueil.</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {liste.map((a) => {
            const s = STYLE[a.ton];
            return (
              <li key={a.id} className={cn("flex h-full flex-col gap-4 rounded-lg border border-l-4 border-line bg-surface p-6 shadow-card", s.bord)}>
                <div className="flex items-start gap-3">
                  <Picto icon={s.icon} tone={s.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-text-3">
                      <span className="font-semibold text-text-2">{s.label}</span>
                      <span>{dateFr(a.debut)}</span>
                      {a.epinglee ? (
                        <span className="inline-flex items-center gap-1 text-cta-deep">
                          <Pin aria-hidden className="size-3" />
                          À la une
                        </span>
                      ) : null}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-text">{a.titre}</h2>
                  </div>
                </div>
                <p className="text-sm leading-6 text-text-2">{a.contenu}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-text-3">
                  <span>{a.fin ? `Jusqu’au ${dateFr(a.fin)}` : "Sans date de fin"}</span>
                  {a.lienUrl ? (
                    a.lienUrl.startsWith("/") ? (
                      <Link href={a.lienUrl} className="text-sm font-medium text-accent hover:underline">
                        {a.lienLibelle ?? "En savoir plus"}
                      </Link>
                    ) : (
                      <a href={a.lienUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">
                        {a.lienLibelle ?? "En savoir plus"}
                      </a>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
