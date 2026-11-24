"use client";

import { Send } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { repondre } from "./actions";

const couleur = (n: number) => (n >= 9 ? "var(--success)" : n >= 7 ? "var(--warning)" : "var(--danger)");

export function FormulaireEnquete({ jeton, cible }: { jeton: string; cible: "client" | "installateur" }) {
  const [note, setNote] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [resultat, setResultat] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  if (resultat?.ok) return <p className="mt-8 rounded-md bg-success-soft px-4 py-3 text-sm text-success">{resultat.message}</p>;

  return (
    <form
      className="mt-8 flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (note === null) return;
        start(async () => setResultat(await repondre(jeton, note, commentaire)));
      }}
    >
      <fieldset>
        <legend className="sr-only">Note de 0 à 10</legend>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              aria-pressed={note === n}
              onClick={() => setNote(n)}
              className={cn("tabular h-12 rounded-md border text-base font-semibold transition-colors", note === n ? "text-white" : "border-line-strong bg-surface text-text hover:bg-sunken")}
              style={note === n ? { background: couleur(n), borderColor: couleur(n) } : undefined}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-text-3">
          <span>Pas du tout</span>
          <span>Tout à fait</span>
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor="commentaire" className="text-sm font-medium text-text">
          {cible === "client" ? "Un mot sur votre expérience ? (facultatif)" : "Qu’est-ce qui ferait progresser le service ? (facultatif)"}
        </label>
        <textarea
          id="commentaire"
          rows={4}
          maxLength={2000}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>
      {resultat && !resultat.ok ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{resultat.message}</p> : null}
      <Button type="submit" variant="primary" size="lg" disabled={pending || note === null} className="self-start">
        <Send aria-hidden />
        Envoyer mon avis
      </Button>
    </form>
  );
}
