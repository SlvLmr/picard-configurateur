import { cn } from "@/lib/cn";
import { TexteEditable } from "./texte-editable";

export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
  editable = true,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Élément placé à côté du titre (ex. niveau IAP) */
  meta?: React.ReactNode;
  className?: string;
  /** Titre et description modifiables par l'administrateur (désactiver pour un texte calculé) */
  editable?: boolean;
}) {
  return (
    <header className={cn("flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:gap-8", className)}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl font-semibold text-text sm:text-2xl">{editable && typeof title === "string" ? <TexteEditable champ="titre" defaut={title} /> : title}</h1>
          {meta}
        </div>
        {description ? (
          <p className="mt-2 max-w-prose text-base text-text-2">
            {editable && typeof description === "string" ? <TexteEditable champ="description" defaut={description} multiligne /> : description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
