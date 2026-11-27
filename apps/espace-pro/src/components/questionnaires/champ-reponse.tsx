"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Question, Reponses } from "@/lib/questionnaires";

/* Saisie d'une réponse, partagée par la page Questionnaires et la fenêtre de l'accueil */
export const zoneTexte = "min-h-24 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none";

export const questionsManquantes = (questions: Question[], r: Reponses) =>
  questions.filter((x) => x.obligatoire && (r[x.id] === undefined || r[x.id] === "" || (Array.isArray(r[x.id]) && !(r[x.id] as string[]).length)));

export function ChampReponse({ q, valeur, onChange }: { q: Question; valeur: Reponses[string] | undefined; onChange: (v: Reponses[string]) => void }) {
  const pastille = (actif: boolean) => cn("inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors", actif ? "border-text bg-text text-surface" : "border-line-strong text-text-2 hover:border-text-2");
  if (q.type === "note")
    return (
      <div className="flex gap-1" role="radiogroup" aria-label={q.libelle}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={valeur === n} aria-label={`${n} sur 5`} onClick={() => onChange(n)} className="p-1">
            <Star className={cn("size-8 transition-colors", typeof valeur === "number" && n <= valeur ? "fill-cta text-cta" : "text-line-strong hover:text-cta")} />
          </button>
        ))}
      </div>
    );
  if (q.type === "nps")
    return (
      <div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.libelle}>
          {Array.from({ length: 11 }, (_, n) => (
            <button key={n} type="button" role="radio" aria-checked={valeur === n} onClick={() => onChange(n)} className={pastille(valeur === n)}>
              {n}
            </button>
          ))}
        </div>
        <p className="mt-2 flex justify-between text-xs text-text-3">
          <span>Pas du tout probable</span>
          <span>Très probable</span>
        </p>
      </div>
    );
  if (q.type === "choix")
    return (
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.libelle}>
        {q.options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={valeur === o} onClick={() => onChange(o)} className={pastille(valeur === o)}>
            {o}
          </button>
        ))}
      </div>
    );
  if (q.type === "choix_multiple") {
    const liste = Array.isArray(valeur) ? valeur : [];
    return (
      <div className="flex flex-wrap gap-2">
        {q.options.map((o) => (
          <button key={o} type="button" aria-pressed={liste.includes(o)} onClick={() => onChange(liste.includes(o) ? liste.filter((x) => x !== o) : [...liste, o])} className={pastille(liste.includes(o))}>
            {o}
          </button>
        ))}
      </div>
    );
  }
  return <textarea aria-label={q.libelle} className={zoneTexte} value={typeof valeur === "string" ? valeur : ""} onChange={(e) => onChange(e.target.value)} />;
}

