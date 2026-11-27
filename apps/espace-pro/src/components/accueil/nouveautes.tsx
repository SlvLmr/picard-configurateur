"use client";

import { ClipboardList, MessageCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { repondreQuestionnaire } from "@/app/(app)/questionnaires/actions";
import { ChampReponse, questionsManquantes } from "@/components/questionnaires/champ-reponse";
import { Button } from "@/components/ui/button";
import { Picto } from "@/components/ui/picto";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Annonce } from "@/lib/data/accueil";
import type { Question, Reponses } from "@/lib/questionnaires";

/** Questionnaire ouvert, qui me vise, auquel je n'ai pas encore répondu */
export type QuestionnaireAFaire = { id: string; titre: string; description: string | null; questions: Question[] };

const CLE_LUS = "ep-messages-lus";
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Encadré « Nouveautés » en haut de l'accueil : nouveaux messages du fil Picard
 * depuis la dernière lecture, et questionnaires à remplir, ouverts dans une fenêtre.
 */
export function Nouveautes({ questionnaires, annonces, apercu = false }: { questionnaires: QuestionnaireAFaire[]; annonces: Annonce[]; apercu?: boolean }) {
  const [nonLus, setNonLus] = useState<Annonce[]>([]);
  const [ouvert, setOuvert] = useState<QuestionnaireAFaire | null>(null);

  useEffect(() => {
    let lus = Date.now() - 14 * 86400000;
    try {
      const v = window.localStorage.getItem(CLE_LUS);
      if (v) lus = Number(v);
    } catch {
      /* navigation privée : on garde les 14 derniers jours */
    }
    setNonLus(annonces.filter((a) => new Date(a.creeLe ?? a.debut).getTime() > lus));
  }, [annonces]);

  const marquerLus = () => {
    try {
      window.localStorage.setItem(CLE_LUS, String(Date.now()));
    } catch {
      /* rien à mémoriser */
    }
    setNonLus([]);
  };
  const lire = () => {
    document.getElementById("messages")?.scrollIntoView({ behavior: "smooth", block: "start" });
    marquerLus();
  };

  if (!nonLus.length && !questionnaires.length) return null;

  return (
    <section aria-label="Nouveautés pour vous" className={cn("grid gap-4", questionnaires.length + (nonLus.length ? 1 : 0) > 1 && "md:grid-cols-2")}>
      {questionnaires.map((q) => (
        <Encart
          key={q.id}
          picto={<Picto icon={ClipboardList} tone="cta" />}
          surtitre="Nouveau questionnaire"
          titre={q.titre}
          detail={`${pluriel(q.questions.length, "question")}, votre avis compte`}
          action={
            <Button variant="primary" onClick={() => setOuvert(q)} disabled={apercu}>
              Donner mon avis
            </Button>
          }
        />
      ))}
      {nonLus.length ? (
        <Encart
          picto={<Picto icon={MessageCircle} tone="success" />}
          surtitre={nonLus.length > 1 ? `${nonLus.length} nouveaux messages` : "Nouveau message"}
          titre={nonLus[0].titre}
          detail="Dans le fil Picard"
          action={
            <Button variant="secondary" onClick={lire}>
              Lire
            </Button>
          }
          onFermer={marquerLus}
        />
      ) : null}
      {ouvert ? <FenetreQuestionnaire q={ouvert} onFermer={() => setOuvert(null)} /> : null}
    </section>
  );
}

function Encart({ picto, surtitre, titre, detail, action, onFermer }: { picto: React.ReactNode; surtitre: string; titre: string; detail: string; action: React.ReactNode; onFermer?: () => void }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface px-6 py-4 shadow-card">
      <span className="shrink-0">{picto}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-cta-deep">{surtitre}</p>
        <p className="truncate font-semibold text-text">{titre}</p>
        <p className="truncate text-sm text-text-2">{detail}</p>
      </div>
      <span className="shrink-0">{action}</span>
      {onFermer ? (
        <button type="button" aria-label="Masquer" onClick={onFermer} className="shrink-0 rounded-md p-1 text-text-3 hover:bg-sunken hover:text-text">
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function FenetreQuestionnaire({ q, onFermer }: { q: QuestionnaireAFaire; onFermer: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [r, setR] = useState<Reponses>({});
  const [pending, start] = useTransition();
  const manquantes = questionsManquantes(q.questions, r);

  useEffect(() => {
    const touche = (ev: KeyboardEvent) => ev.key === "Escape" && onFermer();
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer]);

  const envoyer = () =>
    start(async () => {
      const res = await repondreQuestionnaire(q.id, r);
      toast(res.message);
      if (res.ok) {
        onFermer();
        router.refresh();
      }
    });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a33]/40 p-4" onMouseDown={onFermer}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={q.titre}
        onMouseDown={(ev) => ev.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-surface shadow-2xl"
      >
        <header className="flex items-start gap-4 border-b border-line px-6 py-5">
          <Picto icon={ClipboardList} tone="cta" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-text">{q.titre}</h2>
            {q.description ? <p className="mt-0.5 text-sm text-text-3">{q.description}</p> : null}
          </div>
          <button type="button" aria-label="Fermer" onClick={onFermer} className="rounded-md p-2 text-text-3 hover:bg-sunken hover:text-text">
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <ol className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
          {q.questions.map((x, i) => (
            <li key={x.id}>
              <p className="mb-3 font-semibold text-text">
                <span className="mr-2 text-text-3">{i + 1}.</span>
                {x.libelle}
                {x.obligatoire ? <span className="ml-1 text-cta-deep">*</span> : null}
              </p>
              <ChampReponse q={x} valeur={r[x.id]} onChange={(v) => setR((p) => ({ ...p, [x.id]: v }))} />
            </li>
          ))}
        </ol>
        <footer className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
          {manquantes.length ? <span className="text-sm text-text-3">{manquantes.length > 1 ? `${manquantes.length} questions obligatoires` : "1 question obligatoire"} sans réponse</span> : null}
          <Button variant="ghost" onClick={onFermer}>
            Plus tard
          </Button>
          <Button variant="primary" disabled={pending || manquantes.length > 0} onClick={envoyer}>
            Envoyer mes réponses
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
