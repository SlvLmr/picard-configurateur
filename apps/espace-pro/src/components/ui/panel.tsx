import { cn } from "@/lib/cn";
import { TexteEditable } from "./texte-editable";

/** Conteneur pour un ensemble de données qu'on manipule. Ne pas l'utiliser pour décorer. */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("rounded-lg border border-line bg-surface shadow-card", className)} {...props} />;
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start gap-4 px-6 pb-4 pt-5", className)}>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-text">{typeof title === "string" ? <TexteEditable champ="panneau" defaut={title} /> : title}</h2>
        {description ? <p className="mt-0.5 text-sm text-text-3">{typeof description === "string" ? <TexteEditable champ="panneau-description" defaut={description} /> : description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
