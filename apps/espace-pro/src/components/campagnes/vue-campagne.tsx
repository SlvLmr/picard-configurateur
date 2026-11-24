"use client";

import { AlarmClock, Check, CircleCheck, ShoppingCart, SlidersHorizontal, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { changerStatutCampagne, majActionCampagne, planifierRappel } from "@/app/(app)/campagnes/actions";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Cote } from "@/components/ui/cote";
import { Input } from "@/components/ui/field";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Avancement, Campagne, CibleCampagne, StatutAction } from "@/lib/data/campagnes";
import { dateCourte, dateLongue, euros, pourcentage, STATUTS_CAMPAGNE, TYPES_ETAPE } from "./libelles";

type Vue = "avancement" | "clients";
type Filtre = "a_traiter" | "en_retard" | "termines" | "tous";
type Tri = "avancement" | "clients" | "nom";

const PAGE = 30;
const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function VueCampagne({
  campagne: c,
  avancement: a,
  cibles: ciblesInitiales,
  gestion,
  peutAgir,
  atcInitial,
  vueInitiale,
}: {
  campagne: Campagne;
  avancement: Avancement | null;
  cibles: CibleCampagne[];
  gestion: boolean;
  peutAgir: boolean;
  atcInitial: string | null;
  vueInitiale: Vue;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [vue, setVue] = useState<Vue>(vueInitiale);
  const [cibles, setCibles] = useState(ciblesInitiales);
  const [filtre, setFiltre] = useState<Filtre>("a_traiter");
  const [q, setQ] = useState("");
  const [atc, setAtc] = useState<string>(atcInitial ?? "tous");
  const [limite, setLimite] = useState(PAGE);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [tri, setTri] = useState<Tri>("avancement");

  const active = c.statut === "active";
  const modifiable = peutAgir && active;
  const s = STATUTS_CAMPAGNE[c.statut];

  const restantes = (x: CibleCampagne) => c.etapes.filter((e) => (x.actions[e.code]?.statut ?? "a_faire") === "a_faire").length;
  const enRetard = (x: CibleCampagne) => (!!x.rappel && x.rappel < aujourdhui()) || (!!c.fin && c.fin < aujourdhui() && restantes(x) > 0);

  const visibles = useMemo(() => {
    const n = q.trim().toLowerCase();
    return cibles.filter((x) => {
      if (atc !== "tous" && x.commercialId !== atc) return false;
      if (n && !`${x.compteNom} ${x.ville ?? ""} ${x.departement ?? ""}`.toLowerCase().includes(n)) return false;
      const r = restantes(x);
      if (filtre === "a_traiter") return r > 0;
      if (filtre === "termines") return r === 0;
      if (filtre === "en_retard") return enRetard(x);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cibles, q, atc, filtre]);

  const majLocale = (cibleId: string, etape: string, statut: StatutAction, details?: { commentaire?: string; montant?: number | null }) =>
    setCibles((xs) =>
      xs.map((x) =>
        x.id !== cibleId
          ? x
          : {
              ...x,
              actions: {
                ...x.actions,
                [etape]: {
                  statut,
                  faitLe: statut === "a_faire" ? null : x.actions[etape]?.faitLe ?? new Date().toISOString(),
                  commentaire: details?.commentaire?.trim() || x.actions[etape]?.commentaire || null,
                  montant: details?.montant ?? x.actions[etape]?.montant ?? null,
                },
              },
            },
      ),
    );

  const agir = (cibleId: string, etape: string, statut: StatutAction, details?: { commentaire?: string; montant?: number | null }) => {
    const avant = cibles;
    majLocale(cibleId, etape, statut, details);
    start(async () => {
      const r = await majActionCampagne(c.id, cibleId, etape, statut, details);
      if (!r.ok) {
        setCibles(avant);
        toast(r.message);
      }
    });
  };

  const rappel = (cibleId: string, date: string | null) => {
    setCibles((xs) => xs.map((x) => (x.id === cibleId ? { ...x, rappel: date } : x)));
    start(async () => {
      const r = await planifierRappel(c.id, cibleId, date);
      toast(r.message);
    });
  };

  const optionsAtc = useMemo(() => {
    const m = new Map<string, { nom: string; zone: string | null; n: number }>();
    for (const x of cibles) {
      if (!x.commercialId) continue;
      const e = m.get(x.commercialId) ?? { nom: x.commercialNom ?? "Commercial", zone: x.zone, n: 0 };
      e.n += 1;
      m.set(x.commercialId, e);
    }
    return [
      { value: "tous", label: "Tous les commerciaux" },
      ...Array.from(m.entries())
        .sort((p, q2) => p[1].nom.localeCompare(q2[1].nom, "fr"))
        .map(([id, v]) => ({ value: id, label: v.nom, detail: `${v.zone ?? "Sans zone"}, ${v.n} client${v.n > 1 ? "s" : ""}`, groupe: v.zone ?? "Sans zone" })),
    ];
  }, [cibles]);

  const parAtc = useMemo(() => {
    const l = [...(a?.par_atc ?? [])];
    const pct = (x: (typeof l)[number]) => pourcentage(x.faites + x.sans_objet, x.actions);
    if (tri === "avancement") l.sort((p, q2) => pct(q2) - pct(p));
    if (tri === "clients") l.sort((p, q2) => q2.clients - p.clients);
    if (tri === "nom") l.sort((p, q2) => p.nom.localeCompare(q2.nom, "fr"));
    return l;
  }, [a, tri]);

  const voirClientsDe = (id: string | null) => {
    setAtc(id ?? "tous");
    setFiltre("tous");
    setVue("clients");
    setLimite(PAGE);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const traitees = (a?.faites ?? 0) + (a?.sans_objet ?? 0);

  return (
    <>
      <PageHeader
        title={c.titre}
        meta={
          <span className="flex flex-wrap gap-2">
            <Badge variant={s.variant}>{s.label}</Badge>
            {c.demo ? <Badge variant="warning">Démonstration</Badge> : null}
          </span>
        }
        description={`${c.objectif ? `${c.objectif}. ` : ""}${c.fin ? `Du ${dateLongue(c.debut)} au ${dateLongue(c.fin)}.` : `Depuis le ${dateLongue(c.debut)}.`}`}
        actions={
          gestion ? (
            <>
              <Link href="/campagnes" className="text-sm font-medium text-accent hover:underline">
                Toutes les campagnes
              </Link>
              {c.statut === "active" ? (
                <Button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await changerStatutCampagne(c.id, "terminee");
                      toast(r.message);
                    })
                  }
                >
                  Terminer la campagne
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await changerStatutCampagne(c.id, "active");
                      toast(r.message);
                    })
                  }
                >
                  Activer la campagne
                </Button>
              )}
            </>
          ) : (
            <Link href="/campagnes" className="text-sm font-medium text-accent hover:underline">
              Toutes les campagnes
            </Link>
          )
        }
      />

      {a ? (
        <KpiBand
          items={[
            { label: gestion ? "Clients ciblés" : "Mes clients", value: a.clients, icon: Users, note: `${a.clients_termines} terminé${a.clients_termines > 1 ? "s" : ""}` },
            { label: "Avancement", value: pourcentage(traitees, a.actions), unit: "%", icon: CircleCheck, tone: "success", note: `${traitees} actions traitées sur ${a.actions}` },
            { label: "Commandes", value: euros(a.montant), icon: ShoppingCart, tone: "cta" },
            {
              label: "Rappels dépassés",
              value: a.rappels_depasses,
              icon: AlarmClock,
              tone: a.rappels_depasses ? "danger" : "neutral",
              href: `/campagnes/${c.id}?vue=clients`,
            },
          ]}
        />
      ) : null}

      {!active ? (
        <p className="mt-6 rounded-md bg-sunken px-4 py-3 text-sm text-text-2">
          {c.statut === "terminee" ? "Cette campagne est terminée : les étapes ne sont plus modifiables." : "Cette campagne est un brouillon : activez-la pour que les commerciaux puissent avancer."}
        </p>
      ) : null}

      {gestion ? (
        <div className="mt-8 overflow-x-auto">
          <Segmented
            label="Affichage"
            value={vue}
            onChange={setVue}
            options={[
              { value: "avancement", label: "Avancement par commercial" },
              { value: "clients", label: "Clients", count: cibles.length },
            ]}
          />
        </div>
      ) : null}

      {vue === "avancement" && a ? (
        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              title="Par commercial"
              description="Cliquez sur un commercial pour voir ses clients"
              actions={
                <Segmented
                  size="sm"
                  label="Trier par"
                  value={tri}
                  onChange={setTri}
                  options={[
                    { value: "avancement", label: "Avancement" },
                    { value: "clients", label: "Clients" },
                    { value: "nom", label: "Nom" },
                  ]}
                />
              }
            />
            {parAtc.length === 0 ? (
              <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun client ciblé.</p>
            ) : (
              <ul>
                {parAtc.map((l) => {
                  const pct = pourcentage(l.faites + l.sans_objet, l.actions);
                  return (
                    <li key={l.commercial_id ?? "aucun"} className="border-t border-line">
                      <button
                        type="button"
                        onClick={() => voirClientsDe(l.commercial_id)}
                        className="grid w-full gap-4 px-6 py-4 text-left transition-colors hover:bg-sunken md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] md:items-center"
                      >
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-text">{l.nom}</span>
                            <Badge>{l.zone}</Badge>
                          </span>
                          <span className="mt-0.5 block text-sm text-text-2">
                            {l.clients} client{l.clients > 1 ? "s" : ""}, {l.clients_termines} terminé{l.clients_termines > 1 ? "s" : ""}
                            {l.montant ? `, ${euros(l.montant)} de commandes` : ""}
                          </span>
                          <span className="mt-0.5 block text-xs text-text-3">
                            {l.derniere_action ? `Dernière action le ${dateCourte(l.derniere_action)}` : "Aucune action pour l’instant"}
                          </span>
                        </span>
                        <Cote
                          label={`Avancement de ${l.nom}`}
                          value={l.faites + l.sans_objet}
                          max={Math.max(l.actions, 1)}
                          tone={pct >= 80 ? "success" : pct < 30 ? "warning" : "accent"}
                          valueLabel={`${pct} %`}
                          startLabel={`${l.faites + l.sans_objet} traitées`}
                          endLabel={`${l.actions}`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div className="flex flex-col gap-8">
            <Panel>
              <PanelHeader title="Par étape" />
              <PanelBody className="flex flex-col gap-6">
                {a.par_etape.map((e) => {
                  const t = TYPES_ETAPE[e.type];
                  const pct = pourcentage(e.faites, e.total);
                  return (
                    <div key={e.code} className="flex gap-3">
                      <Picto icon={t.icon} tone={e.type === "commande" ? "cta" : "accent"} size="sm" />
                      <Cote
                        className="min-w-0 flex-1"
                        label={`Étape ${e.libelle}`}
                        value={e.faites}
                        max={Math.max(e.total, 1)}
                        tone={pct >= 80 ? "success" : "accent"}
                        valueLabel={`${pct} %`}
                        startLabel={<span className="text-sm font-medium text-text">{e.libelle}</span>}
                        endLabel={`${e.faites} sur ${e.total}`}
                      />
                    </div>
                  );
                })}
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader title="Par zone" />
              <ul>
                {a.par_zone.map((z) => {
                  const pct = pourcentage(z.faites + z.sans_objet, z.actions);
                  return (
                    <li key={z.zone} className="border-t border-line px-6 py-4">
                      <Cote
                        label={`Zone ${z.zone}`}
                        value={z.faites + z.sans_objet}
                        max={Math.max(z.actions, 1)}
                        tone={pct >= 80 ? "success" : pct < 30 ? "warning" : "accent"}
                        valueLabel={`${pct} %`}
                        startLabel={<span className="text-sm font-medium text-text">{z.zone}</span>}
                        endLabel={`${z.commerciaux} commercia${z.commerciaux > 1 ? "ux" : "l"}, ${z.clients} clients`}
                      />
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </div>
      ) : null}

      {vue === "clients" ? (
        <Panel className="mt-6">
          <PanelHeader
            title={gestion && atc !== "tous" ? `Clients de ${optionsAtc.find((o) => o.value === atc)?.label ?? "ce commercial"}` : gestion ? "Clients ciblés" : "Mes clients"}
            description={modifiable ? "Touchez une étape pour la marquer comme faite. « Détails » pour un commentaire, un montant ou un rappel." : undefined}
          />
          <div className="flex flex-col gap-3 px-6 pb-4 lg:flex-row lg:items-center">
            <div className="overflow-x-auto">
              <Segmented
                label="Filtrer les clients"
                value={filtre}
                onChange={(v) => {
                  setFiltre(v);
                  setLimite(PAGE);
                }}
                options={[
                  { value: "a_traiter", label: "À traiter" },
                  { value: "en_retard", label: "En retard" },
                  { value: "termines", label: "Terminés" },
                  { value: "tous", label: "Tous" },
                ]}
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <Input
                aria-label="Rechercher un client"
                placeholder="Rechercher un client, une ville"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setLimite(PAGE);
                }}
                className="sm:flex-1"
              />
              {gestion ? (
                <Combobox
                  label="Commercial"
                  className="sm:w-64"
                  options={optionsAtc}
                  value={atc}
                  onChange={(v) => {
                    setAtc(v);
                    setLimite(PAGE);
                  }}
                />
              ) : null}
            </div>
          </div>
          <p className="border-t border-line px-6 py-3 text-xs text-text-3">
            {visibles.length} client{visibles.length > 1 ? "s" : ""} affiché{visibles.length > 1 ? "s" : ""}
          </p>
          {visibles.length === 0 ? (
            <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun client dans cette vue.</p>
          ) : (
            <ul>
              {visibles.slice(0, limite).map((x) => (
                <LigneClient
                  key={x.id}
                  cible={x}
                  campagne={c}
                  gestion={gestion}
                  modifiable={modifiable}
                  retard={enRetard(x)}
                  ouvert={ouvert === x.id}
                  basculer={() => setOuvert(ouvert === x.id ? null : x.id)}
                  agir={agir}
                  rappel={rappel}
                />
              ))}
            </ul>
          )}
          {visibles.length > limite ? (
            <div className="border-t border-line px-6 py-4">
              <Button onClick={() => setLimite((l) => l + PAGE)}>Afficher {Math.min(PAGE, visibles.length - limite)} clients de plus</Button>
            </div>
          ) : null}
        </Panel>
      ) : null}
    </>
  );
}

function LigneClient({
  cible: x,
  campagne: c,
  gestion,
  modifiable,
  retard,
  ouvert,
  basculer,
  agir,
  rappel,
}: {
  cible: CibleCampagne;
  campagne: Campagne;
  gestion: boolean;
  modifiable: boolean;
  retard: boolean;
  ouvert: boolean;
  basculer: () => void;
  agir: (cibleId: string, etape: string, statut: StatutAction, details?: { commentaire?: string; montant?: number | null }) => void;
  rappel: (cibleId: string, date: string | null) => void;
}) {
  const faites = c.etapes.filter((e) => (x.actions[e.code]?.statut ?? "a_faire") !== "a_faire").length;
  return (
    <li className="border-t border-line px-6 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
        <div className="min-w-0 lg:w-64 lg:shrink-0">
          <Link href={`/crm/${x.compteId}`} className="font-semibold text-text hover:text-accent">
            {x.compteNom}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {x.niveau ? <NiveauBadge type={x.niveau} /> : null}
            <span className="text-sm text-text-3">
              {x.ville ?? ""}
              {x.departement ? ` (${x.departement})` : ""}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-3">
            {gestion && x.commercialNom ? `${x.commercialNom}, ` : ""}
            {faites} sur {c.etapes.length} étapes
            {x.rappel ? (
              <span className={cn("ml-1 font-medium", retard ? "text-danger" : "text-text-2")}>
                , rappel le {dateCourte(x.rappel)}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {c.etapes.map((e) => {
            const etat = x.actions[e.code]?.statut ?? "a_faire";
            const Icone = TYPES_ETAPE[e.type].icon;
            return (
              <button
                key={e.code}
                type="button"
                disabled={!modifiable}
                aria-pressed={etat === "fait"}
                title={x.actions[e.code]?.commentaire ?? undefined}
                onClick={() => agir(x.id, e.code, etat === "a_faire" ? "fait" : "a_faire")}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-default sm:h-8",
                  etat === "fait" && "border-transparent bg-success-soft text-success",
                  etat === "sans_objet" && "border-line bg-sunken text-text-3 line-through",
                  etat === "a_faire" && "border-line-strong bg-surface text-text enabled:hover:border-accent enabled:hover:text-accent",
                )}
              >
                {etat === "fait" ? <Check aria-hidden className="size-4" /> : <Icone aria-hidden className="size-4" />}
                {e.libelle}
                {e.type === "commande" && x.actions[e.code]?.montant ? <span className="tabular text-xs">{euros(x.actions[e.code]!.montant!)}</span> : null}
              </button>
            );
          })}
          {modifiable ? (
            <Button size="sm" variant="ghost" onClick={basculer} aria-expanded={ouvert} className="h-10 sm:h-8">
              <SlidersHorizontal aria-hidden />
              Détails
            </Button>
          ) : null}
        </div>
      </div>

      {ouvert && modifiable ? <EditeurClient cible={x} campagne={c} agir={agir} rappel={rappel} /> : null}
    </li>
  );
}

function EditeurClient({
  cible: x,
  campagne: c,
  agir,
  rappel,
}: {
  cible: CibleCampagne;
  campagne: Campagne;
  agir: (cibleId: string, etape: string, statut: StatutAction, details?: { commentaire?: string; montant?: number | null }) => void;
  rappel: (cibleId: string, date: string | null) => void;
}) {
  const [etape, setEtape] = useState(c.etapes[0]?.code ?? "");
  const courante = c.etapes.find((e) => e.code === etape);
  const action = x.actions[etape];
  const [statut, setStatut] = useState<StatutAction>(action?.statut ?? "a_faire");
  const [commentaire, setCommentaire] = useState(action?.commentaire ?? "");
  const [montant, setMontant] = useState(action?.montant ? String(action.montant) : "");
  const [dateRappel, setDateRappel] = useState(x.rappel ?? "");

  const choisirEtape = (code: string) => {
    setEtape(code);
    const a = x.actions[code];
    setStatut(a?.statut ?? "a_faire");
    setCommentaire(a?.commentaire ?? "");
    setMontant(a?.montant ? String(a.montant) : "");
  };

  return (
    <div className="mt-4 grid gap-4 rounded-lg border border-line bg-sunken p-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Étape</span>
        <Combobox label="Étape" options={c.etapes.map((e) => ({ value: e.code, label: e.libelle, detail: TYPES_ETAPE[e.type].aide }))} value={etape} onChange={choisirEtape} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Statut</span>
        <Segmented
          label="Statut de l’étape"
          value={statut}
          onChange={setStatut}
          options={[
            { value: "a_faire", label: "À faire" },
            { value: "fait", label: "Fait" },
            { value: "sans_objet", label: "Sans objet" },
          ]}
        />
      </div>
      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium text-text">Commentaire</span>
        <Input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Ce qui a été dit, la suite à donner" />
      </label>
      {courante?.type === "commande" ? (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Montant de la commande (€ HT)</span>
          <Input type="number" inputMode="decimal" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} />
        </label>
      ) : null}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Rappel</span>
        <Input type="date" value={dateRappel} onChange={(e) => setDateRappel(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button
          variant="primary"
          onClick={() => agir(x.id, etape, statut, { commentaire, montant: montant ? Number(montant) : null })}
        >
          <Check aria-hidden />
          Enregistrer l’étape
        </Button>
        <Button onClick={() => rappel(x.id, dateRappel || null)}>
          <AlarmClock aria-hidden />
          {dateRappel ? "Planifier le rappel" : "Supprimer le rappel"}
        </Button>
      </div>
    </div>
  );
}
