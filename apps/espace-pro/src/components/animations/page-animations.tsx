"use client";

import { Banknote, Check, Copy, Gift, Megaphone, Pencil, Plus, Send, Users, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { enregistrerAnimation, inviterFilleul, participer, traiterParrainage, traiterParticipation, type FormAnimation } from "@/app/(app)/animations/actions";
import { PanneauEdition } from "@/components/administration/panneau-edition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Animation, Parrainage, Participation, StatutParticipation, TypeAnimation } from "@/lib/data/animations";

const TYPES: Record<TypeAnimation, { label: string; pluriel: string; couleur: string; icone: LucideIcon; cta: string }> = {
  offre: { label: "Offre", pluriel: "Offres", couleur: "var(--cta)", icone: Megaphone, cta: "Je participe" },
  remboursement: { label: "Offre de remboursement", pluriel: "Remboursements", couleur: "var(--success)", icone: Banknote, cta: "Déposer un dossier" },
  parrainage: { label: "Parrainage", pluriel: "Parrainages", couleur: "var(--accent)", icone: Users, cta: "Parrainer" },
};

const STATUTS: Record<StatutParticipation, { label: string; variant: "neutral" | "accent" | "success" | "warning" | "danger" }> = {
  inscrit: { label: "Inscrit", variant: "accent" },
  depose: { label: "Dossier déposé", variant: "warning" },
  valide: { label: "Validé", variant: "success" },
  paye: { label: "Payé", variant: "success" },
  refuse: { label: "Refusé", variant: "danger" },
};

const JOUR = 86400000;
const MOIS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const dateCourte = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
const euros = (n: number | null) => (n === null ? null : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n));

type Etat = "en_cours" | "a_venir" | "terminee" | "permanente";
/** Onglets : les offres en cours (et à venir), les offres permanentes (sans date de fin), les archives */
type Onglet = "en_cours" | "permanentes" | "archivees";
function etatDe(a: Animation): Etat {
  const auj = new Date().toISOString().slice(0, 10);
  if (!a.fin) return "permanente";
  return a.fin < auj ? "terminee" : a.debut > auj ? "a_venir" : "en_cours";
}
const ongletDe = (a: Animation): Onglet => {
  const e = etatDe(a);
  return e === "permanente" ? "permanentes" : e === "terminee" ? "archivees" : "en_cours";
};
/** Période lisible : « 1 mars au 31 mars », ou « Dès le 1 janv. » pour une offre permanente */
const periodeDe = (a: Animation) => (a.fin ? `${dateCourte(a.debut)} au ${dateCourte(a.fin)}` : `Dès le ${dateCourte(a.debut)}`);
function echeance(a: Animation) {
  const e = etatDe(a);
  if (e === "terminee") return "Archivée";
  if (e === "permanente") return a.debut > new Date().toISOString().slice(0, 10) ? `Dès le ${dateCourte(a.debut)}` : "Permanente";
  const cible = new Date(`${e === "a_venir" ? a.debut : a.fin}T23:59:59`);
  const j = Math.max(0, Math.ceil((cible.getTime() - Date.now()) / JOUR));
  return e === "a_venir" ? `Dans ${j} jour${j > 1 ? "s" : ""}` : j === 0 ? "Dernier jour" : `Plus que ${j} jour${j > 1 ? "s" : ""}`;
}

const VIDE: FormAnimation = { id: null, type: "offre", titre: "", accroche: "", description: "", conditions: "", debut: "", fin: "", montant: "", points: "", produits: "", lienKit: "", niveaux: [], publie: true };

/** Animations du réseau : offres, offres de remboursement et parrainages sur une seule page. */
export function PageAnimations({
  animations,
  participations,
  parrainages,
  code,
  client,
  admin,
}: {
  animations: Animation[];
  participations: Participation[];
  parrainages: Parrainage[];
  code: string | null;
  client: boolean;
  admin: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [type, setType] = useState<TypeAnimation | "toutes">("toutes");
  const [etat, setEtat] = useState<Onglet>("en_cours");
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [edition, setEdition] = useState<FormAnimation | null>(null);
  const [dossier, setDossier] = useState({ reference: "", client: "", montant: "" });
  const [filleul, setFilleul] = useState({ nom: "", email: "", telephone: "" });

  const executer = (f: () => Promise<{ ok: boolean; message: string }>, apres?: () => void) =>
    start(async () => {
      const r = await f();
      toast(r.message);
      if (r.ok) apres?.();
    });

  const visibles = animations.filter((a) => (type === "toutes" || a.type === type) && ongletDe(a) === etat);
  const vedette = useMemo(() => {
    const enCours = animations.filter((a) => etatDe(a) === "en_cours").sort((a, b) => (a.fin ?? "").localeCompare(b.fin ?? ""));
    return enCours[0] ?? animations.filter((a) => etatDe(a) === "a_venir").sort((a, b) => a.debut.localeCompare(b.debut))[0] ?? null;
  }, [animations]);
  const choisie = animations.find((a) => a.id === ouverte) ?? null;
  // La frise de l’année démarre en 2027
  const annee = Math.max(2027, new Date().getFullYear());
  const debutAnnee = new Date(annee, 0, 1).getTime();
  const dureeAnnee = new Date(annee + 1, 0, 1).getTime() - debutAnnee;
  const posAnnee = (iso: string) => Math.max(0, Math.min(100, ((new Date(iso).getTime() - debutAnnee) / dureeAnnee) * 100));
  const surAnnee = animations.filter((a) => (a.fin ?? "9999-12-31") >= `${annee}-01-01` && a.debut <= `${annee}-12-31`);
  const partsDe = (id: string) => participations.filter((p) => p.animationId === id);
  const filleulsDe = (id: string) => parrainages.filter((p) => p.animationId === id);

  return (
    <>
      <PageHeader
        title="Animations"
        meta={animations.some((a) => a.demo) ? <Badge variant="warning">Animations de démonstration</Badge> : null}
        description="Toutes les actions de l’année au même endroit : offres à promouvoir, offres de remboursement et parrainages."
        actions={
          admin ? (
            <Button variant="primary" onClick={() => setEdition({ ...VIDE, debut: new Date().toISOString().slice(0, 10), fin: new Date(Date.now() + 30 * JOUR).toISOString().slice(0, 10) })}>
              <Plus aria-hidden />
              Nouvelle animation
            </Button>
          ) : null
        }
      />

      {/* À la une */}
      {vedette ? (
        <button
          type="button"
          onClick={() => setOuverte(vedette.id)}
          className="group relative mb-8 flex w-full flex-col gap-6 overflow-hidden rounded-lg p-6 text-left text-white shadow-lg transition-transform hover:-translate-y-0.5 sm:p-8 lg:flex-row lg:items-end"
          style={{ background: `linear-gradient(120deg, #0b2545 0%, color-mix(in srgb, ${TYPES[vedette.type].couleur} 70%, #0b2545) 100%)` }}
        >
          {(() => {
            const Icone = TYPES[vedette.type].icone;
            return <Icone aria-hidden className="absolute -right-6 -top-6 size-60 opacity-10 transition-transform duration-700 group-hover:rotate-6 group-hover:scale-105" />;
          })()}
          <div className="relative min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {etatDe(vedette) === "en_cours" ? "En ce moment" : "Bientôt"}, {TYPES[vedette.type].label.toLowerCase()}
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{vedette.titre}</h2>
            {vedette.accroche ? <p className="mt-2 max-w-2xl text-base text-white/80">{vedette.accroche}</p> : null}
            <p className="mt-4 text-sm text-white/70">
              {vedette.fin ? `Du ${dateCourte(vedette.debut)} au ${dateCourte(vedette.fin)}` : `Offre permanente, dès le ${dateCourte(vedette.debut)}`}
              {vedette.montant ? `, ${euros(vedette.montant)}` : ""}
              {vedette.points ? `, ${vedette.points} points` : ""}
            </p>
          </div>
          <div className="relative flex shrink-0 flex-col items-start gap-3 lg:items-end">
            <span className="font-display text-xl font-bold">{echeance(vedette)}</span>
            <span className="inline-flex h-12 items-center rounded-md bg-cta px-6 font-semibold text-cta-text shadow-cta transition-transform group-hover:scale-105">{TYPES[vedette.type].cta}</span>
          </div>
        </button>
      ) : null}

      {/* L'année */}
      {surAnnee.length ? (
        <section className="mb-8 rounded-lg border border-line bg-surface p-5 shadow-card" aria-label={`Animations ${annee}`}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold text-text">L’année {annee}</h2>
            <span className="text-xs text-text-3">{surAnnee.length} animation{surAnnee.length > 1 ? "s" : ""}</span>
          </div>
          <div className="relative">
            <div className="grid grid-cols-12 border-b border-line pb-1 text-center text-xs text-text-3">
              {MOIS.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
            <div className="relative mt-2" style={{ height: surAnnee.length * 28 }}>
              {surAnnee.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setOuverte(a.id)}
                  title={a.titre}
                  className="absolute flex h-6 items-center overflow-hidden rounded-full px-2 text-xs font-semibold text-white transition-transform hover:scale-y-110"
                  style={{ top: i * 28, left: `${posAnnee(a.debut)}%`, width: `${Math.max(4, posAnnee(a.fin ?? `${annee}-12-31`) - posAnnee(a.debut))}%`, background: TYPES[a.type].couleur }}
                >
                  <span className="truncate">{a.titre}</span>
                </button>
              ))}
              <span aria-hidden className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: `${posAnnee(new Date().toISOString())}%` }} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Filtres */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Type d’animation">
          {(["toutes", "offre", "remboursement", "parrainage"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", type === t ? "border-transparent text-white" : "border-line-strong bg-surface text-text hover:bg-sunken")}
              style={type === t ? { background: t === "toutes" ? "#0b2545" : TYPES[t].couleur } : undefined}
            >
              {t === "toutes" ? "Toutes" : TYPES[t].pluriel}
              <span className={cn("tabular text-xs", type === t ? "text-white/70" : "text-text-3")}>{t === "toutes" ? animations.length : animations.filter((a) => a.type === t).length}</span>
            </button>
          ))}
        </div>
        <Segmented
          size="sm"
          label="Offres"
          value={etat}
          onChange={setEtat}
          options={[
            { value: "en_cours", label: "Offres en cours", count: animations.filter((a) => ongletDe(a) === "en_cours").length },
            { value: "permanentes", label: "Offres permanentes", count: animations.filter((a) => ongletDe(a) === "permanentes").length },
            { value: "archivees", label: "Offres archivées", count: animations.filter((a) => ongletDe(a) === "archivees").length },
          ]}
        />
      </div>

      {/* Cartes */}
      {visibles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center text-sm text-text-2">Aucune animation pour ces critères.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((a) => {
            const t = TYPES[a.type];
            const Icone = t.icone;
            const e = etatDe(a);
            const mesParts = partsDe(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setOuverte(a.id)}
                  className={cn("group flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-surface text-left shadow-card transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg", e === "terminee" && "opacity-70")}
                >
                  <span className="relative flex h-24 items-end px-5 pb-3" style={{ background: `linear-gradient(135deg, ${t.couleur}, color-mix(in srgb, ${t.couleur} 55%, #0b2545))` }}>
                    <Icone aria-hidden className="absolute right-4 top-4 size-12 text-white/30 transition-transform duration-500 group-hover:scale-110" />
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">{t.label}</span>
                  </span>
                  <span className="flex flex-1 flex-col gap-2 p-5">
                    <span className="font-display text-lg font-semibold leading-tight text-text">{a.titre}</span>
                    {a.accroche ? <span className="line-clamp-2 text-sm text-text-2">{a.accroche}</span> : null}
                    <span className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs">
                      <span className={cn("rounded-full px-2 py-0.5 font-semibold", e === "en_cours" || e === "permanente" ? "bg-success-soft text-success" : e === "a_venir" ? "bg-accent-soft text-accent-strong" : "bg-sunken text-text-3")}>{echeance(a)}</span>
                      <span className="text-text-3">
                        {periodeDe(a)}
                      </span>
                      {client && mesParts.length ? (
                        <Badge variant={STATUTS[mesParts[0].statut].variant}>
                          {a.type === "remboursement" ? `${mesParts.length} dossier${mesParts.length > 1 ? "s" : ""}` : STATUTS[mesParts[0].statut].label}
                        </Badge>
                      ) : null}
                      {!client && (mesParts.length || filleulsDe(a.id).length) ? (
                        <span className="text-text-3">
                          {mesParts.length} participant{mesParts.length > 1 ? "s" : ""}
                          {a.type === "parrainage" ? `, ${filleulsDe(a.id).length} filleul${filleulsDe(a.id).length > 1 ? "s" : ""}` : ""}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Détail d'une animation */}
      {choisie ? (
        <PanneauEdition
          titre={choisie.titre}
          description={`${TYPES[choisie.type].label}, ${choisie.fin ? `du ${dateCourte(choisie.debut)} au ${dateCourte(choisie.fin)}` : `offre permanente dès le ${dateCourte(choisie.debut)}`}`}
          onFermer={() => setOuverte(null)}
          pied={
            <>
              {admin ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEdition({
                      id: choisie.id, type: choisie.type, titre: choisie.titre, accroche: choisie.accroche ?? "", description: choisie.description ?? "", conditions: choisie.conditions ?? "",
                      debut: choisie.debut, fin: choisie.fin ?? "", montant: choisie.montant?.toString() ?? "", points: choisie.points?.toString() ?? "", produits: choisie.produits ?? "",
                      lienKit: choisie.lienKit ?? "", niveaux: choisie.niveaux, publie: choisie.publie,
                    });
                    setOuverte(null);
                  }}
                >
                  <Pencil aria-hidden />
                  Modifier
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setOuverte(null)}>
                Fermer
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", etatDe(choisie) === "en_cours" ? "bg-success-soft text-success" : "bg-sunken text-text-2")}>{echeance(choisie)}</span>
              {choisie.montant ? <Badge variant="success">{euros(choisie.montant)}</Badge> : null}
              {choisie.points ? <Badge variant="accent">{choisie.points} points</Badge> : null}
              {choisie.niveaux.length ? <Badge>IAP {choisie.niveaux.join(" et ")}</Badge> : null}
            </div>
            {choisie.description ? <p className="whitespace-pre-line text-sm leading-6 text-text">{choisie.description}</p> : null}
            {choisie.produits ? (
              <p className="text-sm text-text-2">
                <span className="font-semibold text-text">Produits concernés : </span>
                {choisie.produits}
              </p>
            ) : null}
            {choisie.conditions ? (
              <div className="rounded-md bg-sunken p-4 text-sm text-text-2">
                <p className="mb-1 font-semibold text-text">Conditions</p>
                <p className="whitespace-pre-line">{choisie.conditions}</p>
              </div>
            ) : null}
            {choisie.lienKit ? (
              <Link href={choisie.lienKit} className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
                <Gift aria-hidden className="size-4" />
                Kit de promotion : affiches, posts, textes
              </Link>
            ) : null}

            {/* Action du client */}
            {client && etatDe(choisie) !== "terminee" ? (
              <section className="rounded-lg border border-line p-4">
                {choisie.type === "offre" ? (
                  partsDe(choisie.id).length ? (
                    <p className="flex items-center gap-2 text-sm font-semibold text-success">
                      <Check aria-hidden className="size-4" />
                      Vous êtes inscrit. Votre kit vous sera envoyé.
                    </p>
                  ) : (
                    <Button variant="primary" disabled={pending} onClick={() => executer(() => participer(choisie.id))}>
                      <Check aria-hidden />
                      Je participe
                    </Button>
                  )
                ) : choisie.type === "remboursement" ? (
                  <form
                    className="grid gap-3 sm:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      executer(() => participer(choisie.id, dossier), () => setDossier({ reference: "", client: "", montant: "" }));
                    }}
                  >
                    <p className="font-semibold text-text sm:col-span-2">Déposer un dossier</p>
                    <Field label="Facture ou commande" htmlFor="d-ref">
                      <Input id="d-ref" value={dossier.reference} onChange={(e) => setDossier({ ...dossier, reference: e.target.value })} required />
                    </Field>
                    <Field label="Client final" htmlFor="d-client">
                      <Input id="d-client" value={dossier.client} onChange={(e) => setDossier({ ...dossier, client: e.target.value })} />
                    </Field>
                    <Button type="submit" variant="primary" disabled={pending || !dossier.reference.trim()} className="sm:col-span-2 sm:justify-self-start">
                      <Send aria-hidden />
                      Déposer le dossier
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4">
                    {code ? (
                      <div className="flex items-center gap-3 rounded-md bg-accent-soft p-3">
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-accent-strong">Votre code de parrainage</span>
                          <span className="font-display text-lg font-bold tracking-wide text-text">{code}</span>
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            void navigator.clipboard?.writeText(code);
                            toast("Code copié");
                          }}
                        >
                          <Copy aria-hidden />
                          Copier
                        </Button>
                      </div>
                    ) : null}
                    <form
                      className="grid gap-3 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        executer(() => inviterFilleul(choisie.id, filleul), () => setFilleul({ nom: "", email: "", telephone: "" }));
                      }}
                    >
                      <p className="font-semibold text-text sm:col-span-2">Inviter un confrère</p>
                      <Field label="Nom ou entreprise" htmlFor="f-nom" className="sm:col-span-2">
                        <Input id="f-nom" value={filleul.nom} onChange={(e) => setFilleul({ ...filleul, nom: e.target.value })} required />
                      </Field>
                      <Field label="E-mail" htmlFor="f-email">
                        <Input id="f-email" type="email" value={filleul.email} onChange={(e) => setFilleul({ ...filleul, email: e.target.value })} />
                      </Field>
                      <Field label="Téléphone" htmlFor="f-tel">
                        <Input id="f-tel" type="tel" value={filleul.telephone} onChange={(e) => setFilleul({ ...filleul, telephone: e.target.value })} />
                      </Field>
                      <Button type="submit" variant="primary" disabled={pending || !filleul.nom.trim()} className="sm:col-span-2 sm:justify-self-start">
                        <Send aria-hidden />
                        Inviter
                      </Button>
                    </form>
                  </div>
                )}
              </section>
            ) : null}

            {/* Suivi : mes dossiers / filleuls (client), tous les dossiers (interne) */}
            {partsDe(choisie.id).length && (client ? choisie.type === "remboursement" : true) ? (
              <section>
                <p className="mb-2 font-semibold text-text">{client ? "Mes dossiers" : `Participants (${partsDe(choisie.id).length})`}</p>
                <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
                  {partsDe(choisie.id).map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-text">{client ? p.reference ?? "Inscription" : p.compte}</span>
                        <span className="block truncate text-xs text-text-3">
                          {[!client && p.reference, p.clientFinal, euros(p.montant), dateCourte(p.creeLe), p.motif].filter(Boolean).join(", ")}
                        </span>
                      </span>
                      <Badge variant={STATUTS[p.statut].variant}>{STATUTS[p.statut].label}</Badge>
                      {admin && choisie.type === "remboursement" && p.statut !== "paye" && p.statut !== "refuse" ? (
                        <span className="flex gap-1">
                          {p.statut === "depose" ? (
                            <Button size="sm" variant="secondary" disabled={pending} onClick={() => executer(() => traiterParticipation(p.id, "valide"))}>
                              Valider
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" disabled={pending} onClick={() => executer(() => traiterParticipation(p.id, "paye"))}>
                              Payé
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => {
                              const motif = window.prompt("Motif du refus");
                              if (motif) executer(() => traiterParticipation(p.id, "refuse", motif));
                            }}
                            aria-label="Refuser le dossier"
                          >
                            <X aria-hidden />
                          </Button>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {choisie.type === "parrainage" && filleulsDe(choisie.id).length ? (
              <section>
                <p className="mb-2 font-semibold text-text">{client ? "Mes filleuls" : `Filleuls (${filleulsDe(choisie.id).length})`}</p>
                <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
                  {filleulsDe(choisie.id).map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-text">{f.filleulNom}</span>
                        <span className="block truncate text-xs text-text-3">{[!client && `Parrain : ${f.compte}`, f.filleulEmail, dateCourte(f.creeLe)].filter(Boolean).join(", ")}</span>
                      </span>
                      <Badge variant={f.statut === "recompense" ? "success" : f.statut === "inscrit" ? "accent" : "neutral"}>
                        {f.statut === "recompense" ? "Récompensé" : f.statut === "inscrit" ? "Devenu client" : "Invité"}
                      </Badge>
                      {admin && f.statut !== "recompense" ? (
                        <Button size="sm" variant="secondary" disabled={pending} onClick={() => executer(() => traiterParrainage(f.id, f.statut === "invite" ? "inscrit" : "recompense"))}>
                          {f.statut === "invite" ? "Devenu client" : "Récompenser"}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </PanneauEdition>
      ) : null}

      {/* Création ou modification (administrateur) */}
      {edition ? (
        <PanneauEdition
          titre={edition.id ? "Modifier l’animation" : "Nouvelle animation"}
          description={edition.titre || undefined}
          onFermer={() => setEdition(null)}
          pied={
            <>
              <Button variant="ghost" onClick={() => setEdition(null)}>
                Annuler
              </Button>
              <Button variant="primary" disabled={pending || !edition.titre.trim() || !edition.debut} onClick={() => executer(() => enregistrerAnimation(edition), () => setEdition(null))}>
                Enregistrer
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="a-type" className="sm:col-span-2">
              <Segmented
                label="Type d’animation"
                value={edition.type as TypeAnimation}
                onChange={(v) => setEdition({ ...edition, type: v })}
                options={[
                  { value: "offre", label: "Offre" },
                  { value: "remboursement", label: "Remboursement" },
                  { value: "parrainage", label: "Parrainage" },
                ]}
              />
            </Field>
            <Field label="Titre" htmlFor="a-titre" className="sm:col-span-2">
              <Input id="a-titre" value={edition.titre} onChange={(e) => setEdition({ ...edition, titre: e.target.value })} />
            </Field>
            <Field label="Accroche" htmlFor="a-accroche" className="sm:col-span-2">
              <Input id="a-accroche" value={edition.accroche} onChange={(e) => setEdition({ ...edition, accroche: e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="a-desc" className="sm:col-span-2">
              <textarea id="a-desc" rows={4} value={edition.description} onChange={(e) => setEdition({ ...edition, description: e.target.value })} className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            </Field>
            <Field label="Début" htmlFor="a-debut">
              <Input id="a-debut" type="date" value={edition.debut} onChange={(e) => setEdition({ ...edition, debut: e.target.value })} />
            </Field>
            <Field label="Fin" htmlFor="a-fin" hint="Laisser vide pour une offre permanente">
              <Input id="a-fin" type="date" value={edition.fin} onChange={(e) => setEdition({ ...edition, fin: e.target.value })} />
            </Field>
            {edition.type !== "offre" ? (
              <Field label={edition.type === "remboursement" ? "Montant remboursé (€)" : "Récompense en euros"} htmlFor="a-montant">
                <Input id="a-montant" inputMode="decimal" value={edition.montant} onChange={(e) => setEdition({ ...edition, montant: e.target.value })} />
              </Field>
            ) : null}
            <Field label="Points boutique" htmlFor="a-points">
              <Input id="a-points" inputMode="numeric" value={edition.points} onChange={(e) => setEdition({ ...edition, points: e.target.value })} />
            </Field>
            <Field label="Produits concernés" htmlFor="a-produits" className="sm:col-span-2">
              <Input id="a-produits" value={edition.produits} onChange={(e) => setEdition({ ...edition, produits: e.target.value })} />
            </Field>
            <Field label="Conditions" htmlFor="a-conditions" className="sm:col-span-2">
              <textarea id="a-conditions" rows={3} value={edition.conditions} onChange={(e) => setEdition({ ...edition, conditions: e.target.value })} className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none" />
            </Field>
            <Field label="Lien du kit de promotion" htmlFor="a-kit" hint="Par exemple /mediatheque" className="sm:col-span-2">
              <Input id="a-kit" value={edition.lienKit} onChange={(e) => setEdition({ ...edition, lienKit: e.target.value })} />
            </Field>
            <Field label="Accessible à" htmlFor="a-niveaux" className="sm:col-span-2">
              <Select
                id="a-niveaux"
                value={edition.niveaux.join(",")}
                onChange={(e) => setEdition({ ...edition, niveaux: e.target.value ? e.target.value.split(",") : [] })}
              >
                <option value="">Tout le réseau</option>
                <option value="Elite,Premium,Officiel">IAP (tous niveaux)</option>
                <option value="Elite,Premium">IAP Elite et Premium</option>
                <option value="Elite">IAP Elite uniquement</option>
              </Select>
            </Field>
            <label className="flex items-center gap-3 text-sm font-medium text-text sm:col-span-2">
              <input type="checkbox" checked={edition.publie} onChange={(e) => setEdition({ ...edition, publie: e.target.checked })} className="size-4 accent-[var(--accent)]" />
              Publiée (visible par le réseau)
            </label>
          </div>
        </PanneauEdition>
      ) : null}
    </>
  );
}
