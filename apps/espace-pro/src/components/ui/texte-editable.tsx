"use client";

import { Pencil, RotateCcw } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { enregistrerTexte } from "@/app/(app)/textes-actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Contexte = { textes: Record<string, string>; admin: boolean; modifier: (cle: string, valeur: string | null) => void };
const Ctx = createContext<Contexte>({ textes: {}, admin: false, modifier: () => {} });

/** Fournit les textes personnalisés à toute l'application ; seul l'administrateur peut les modifier. */
export function TextesProvider({ textes, admin, children }: { textes: Record<string, string>; admin: boolean; children: React.ReactNode }) {
  const [local, setLocal] = useState(textes);
  useEffect(() => setLocal(textes), [textes]);
  const modifier = (cle: string, valeur: string | null) =>
    setLocal((t) => {
      const n = { ...t };
      if (valeur) n[cle] = valeur;
      else delete n[cle];
      return n;
    });
  return <Ctx.Provider value={{ textes: local, admin, modifier }}>{children}</Ctx.Provider>;
}

/** Clé automatique : la page (les identifiants sont remplacés), le rôle du texte et son libellé d'origine. */
function cleAuto(chemin: string, champ: string, defaut: string) {
  const page = chemin.replace(/\/[0-9a-f-]{36}(?=\/|$)/gi, "/[id]");
  return `${page}|${champ}|${defaut}`.slice(0, 200);
}

/**
 * Texte modifiable sur place par l'administrateur : un crayon apparaît au survol,
 * Entrée enregistre, Échap annule, et une flèche rétablit le texte d'origine.
 */
export function TexteEditable({ defaut, champ, cle, multiligne = false }: { defaut: string; champ: string; cle?: string; multiligne?: boolean }) {
  const { textes, admin, modifier } = useContext(Ctx);
  const chemin = usePathname();
  const toast = useToast();
  const k = cle ?? cleAuto(chemin, champ, defaut);
  const valeur = textes[k] ?? defaut;
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState(valeur);
  const [, start] = useTransition();
  const champRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (edition) {
      champRef.current?.focus();
      champRef.current?.select();
    }
  }, [edition]);

  if (!admin) return <>{valeur}</>;

  const enregistrer = (v: string | null) => {
    setEdition(false);
    const propre = v?.trim() ?? "";
    if ((propre || defaut) === valeur) return;
    const cible = propre && propre !== defaut ? propre : null;
    modifier(k, cible);
    start(async () => {
      const res = await enregistrerTexte(k, cible ?? "");
      if (!res.ok) {
        modifier(k, textes[k] ?? null);
        toast(res.message);
      }
    });
  };

  if (edition) {
    const commun = {
      value: brouillon,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBrouillon(e.target.value),
      onBlur: () => enregistrer(brouillon),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setBrouillon(valeur);
          setEdition(false);
        }
        if (e.key === "Enter" && (!multiligne || !e.shiftKey)) {
          e.preventDefault();
          enregistrer(brouillon);
        }
      },
      onClick: (e: React.MouseEvent) => e.preventDefault(),
      "aria-label": "Modifier le texte",
      className: "w-full min-w-40 rounded-sm bg-accent-soft/40 px-1 font-[inherit] text-inherit outline-none ring-2 ring-accent",
    };
    return multiligne ? <textarea ref={champRef} rows={2} {...commun} /> : <input ref={champRef} {...commun} />;
  }

  const modifie = textes[k] !== undefined;
  return (
    <span className="group/texte relative inline">
      {valeur}
      <span className="ml-2 inline-flex translate-y-[-2px] items-center gap-1 align-middle opacity-0 transition-opacity focus-within:opacity-100 group-hover/texte:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setBrouillon(valeur);
            setEdition(true);
          }}
          aria-label="Modifier ce texte"
          title="Modifier ce texte"
          className={cn("inline-flex size-6 items-center justify-center rounded-full border border-line bg-surface text-text-3 shadow-sm hover:text-accent")}
        >
          <Pencil className="size-3" />
        </button>
        {modifie ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              enregistrer(null);
            }}
            aria-label="Rétablir le texte d’origine"
            title={`Rétablir : ${defaut}`}
            className="inline-flex size-6 items-center justify-center rounded-full border border-line bg-surface text-text-3 shadow-sm hover:text-accent"
          >
            <RotateCcw className="size-3" />
          </button>
        ) : null}
      </span>
    </span>
  );
}
