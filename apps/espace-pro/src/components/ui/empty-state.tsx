import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-line-strong px-8 py-12", className)}>
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      {children ? <div className="mt-2 max-w-prose text-sm text-text-2">{children}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
