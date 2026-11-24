"use client";

import { Children, Fragment, forwardRef, isValidElement, useMemo, useState, type ReactElement } from "react";
import { Combobox, type OptionCombobox } from "./combobox";
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

type ProprietesSelect = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value" | "defaultValue"> & {
  value?: string | number;
  defaultValue?: string | number;
  /** Même signature qu'un select natif : e.target.value */
  onChange?: (e: { target: { value: string; name?: string } }) => void;
};

/**
 * Menu déroulant de formulaire. S'écrit comme un <select> natif (enfants <option> et <optgroup>),
 * mais s'affiche avec le Combobox du design system (liste stylée, recherche au-delà de 7 choix).
 * Fonctionne aussi dans un <form> envoyé en FormData grâce à un champ caché.
 */
export function Select({ value, defaultValue, onChange, children, id, name, className, disabled, "aria-label": ariaLabel }: ProprietesSelect) {
  const options = useMemo(() => lireOptions(children), [children]);
  const controle = value !== undefined;
  const [interne, setInterne] = useState(String(defaultValue ?? options[0]?.value ?? ""));
  const courant = controle ? String(value) : interne;
  return (
    <>
      <Combobox
        id={id}
        label={ariaLabel}
        options={options}
        value={courant}
        disabled={disabled}
        className={cn("w-full", className)}
        placeholder={options.find((o) => o.value === "")?.label ?? "Choisir"}
        onChange={(v) => {
          if (!controle) setInterne(v);
          onChange?.({ target: { value: v, name } });
        }}
      />
      {name ? <input type="hidden" name={name} value={courant} /> : null}
    </>
  );
}

function lireOptions(enfants: React.ReactNode, groupe?: string): OptionCombobox[] {
  const res: OptionCombobox[] = [];
  Children.forEach(enfants, (e) => {
    if (!isValidElement(e)) return;
    const el = e as ReactElement<{ value?: string | number; children?: React.ReactNode; disabled?: boolean; label?: string }>;
    if (el.type === "optgroup") {
      res.push(...lireOptions(el.props.children, el.props.label));
    } else if (el.type === "option") {
      const texte = texteDe(el.props.children);
      res.push({ value: String(el.props.value ?? texte), label: texte, desactive: el.props.disabled, groupe });
    } else if (el.type === Fragment) {
      res.push(...lireOptions((el.props as { children?: React.ReactNode }).children, groupe));
    }
  });
  return res;
}

function texteDe(n: React.ReactNode): string {
  if (n == null || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(texteDe).join("");
  if (isValidElement(n)) return texteDe((n.props as { children?: React.ReactNode }).children);
  return "";
}
