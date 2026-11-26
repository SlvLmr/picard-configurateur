import { Sparkles } from "lucide-react";
import { PageHeader } from "./page-header";

/** Rubrique annoncée dans le menu mais pas encore construite : ce qu'elle permettra de faire. */
export function PageAVenir({ titre, description, fonctions }: { titre: string; description: string; fonctions: string[] }) {
  return (
    <>
      <PageHeader title={titre} description={description} />
      <section className="rounded-lg border border-line bg-surface p-8 shadow-card">
        <p className="flex items-center gap-2 text-sm font-semibold text-accent-strong">
          <Sparkles aria-hidden className="size-4" />
          Bientôt disponible
        </p>
        <p className="mt-2 max-w-prose text-base text-text-2">Cette rubrique est en préparation. Elle permettra de :</p>
        <ul className="mt-4 flex flex-col gap-2">
          {fonctions.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-text">
              <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-cta" />
              {f}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
