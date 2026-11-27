"use client";

import { ArrowDown, ArrowUp, BarChart3, ClipboardList, Lock, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { changerStatutQuestionnaire, enregistrerQuestionnaire, repondreQuestionnaire, supprimerQuestionnaire } from "@/app/(app)/questionnaires/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { CIBLES, type Cible } from "@/lib/cibles";
import { cn } from "@/lib/cn";
import type { Questionnaire, ReponseQuestionnaire } from "@/lib/data/questionnaires";
import { TYPES_QUESTION, scoreNps, type Question, type Reponses, type TypeQuestion } from "@/lib/questionnaires";
import { ChampReponse, questionsManquantes, zoneTexte } from "./champ-reponse";

type Vue = { type: "liste" } | { type: "remplir"; q: Questionnaire } | { type: "editer"; q: Questionnaire | null } | { type: "resultats"; q: Questionnaire };
const STATUT = { brouillon: { label: "Brouillon", variant: "neutral" }, ouvert: { label: "Ouvert", variant: "success" }, clos: { label: "Clos", variant: "accent" } } as const;
const nouvelleQuestion = (type: TypeQuestion = "note"): Question => ({ id: Math.random().toString(36).slice(2, 10), type, libelle: "", options: type === "choix" || type === "choix_multiple" ? ["Option 1", "Option 2"] : [], obligatoire: true });

/** Questionnaires : chacun répond à ceux qui le visent ; l'administrateur crée et suit les résultats. */
export function PageQuestionnaires({ questionnaires, reponses, profilId, admin, interne }: { questionnaires: Questionnaire[]; reponses: ReponseQuestionnaire[]; profilId: string; admin: boolean; interne: boolean }) {
  const [vue, setVue] = useState<Vue>({ type: "liste" });
  const toast = useToast();
  const [pending, start] = useTransition();
  const mienne = (id: string) => reponses.find((r) => r.questionnaireId === id && r.profilId === profilId);
  const nbReponses = (id: string) => reponses.filter((r) => r.questionnaireId === id).length;
  const retour = () => setVue({ type: "liste" });

  if (vue.type === "remplir") return <Remplir q={vue.q} existante={mienne(vue.q.id)?.reponses} onFermer={retour} />;
  if (vue.type === "editer") return <Editeur q={vue.q} verrouille={vue.q ? nbReponses(vue.q.id) > 0 : false} onFermer={retour} />;
  if (vue.type === "resultats") return <Resultats q={vue.q} reponses={reponses.filter((r) => r.questionnaireId === vue.q.id)} onFermer={retour} />;

  const statut = (q: Questionnaire, s: "brouillon" | "ouvert" | "clos") =>
    start(async () => {
      const r = await changerStatutQuestionnaire(q.id, s);
      toast(r.message);
    });

  // Ce que je dois remplir (pour tous), puis la gestion (équipes internes)
  const aRemplir = questionnaires.filter((q) => q.statut === "ouvert" && !mienne(q.id) && !interne);
  const repondus = questionnaires.filter((q) => mienne(q.id));

  return (
    <>
      <PageHeader
        title="Questionnaires"
        description={interne ? "Créez des questionnaires pour le réseau, diffusez-les au public choisi et exploitez les réponses." : "Donnez votre avis à Picard Serrures : quelques minutes suffisent."}
        actions={
          admin ? (
            <Button variant="primary" onClick={() => setVue({ type: "editer", q: null })}>
              <Plus aria-hidden />
              Nouveau questionnaire
            </Button>
          ) : null
        }
      />

      {!interne ? (
        <>
          {aRemplir.length ? (
            <ul className="mb-8 grid gap-4 sm:grid-cols-2">
              {aRemplir.map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => setVue({ type: "remplir", q })} className="flex h-full w-full flex-col gap-2 rounded-lg border border-cta/50 bg-surface p-6 text-left shadow-card transition-transform hover:-translate-y-0.5">
                    <span className="flex items-center gap-2 text-xs font-semibold text-cta-deep">
                      <ClipboardList aria-hidden className="size-4" />À remplir
                    </span>
                    <span className="font-display text-lg font-semibold text-text">{q.titre}</span>
                    {q.description ? <span className="line-clamp-2 text-sm text-text-2">{q.description}</span> : null}
                    <span className="mt-auto pt-2 text-xs text-text-3">{q.questions.length} question{q.questions.length > 1 ? "s" : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-8 rounded-lg border border-dashed border-line-strong px-6 py-10 text-center text-sm text-text-2">Aucun questionnaire à remplir pour le moment. Merci pour vos réponses.</p>
          )}
          {repondus.length ? (
            <Panel>
              <PanelHeader title="Déjà répondu" description="Vous pouvez modifier vos réponses tant que le questionnaire est ouvert." />
              <ul className="divide-y divide-line border-t border-line">
                {repondus.map((q) => (
                  <li key={q.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{q.titre}</span>
                    <Badge variant={STATUT[q.statut].variant}>{STATUT[q.statut].label}</Badge>
                    {q.statut === "ouvert" ? (
                      <Button variant="ghost" size="sm" onClick={() => setVue({ type: "remplir", q })}>
                        Modifier
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </>
      ) : questionnaires.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {questionnaires.map((q) => (
            <li key={q.id} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6 shadow-card">
              <span className="flex items-center justify-between gap-2">
                <Badge variant={STATUT[q.statut].variant}>{STATUT[q.statut].label}</Badge>
                <span className="tabular text-sm text-text-3">
                  {nbReponses(q.id)} réponse{nbReponses(q.id) > 1 ? "s" : ""}
                </span>
              </span>
              <span className="font-display text-lg font-semibold leading-tight text-text">{q.titre}</span>
              <span className="text-xs text-text-3">
                {q.questions.length} question{q.questions.length > 1 ? "s" : ""}, {CIBLES[q.cible as Cible]?.label ?? q.cible}
              </span>
              <span className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setVue({ type: "resultats", q })}>
                  <BarChart3 aria-hidden />
                  Résultats
                </Button>
                {admin ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setVue({ type: "editer", q })}>
                      <Pencil aria-hidden />
                      Modifier
                    </Button>
                    {q.statut !== "ouvert" ? (
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => statut(q, "ouvert")}>
                        <Play aria-hidden />
                        Ouvrir
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => statut(q, "clos")}>
                        <Lock aria-hidden />
                        Clore
                      </Button>
                    )}
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center text-sm text-text-2">Aucun questionnaire pour l’instant.</p>
      )}
    </>
  );
}

/* ───────── Remplir ───────── */
function Remplir({ q, existante, onFermer }: { q: Questionnaire; existante?: Reponses; onFermer: () => void }) {
  const toast = useToast();
  const [r, setR] = useState<Reponses>(existante ?? {});
  const [pending, start] = useTransition();
  const manquantes = questionsManquantes(q.questions, r);
  const envoyer = () =>
    start(async () => {
      const res = await repondreQuestionnaire(q.id, r);
      toast(res.message);
      if (res.ok) onFermer();
    });
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader editable={false} title={q.titre} description={q.description ?? undefined} actions={<Button variant="ghost" onClick={onFermer}>Retour</Button>} />
      <ol className="flex flex-col gap-4">
        {q.questions.map((x, i) => (
          <li key={x.id} className="rounded-lg border border-line bg-surface p-6 shadow-card">
            <p className="mb-4 font-semibold text-text">
              <span className="mr-2 text-text-3">{i + 1}.</span>
              {x.libelle}
              {x.obligatoire ? <span className="ml-1 text-cta-deep">*</span> : null}
            </p>
            <ChampReponse q={x} valeur={r[x.id]} onChange={(v) => setR((p) => ({ ...p, [x.id]: v }))} />
          </li>
        ))}
      </ol>
      <div className="mt-6 flex items-center justify-end gap-3">
        {manquantes.length ? <span className="text-sm text-text-3">{manquantes.length} question{manquantes.length > 1 ? "s" : ""} obligatoire{manquantes.length > 1 ? "s" : ""} sans réponse</span> : null}
        <Button variant="primary" size="lg" disabled={pending || manquantes.length > 0} onClick={envoyer}>
          Envoyer mes réponses
        </Button>
      </div>
    </div>
  );
}

/* ───────── Éditeur ───────── */
function Editeur({ q, verrouille, onFermer }: { q: Questionnaire | null; verrouille: boolean; onFermer: () => void }) {
  const toast = useToast();
  const [titre, setTitre] = useState(q?.titre ?? "");
  const [description, setDescription] = useState(q?.description ?? "");
  const [cible, setCible] = useState<Cible>((q?.cible as Cible) ?? "clients");
  const [questions, setQuestions] = useState<Question[]>(q?.questions.length ? q.questions : [nouvelleQuestion("nps")]);
  const [pending, start] = useTransition();
  const maj = (i: number, x: Partial<Question>) => setQuestions((l) => l.map((y, k) => (k === i ? { ...y, ...x } : y)));
  const deplacer = (i: number, s: -1 | 1) =>
    setQuestions((l) => {
      const c = [...l];
      const j = i + s;
      if (j < 0 || j >= c.length) return l;
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const enregistrer = () =>
    start(async () => {
      const r = await enregistrerQuestionnaire({ id: q?.id ?? null, titre, description, questions: questions.filter((x) => x.libelle.trim()), cible });
      toast(r.message);
      if (r.ok) onFermer();
    });
  return (
    <>
      <PageHeader
        editable={false}
        title={q ? "Modifier le questionnaire" : "Nouveau questionnaire"}
        description={verrouille ? "Des réponses ont déjà été reçues : seuls le titre et la description sont modifiables." : "Ajoutez vos questions puis ouvrez le questionnaire depuis la liste."}
        actions={
          <>
            <Button variant="ghost" onClick={onFermer}>
              Retour
            </Button>
            {q && q.statut === "brouillon" ? (
              <Button
                variant="ghost"
                onClick={() =>
                  window.confirm("Supprimer ce brouillon ?") &&
                  start(async () => {
                    const r = await supprimerQuestionnaire(q.id);
                    toast(r.message);
                    if (r.ok) onFermer();
                  })
                }
              >
                <Trash2 aria-hidden />
                Supprimer
              </Button>
            ) : null}
            <Button variant="primary" disabled={pending || !titre.trim()} onClick={enregistrer}>
              Enregistrer
            </Button>
          </>
        }
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Panel>
          <PanelBody className="flex flex-col gap-4 pt-6">
            <Field label="Titre" htmlFor="q-titre">
              <Input id="q-titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Votre avis sur la nouvelle gamme" />
            </Field>
            <Field label="Introduction" htmlFor="q-desc" hint="Facultatif">
              <textarea id="q-desc" className={zoneTexte} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field label="Public" htmlFor="q-cible">
              <Combobox id="q-cible" disabled={verrouille} options={(Object.keys(CIBLES) as Cible[]).map((k) => ({ value: k, label: CIBLES[k].label }))} value={cible} onChange={(v) => setCible(v as Cible)} />
            </Field>
          </PanelBody>
        </Panel>
        {questions.map((x, i) => (
          <Panel key={x.id}>
            <PanelBody className="flex flex-col gap-3 pt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-3">Question {i + 1}</span>
                {!verrouille ? (
                  <span className="ml-auto flex gap-1">
                    <Button variant="ghost" size="sm" iconOnly aria-label="Monter" onClick={() => deplacer(i, -1)}>
                      <ArrowUp />
                    </Button>
                    <Button variant="ghost" size="sm" iconOnly aria-label="Descendre" onClick={() => deplacer(i, 1)}>
                      <ArrowDown />
                    </Button>
                    <Button variant="ghost" size="sm" iconOnly aria-label="Retirer" onClick={() => setQuestions((l) => l.filter((_, k) => k !== i))}>
                      <Trash2 />
                    </Button>
                  </span>
                ) : null}
              </div>
              <Input aria-label="Intitulé de la question" disabled={verrouille} value={x.libelle} onChange={(e) => maj(i, { libelle: e.target.value })} placeholder="Recommanderiez-vous Picard Serrures à un confrère ?" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Combobox
                  id={`q-type-${x.id}`}
                  disabled={verrouille}
                  options={(Object.keys(TYPES_QUESTION) as TypeQuestion[]).map((t) => ({ value: t, label: TYPES_QUESTION[t].label, detail: TYPES_QUESTION[t].aide }))}
                  value={x.type}
                  onChange={(v) => maj(i, { type: v as TypeQuestion, options: v === "choix" || v === "choix_multiple" ? (x.options.length ? x.options : ["Option 1", "Option 2"]) : [] })}
                />
                <label className="flex items-center gap-2 text-sm text-text-2">
                  <input type="checkbox" disabled={verrouille} checked={x.obligatoire} onChange={(e) => maj(i, { obligatoire: e.target.checked })} />
                  Réponse obligatoire
                </label>
              </div>
              {x.type === "choix" || x.type === "choix_multiple" ? (
                <Field label="Options, une par ligne" htmlFor={`q-opt-${x.id}`}>
                  <textarea id={`q-opt-${x.id}`} disabled={verrouille} className={zoneTexte} value={x.options.join("\n")} onChange={(e) => maj(i, { options: e.target.value.split("\n") })} onBlur={() => maj(i, { options: x.options.map((o) => o.trim()).filter(Boolean) })} />
                </Field>
              ) : null}
            </PanelBody>
          </Panel>
        ))}
        {!verrouille ? (
          <Button variant="secondary" className="self-start" onClick={() => setQuestions((l) => [...l, nouvelleQuestion()])}>
            <Plus aria-hidden />
            Ajouter une question
          </Button>
        ) : null}
      </div>
    </>
  );
}

/* ───────── Résultats ───────── */
function Barre({ label, n, total }: { label: string; n: number; total: number }) {
  const part = total ? n / total : 0;
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-text-2">{label}</span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-sunken">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${part * 100}%` }} />
      </span>
      <span className="tabular w-20 shrink-0 text-right text-text-3">
        {n} ({Math.round(part * 100)} %)
      </span>
    </li>
  );
}

function Resultats({ q, reponses, onFermer }: { q: Questionnaire; reponses: ReponseQuestionnaire[]; onFermer: () => void }) {
  return (
    <>
      <PageHeader
        editable={false}
        title={q.titre}
        description={`${reponses.length} réponse${reponses.length > 1 ? "s" : ""}, ${STATUT[q.statut].label.toLowerCase()}`}
        actions={
          <Button variant="ghost" onClick={onFermer}>
            Retour
          </Button>
        }
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {q.questions.map((x, i) => {
          const valeurs = reponses.map((r) => r.reponses[x.id]).filter((v) => v !== undefined && v !== "");
          return (
            <Panel key={x.id}>
              <PanelHeader title={`${i + 1}. ${x.libelle}`} description={`${valeurs.length} réponse${valeurs.length > 1 ? "s" : ""}, ${TYPES_QUESTION[x.type].label.toLowerCase()}`} />
              <PanelBody>
                {!valeurs.length ? (
                  <p className="text-sm text-text-3">Pas encore de réponse.</p>
                ) : x.type === "note" ? (
                  (() => {
                    const notes = valeurs as number[];
                    const moyenne = notes.reduce((s, n) => s + n, 0) / notes.length;
                    return (
                      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                        <p className="font-display text-3xl font-bold text-text">
                          {moyenne.toFixed(1).replace(".", ",")}
                          <span className="text-base font-normal text-text-3"> sur 5</span>
                        </p>
                        <ul className="flex flex-col gap-2">
                          {[5, 4, 3, 2, 1].map((n) => (
                            <Barre key={n} label={`${n} étoile${n > 1 ? "s" : ""}`} n={notes.filter((v) => v === n).length} total={notes.length} />
                          ))}
                        </ul>
                      </div>
                    );
                  })()
                ) : x.type === "nps" ? (
                  (() => {
                    const notes = valeurs as number[];
                    const s = scoreNps(notes) ?? 0;
                    return (
                      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                        <div>
                          <p className={cn("font-display text-3xl font-bold", s >= 30 ? "text-success" : s >= 0 ? "text-text" : "text-danger")}>{s > 0 ? `+${s}` : s}</p>
                          <p className="text-xs text-text-3">Score de recommandation</p>
                        </div>
                        <ul className="flex flex-col gap-2">
                          <Barre label="Promoteurs (9-10)" n={notes.filter((v) => v >= 9).length} total={notes.length} />
                          <Barre label="Passifs (7-8)" n={notes.filter((v) => v === 7 || v === 8).length} total={notes.length} />
                          <Barre label="Détracteurs (0-6)" n={notes.filter((v) => v <= 6).length} total={notes.length} />
                        </ul>
                      </div>
                    );
                  })()
                ) : x.type === "choix" || x.type === "choix_multiple" ? (
                  <ul className="flex flex-col gap-2">
                    {x.options.map((o) => (
                      <Barre key={o} label={o} n={valeurs.filter((v) => (Array.isArray(v) ? v.includes(o) : v === o)).length} total={reponses.length} />
                    ))}
                  </ul>
                ) : (
                  <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                    {(valeurs as string[]).map((t, k) => (
                      <li key={k} className="rounded-md bg-sunken px-3 py-2 text-sm text-text">
                        « {t} »
                      </li>
                    ))}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
