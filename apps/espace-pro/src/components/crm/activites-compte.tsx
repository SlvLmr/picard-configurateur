"use client";

import { CalendarPlus, Flag, ListTodo, NotebookPen, X } from "lucide-react";
import { useState, useTransition } from "react";
import { annulerActivite, changerStatutPlan, creerAction, creerPlan, enregistrerCompteRendu, planifierActivite } from "@/app/(app)/crm/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { ActionCrm, ActiviteCrm, PlanCrm, TypeActivite } from "@/lib/data/crm";
import { LIBELLE_PLAN, LIBELLE_STATUT_PLAN, TYPES_ACTIVITE, TYPES_PLAN, formatJourCourt, formatJourHeure, typeActivite } from "./libelles-activites";
import { ListeActions } from "./liste-actions";

const zoneTexte =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 transition-colors focus:border-accent focus:outline-none";

type Formulaire = { type: "planifier" } | { type: "compte_rendu"; activite: ActiviteCrm | null } | null;

/**
 * Activités commerciales d'un compte : chronologie, comptes rendus, actions et plan d'action.
 * Toutes les écritures passent par des fonctions qui vérifient le portefeuille.
 */
export function ActivitesCompte({
  compteId,
  activites,
  actions,
  plans,
  peutEcrire,
}: {
  compteId: string;
  activites: ActiviteCrm[];
  actions: ActionCrm[];
  plans: PlanCrm[];
  peutEcrire: boolean;
}) {
  const [formulaire, setFormulaire] = useState<Formulaire>(null);
  const ouvertes = actions.filter((a) => a.statut === "a_faire");
  const terminees = actions.filter((a) => a.statut === "fait").slice(0, 5);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
      <Panel>
        <PanelHeader
          title="Activités"
          description="Visites, appels et comptes rendus"
          actions={
            peutEcrire ? (
              <>
                <Button size="sm" onClick={() => setFormulaire({ type: "compte_rendu", activite: null })}>
                  <NotebookPen aria-hidden />
                  Compte rendu
                </Button>
                <Button variant="primary" size="sm" onClick={() => setFormulaire({ type: "planifier" })}>
                  <CalendarPlus aria-hidden />
                  Planifier une visite
                </Button>
              </>
            ) : null
          }
        />
        {formulaire?.type === "planifier" ? <FormPlanifier compteId={compteId} onFermer={() => setFormulaire(null)} /> : null}
        {formulaire?.type === "compte_rendu" ? (
          <FormCompteRendu compteId={compteId} activite={formulaire.activite} onFermer={() => setFormulaire(null)} />
        ) : null}
        <Chronologie
          activites={activites}
          peutEcrire={peutEcrire}
          compteId={compteId}
          onCompteRendu={(a) => setFormulaire({ type: "compte_rendu", activite: a })}
        />
      </Panel>

      <div className="flex flex-col gap-8">
        <Panel>
          <PanelHeader title="Actions ouvertes" description={ouvertes.length ? `${ouvertes.length} à faire` : undefined} />
          <ListeActions actions={ouvertes} peutEcrire={peutEcrire} vide="Aucune action en cours sur ce compte." />
          {peutEcrire ? <FormAction compteId={compteId} /> : null}
          {terminees.length ? (
            <details className="border-t border-line">
              <summary className="cursor-pointer px-6 py-3 text-sm font-medium text-text-2 hover:text-text">
                {terminees.length} action{terminees.length > 1 ? "s" : ""} terminée{terminees.length > 1 ? "s" : ""} récemment
              </summary>
              <ListeActions actions={terminees} peutEcrire={peutEcrire} vide="" />
            </details>
          ) : null}
        </Panel>

        <PlanAction compteId={compteId} plans={plans} peutEcrire={peutEcrire} />
      </div>
    </div>
  );
}

/* ─────────────────────────── Chronologie ─────────────────────────── */
function Chronologie({
  activites,
  peutEcrire,
  compteId,
  onCompteRendu,
}: {
  activites: ActiviteCrm[];
  peutEcrire: boolean;
  compteId: string;
  onCompteRendu: (a: ActiviteCrm) => void;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [annulees, setAnnulees] = useState<string[]>([]);
  const visibles = activites.filter((a) => !annulees.includes(a.id));

  if (!visibles.length)
    return (
      <div className="flex gap-3 border-t border-line px-6 py-6">
        <Picto icon={CalendarPlus} tone="neutral" size="sm" />
        <p className="text-sm text-text-2">Aucune activité enregistrée. Planifiez une visite ou consignez un premier compte rendu.</p>
      </div>
    );

  return (
    <ol className="border-t border-line">
      {visibles.map((a) => {
        const t = typeActivite(a.type);
        const planifiee = a.statut === "planifiee";
        return (
          <li key={a.id} className="flex gap-4 border-t border-line px-6 py-4 first:border-t-0">
            <Picto icon={t.icone} tone={planifiee ? "cta" : "accent"} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-text">{a.objet}</span>
                {planifiee ? <Badge variant="warning">Planifiée</Badge> : null}
              </div>
              <p className="mt-0.5 text-xs text-text-3">
                {t.label}, {planifiee && a.datePrevue ? formatJourHeure(a.datePrevue) : a.dateRealisee ? formatJourCourt(a.dateRealisee) : ""}
              </p>
              {a.compteRendu ? <p className="mt-2 max-w-prose whitespace-pre-line text-sm text-text-2">{a.compteRendu}</p> : null}
              {a.prochainesEtapes ? (
                <p className="mt-2 text-sm text-text-2">
                  <span className="font-medium text-text">Prochaines étapes : </span>
                  {a.prochainesEtapes}
                </p>
              ) : null}
              {planifiee && peutEcrire ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onCompteRendu(a)}>
                    <NotebookPen aria-hidden />
                    Rédiger le compte rendu
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      startTransition(async () => {
                        const r = await annulerActivite(a.id, compteId);
                        if (r.ok) setAnnulees((x) => [...x, a.id]);
                        toast(r.message);
                      })
                    }
                  >
                    Annuler la visite
                  </Button>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────────────── Formulaires ─────────────────────────── */
function Cadre({ titre, onFermer, children }: { titre: string; onFermer: () => void; children: React.ReactNode }) {
  return (
    <div className="border-t border-line bg-sunken px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-text">{titre}</h3>
        <Button variant="ghost" size="sm" iconOnly onClick={onFermer} aria-label="Fermer le formulaire">
          <X />
        </Button>
      </div>
      {children}
    </div>
  );
}

function FormPlanifier({ compteId, onFermer }: { compteId: string; onFermer: () => void }) {
  const toast = useToast();
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <Cadre titre="Planifier une visite" onFermer={onFermer}>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const quand = String(f.get("quand") ?? "");
          if (!quand) return setErreur("Choisissez une date et une heure.");
          startTransition(async () => {
            const r = await planifierActivite(compteId, String(f.get("type")), new Date(quand).toISOString(), String(f.get("objet") ?? ""));
            if (r.ok) onFermer();
            else setErreur(r.message);
            toast(r.message);
          });
        }}
      >
        <Field label="Type" htmlFor="pl-type">
          <Select id="pl-type" name="type" defaultValue="visite">
            {TYPES_ACTIVITE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date et heure" htmlFor="pl-quand">
          <Input id="pl-quand" name="quand" type="datetime-local" required />
        </Field>
        <Field label="Objet" htmlFor="pl-objet" className="md:col-span-2" hint="Ce que vous voulez obtenir de ce rendez-vous">
          <Input id="pl-objet" name="objet" required placeholder="Point trimestriel, présentation de la gamme Altitude" />
        </Field>
        {erreur ? <p className="text-sm text-danger md:col-span-2">{erreur}</p> : null}
        <div className="md:col-span-2">
          <Button type="submit" variant="primary" disabled={enCours}>
            <CalendarPlus aria-hidden />
            Planifier
          </Button>
        </div>
      </form>
    </Cadre>
  );
}

function FormCompteRendu({ compteId, activite, onFermer }: { compteId: string; activite: ActiviteCrm | null; onFermer: () => void }) {
  const toast = useToast();
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [creerSuivi, setCreerSuivi] = useState(false);

  return (
    <Cadre titre={activite ? `Compte rendu : ${activite.objet}` : "Nouveau compte rendu"} onFermer={onFermer}>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const objet = String(f.get("objet") ?? "").trim();
          const echanges = String(f.get("echanges") ?? "").trim();
          const etapes = String(f.get("etapes") ?? "").trim();
          if (!echanges) return setErreur("Décrivez les échanges.");
          const compteRendu = [objet && `Objet : ${objet}.`, `Échanges : ${echanges}`, etapes && `Prochaines étapes : ${etapes}`].filter(Boolean).join("\n");
          startTransition(async () => {
            const r = await enregistrerCompteRendu({
              compteId,
              activiteId: activite?.id ?? null,
              type: (f.get("type") as TypeActivite) ?? activite?.type ?? "visite",
              objet: objet || activite?.objet || "Compte rendu",
              compteRendu,
              prochainesEtapes: etapes,
              actionDeSuivi: creerSuivi && etapes ? { titre: etapes, echeance: String(f.get("echeance") ?? "") || null } : null,
            });
            if (r.ok) onFermer();
            else setErreur(r.message);
            toast(r.message);
          });
        }}
      >
        {!activite ? (
          <Field label="Type" htmlFor="cr-type">
            <Select id="cr-type" name="type" defaultValue="visite">
              {TYPES_ACTIVITE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Objet" htmlFor="cr-objet" className={cn(activite && "md:col-span-2")}>
          <Input id="cr-objet" name="objet" defaultValue={activite?.objet ?? ""} placeholder="Point trimestriel" />
        </Field>
        <Field label="Échanges" htmlFor="cr-echanges" className="md:col-span-2" hint="Ce qui a été dit, les besoins exprimés, les points de vigilance">
          <textarea id="cr-echanges" name="echanges" rows={4} required className={zoneTexte} />
        </Field>
        <Field label="Prochaines étapes" htmlFor="cr-etapes" className="md:col-span-2">
          <textarea id="cr-etapes" name="etapes" rows={2} className={zoneTexte} placeholder="Envoyer le chiffrage sous huit jours" />
        </Field>
        <div className="flex flex-wrap items-end gap-4 md:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={creerSuivi} onChange={(e) => setCreerSuivi(e.target.checked)} className="size-4 accent-[color:var(--accent)]" />
            Créer une action de suivi avec les prochaines étapes
          </label>
          {creerSuivi ? (
            <Field label="Échéance" htmlFor="cr-echeance">
              <Input id="cr-echeance" name="echeance" type="date" />
            </Field>
          ) : null}
        </div>
        {erreur ? <p className="text-sm text-danger md:col-span-2">{erreur}</p> : null}
        <div className="md:col-span-2">
          <Button type="submit" variant="primary" disabled={enCours}>
            <NotebookPen aria-hidden />
            Enregistrer le compte rendu
          </Button>
        </div>
      </form>
    </Cadre>
  );
}

function FormAction({ compteId }: { compteId: string }) {
  const toast = useToast();
  const [enCours, startTransition] = useTransition();
  const [titre, setTitre] = useState("");
  const [echeance, setEcheance] = useState("");

  return (
    <form
      className="flex flex-wrap items-end gap-3 border-t border-line px-6 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!titre.trim()) return;
        startTransition(async () => {
          const r = await creerAction(compteId, titre, echeance || null);
          if (r.ok) {
            setTitre("");
            setEcheance("");
          }
          toast(r.message);
        });
      }}
    >
      <Field label="Nouvelle action" htmlFor="ac-titre" className="min-w-0 flex-1">
        <Input id="ac-titre" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Envoyer la notice de pose" />
      </Field>
      <Field label="Échéance" htmlFor="ac-echeance">
        <Input id="ac-echeance" type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
      </Field>
      <Button type="submit" disabled={enCours || !titre.trim()}>
        <ListTodo aria-hidden />
        Ajouter
      </Button>
    </form>
  );
}

/* ─────────────────────────── Plan d'action ─────────────────────────── */
function PlanAction({ compteId, plans, peutEcrire }: { compteId: string; plans: PlanCrm[]; peutEcrire: boolean }) {
  const toast = useToast();
  const [enCours, startTransition] = useTransition();
  const [ouvert, setOuvert] = useState(false);

  const changer = (p: PlanCrm, statut: string) =>
    startTransition(async () => {
      const r = await changerStatutPlan(p.id, statut, compteId);
      toast(r.message);
    });

  return (
    <Panel>
      <PanelHeader
        title="Plan d’action"
        description="Objectifs fixés avec le client"
        actions={
          peutEcrire && !ouvert ? (
            <Button size="sm" onClick={() => setOuvert(true)}>
              <Flag aria-hidden />
              Nouvel objectif
            </Button>
          ) : null
        }
      />
      {ouvert ? (
        <Cadre titre="Nouvel objectif" onFermer={() => setOuvert(false)}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              startTransition(async () => {
                const r = await creerPlan(compteId, String(f.get("objectif") ?? ""), String(f.get("type")), String(f.get("echeance") ?? "") || null);
                if (r.ok) setOuvert(false);
                toast(r.message);
              });
            }}
          >
            <Field label="Type d’objectif" htmlFor="pa-type">
              <Select id="pa-type" name="type" defaultValue="passage_niveau">
                {TYPES_PLAN.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Objectif" htmlFor="pa-objectif">
              <Input id="pa-objectif" name="objectif" required placeholder="Passer IAP Elite d’ici la fin du semestre" />
            </Field>
            <Field label="Échéance" htmlFor="pa-echeance">
              <Input id="pa-echeance" name="echeance" type="date" />
            </Field>
            <div>
              <Button type="submit" variant="primary" disabled={enCours}>
                Créer l’objectif
              </Button>
            </div>
          </form>
        </Cadre>
      ) : null}
      {plans.length ? (
        <ul>
          {plans.map((p) => (
            <li key={p.id} className="border-t border-line px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={p.statut === "atteint" ? "success" : p.statut === "abandonne" ? "neutral" : "accent"}>{LIBELLE_STATUT_PLAN[p.statut]}</Badge>
                <span className="text-xs text-text-3">
                  {LIBELLE_PLAN[p.type]}
                  {p.echeance ? `, échéance le ${formatJourCourt(p.echeance)}` : ""}
                </span>
              </div>
              <p className={cn("mt-2 text-sm font-medium", p.statut === "abandonne" ? "text-text-3 line-through" : "text-text")}>{p.objectif}</p>
              {peutEcrire && p.statut === "en_cours" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={enCours} onClick={() => changer(p, "atteint")}>
                    Objectif atteint
                  </Button>
                  <Button variant="ghost" size="sm" disabled={enCours} onClick={() => changer(p, "abandonne")}>
                    Abandonner
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !ouvert ? (
        <p className="border-t border-line px-6 py-6 text-sm text-text-2">Aucun objectif fixé pour ce compte.</p>
      ) : null}
    </Panel>
  );
}
