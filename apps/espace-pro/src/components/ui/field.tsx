import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const control =
  "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-text placeholder:text-text-3 transition-colors focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(control, "cursor-pointer appearance-none bg-no-repeat pr-10", className)} style={{ backgroundImage: "var(--chevron)" }} {...props}>
      {children}
    </select>
  );
});
