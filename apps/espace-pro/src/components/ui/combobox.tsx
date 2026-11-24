"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type OptionCombobox = {
  value: string;
  label: string;
  /** Ligne secondaire (ville, niveau, distance…) */
  detail?: string;
  /** Élément affiché à gauche (badge, picto) */
  prefixe?: React.ReactNode;
  groupe?: string;
  desactive?: boolean;
};

/**
 * Menu déroulant du design system : liste stylée, recherche intégrée au-delà de 7 options,
 * groupes, navigation au clavier. Remplace le select natif partout où le choix compte.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Choisir",
  label,
  id,
  size = "md",
  recherche,
  className,
  disabled,
}: {
  options: OptionCombobox[];
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Libellé accessible si aucun <label> visible n'est associé */
  label?: string;
  id?: string;
  size?: "sm" | "md";
  recherche?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const [ouvert, setOuvert] = useState(false);
  const [q, setQ] = useState("");
  const [actif, setActif] = useState(0);
  const racine = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const avecRecherche = recherche ?? options.length > 7;
  const choisi = options.find((o) => o.value === value) ?? null;

  const filtrees = useMemo(() => {
    const n = q.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!n) return options;
    return options.filter((o) =>
      `${o.label} ${o.detail ?? ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(n),
    );
  }, [options, q]);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (!racine.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    setActif(Math.max(0, filtrees.findIndex((o) => o.value === value)));
    requestAnimationFrame(() => (avecRecherche ? champ.current?.focus() : liste.current?.focus()));
    return () => document.removeEventListener("mousedown", fermer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert]);

  useEffect(() => {
    liste.current?.querySelector<HTMLElement>(`[data-index="${actif}"]`)?.scrollIntoView({ block: "nearest" });
  }, [actif]);

  const choisir = (o: OptionCombobox) => {
    if (o.desactive) return;
    onChange(o.value);
    setOuvert(false);
    setQ("");
  };

  const clavier = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActif((a) => Math.min(a + 1, filtrees.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActif((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtrees[actif]) choisir(filtrees[actif]);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  };

  let groupePrecedent: string | undefined;

  return (
    <div ref={racine} className={cn("relative min-w-0", className)}>
      <button
        id={baseId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label={label}
        onClick={() => setOuvert((o) => !o)}
        onKeyDown={(e) => {
          if (!ouvert && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOuvert(true);
          }
        }}
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-md border bg-surface text-left text-sm text-text shadow-card transition-colors hover:border-text-3 disabled:pointer-events-none disabled:opacity-50",
          size === "sm" ? "h-8 px-2" : "h-10 px-3",
          ouvert ? "border-accent" : "border-line-strong",
        )}
      >
        {choisi?.prefixe ? <span className="shrink-0">{choisi.prefixe}</span> : null}
        <span className={cn("min-w-0 flex-1 truncate", choisi ? "font-medium" : "text-text-3")}>{choisi?.label ?? placeholder}</span>
        <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-text-3 transition-transform", ouvert && "rotate-180")} />
      </button>

      {ouvert ? (
        <div className="absolute left-0 right-0 z-40 mt-1 min-w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-2xl">
          {avecRecherche ? (
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search aria-hidden className="size-4 shrink-0 text-text-3" />
              <input
                ref={champ}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActif(0);
                }}
                onKeyDown={clavier}
                placeholder="Rechercher"
                aria-label="Rechercher dans la liste"
                aria-controls={`${baseId}-liste`}
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-text-3 focus:outline-none"
              />
            </div>
          ) : null}
          <ul
            ref={liste}
            id={`${baseId}-liste`}
            role="listbox"
            tabIndex={-1}
            onKeyDown={avecRecherche ? undefined : clavier}
            className="max-h-80 overflow-y-auto p-1 focus:outline-none"
          >
            {filtrees.length === 0 ? (
              <li className="px-3 py-4 text-sm text-text-3">Aucun résultat pour « {q} ».</li>
            ) : (
              filtrees.map((o, i) => {
                const titreGroupe = o.groupe && o.groupe !== groupePrecedent ? o.groupe : null;
                groupePrecedent = o.groupe;
                return (
                  <li key={o.value} role="presentation">
                    {titreGroupe ? <p className="px-3 pb-1 pt-3 text-xs font-semibold text-text-3">{titreGroupe}</p> : null}
                    <div
                      role="option"
                      data-index={i}
                      aria-selected={o.value === value}
                      aria-disabled={o.desactive}
                      onMouseEnter={() => setActif(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choisir(o)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                        i === actif && "bg-sunken",
                        o.desactive && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {o.prefixe ? <span className="shrink-0">{o.prefixe}</span> : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text">{o.label}</span>
                        {o.detail ? <span className="block truncate text-xs text-text-3">{o.detail}</span> : null}
                      </span>
                      {o.value === value ? <Check aria-hidden className="size-4 shrink-0 text-accent" /> : null}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
