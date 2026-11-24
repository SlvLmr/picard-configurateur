"use client";

import { Check, CircleAlert, DoorOpen, FileText, FolderOpen, Info, Save, Truck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { traiterConfiguration, type EtapeConfiguration } from "@/app/(app)/configurateur/actions";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  FINITIONS,
  MODELES,
  OPTIONS,
  POSES,
  SECURITES,
  finition,
  modele,
  type Configuration,
  type FinitionId,
  type OptionId,
} from "@/lib/configurateur/catalogue";
import { chiffrer, evaluer, type Etape, type Evaluation } from "@/lib/configurateur/regles";
import { formatEuros } from "@/lib/format";
import type { NiveauIAP, RoleId } from "@/lib/roles";
import { isClient } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { SchemaPorte } from "./schema-porte";

const ETAPES: { id: Etape | "recap"; label: string }[] = [
  { id: "projet", label: "Projet" },
  { id: "pose", label: "Pose" },
  { id: "dimensions", label: "Dimensions" },
  { id: "ouverture", label: "Ouverture" },
  { id: "securite", label: "Sécurité" },
  { id: "finitions", label: "Finitions" },
  { id: "options", label: "Options" },
  { id: "recap", label: "Récapitulatif" },
];

export type LeadSource = { id: string; reference: string; contact: string; ville: string | null; projet: string } | null;

export type ConfigurationReprise = { id: string; reference: string; statut: "brouillon" | "devis" | "commande"; prixVente: number | null } | null;

const LIBELLE_STATUT_CONFIG = {
  brouillon: { label: "Brouillon", variant: "neutral" },
  devis: { label: "Devis généré", variant: "accent" },
  commande: { label: "Commandée", variant: "success" },
} as const;

export function Configurateur({
  initiale,
  niveau,
  lead,
  role,
  reprise = null,
}: {
  initiale: Configuration;
  niveau: NiveauIAP | null;
  lead: LeadSource;
  role: RoleId;
  reprise?: ConfigurationReprise;
}) {
  const toast = useToast();
  const router = useRouter();
  const { persona } = useSession();
  const [c, setC] = useState<Configuration>(initiale);
  const [etape, setEtape] = useState(0);
  const [prixVente, setPrixVente] = useState<string>(reprise?.prixVente ? String(reprise.prixVente) : "");
  const [enregistree, setEnregistree] = useState(reprise);
  const [enCours, setEnCours] = useState<EtapeConfiguration | null>(null);
  const [, startTransition] = useTransition();

  // L'administrateur prévisualise le tarif d'un client IAP via l'aperçu.
  const niveauApplique = niveau ?? (role === "admin" && isClient(persona.role) ? (persona.niveau ?? null) : null);
  const evaluation = useMemo(() => evaluer(c), [c]);
  const chiffrage = useMemo(() => chiffrer(c, niveauApplique, evaluation), [c, niveauApplique, evaluation]);
  const venteParDefaut = Math.round((chiffrage.prixPublic + 650) / 10) * 10;
  const vente = prixVente === "" ? venteParDefaut : Number(prixVente.replace(/\s/g, "").replace(",", ".")) || 0;
  const marge = vente - chiffrage.prixAchat;
  const maj = (p: Partial<Configuration>) => setC((x) => ({ ...x, ...p }));
  const courante = ETAPES[etape].id;
  const bloque = evaluation.bloquants.length > 0;

  const commandee = enregistree?.statut === "commande";

  const action = (etapeAction: EtapeConfiguration) => {
    if (bloque && etapeAction !== "enregistrer") {
      toast("Corrigez les points bloquants avant de continuer.");
      return;
    }
    if (etapeAction === "devis" && vente <= 0) {
      toast("Renseignez votre prix de vente avant de générer le devis.");
      return;
    }
    setEnCours(etapeAction);
    startTransition(async () => {
      const r = await traiterConfiguration(etapeAction, {
        id: enregistree?.id ?? null,
        configuration: c,
        prixAchat: chiffrage.prixAchat,
        prixVente: vente > 0 ? vente : null,
        leadId: lead?.id ?? null,
      });
      setEnCours(null);
      toast(r.message);
      if (!r.ok) return;
      const statut = etapeAction === "commander" ? "commande" : etapeAction === "devis" ? "devis" : "brouillon";
      setEnregistree({ id: r.id, reference: r.reference, statut, prixVente: vente > 0 ? vente : null });
      if (etapeAction === "devis") router.push(`/configurateur/devis/${r.id}`);
      else if (etapeAction === "commander") router.push("/configurateur/mes-configurations");
      else router.replace(`/configurateur?reprendre=${r.id}`, { scroll: false });
    });
  };

  return (
    <>
      <PageHeader
        title={`Porte blindée ${modele(c.modele).nom}`}
        meta={
          <>
            {enregistree ? (
              <Badge variant={LIBELLE_STATUT_CONFIG[enregistree.statut].variant}>
                {enregistree.reference}, {LIBELLE_STATUT_CONFIG[enregistree.statut].label.toLowerCase()}
              </Badge>
            ) : null}
            {lead ? <Badge variant="accent">Depuis le lead {lead.reference}</Badge> : null}
          </>
        }
        actions={
          <ButtonLink href="/configurateur/mes-configurations" variant="secondary">
            <FolderOpen aria-hidden />
            Mes configurations
          </ButtonLink>
        }
        description={
          lead
            ? `${lead.contact}${lead.ville ? `, ${lead.ville}` : ""}. Les choix du particulier dans Ma Porte sont repris : vérifiez-les et prenez les cotes sur place.`
            : "Configurez une porte fabricable : les règles du bureau d’études sont appliquées à chaque choix."
        }
      />

      <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_320px]">
        <nav aria-label="Étapes de configuration" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="flex gap-1 overflow-x-auto lg:flex-col">
            {ETAPES.map((e, i) => {
              const erreurs = e.id !== "recap" ? (evaluation.parEtape[e.id] ?? 0) : 0;
              const fait = i < etape;
              return (
                <li key={e.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setEtape(i)}
                    aria-current={i === etape ? "step" : undefined}
                    className={cn(
                      "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                      i === etape ? "bg-accent-soft text-text" : fait ? "text-text hover:bg-sunken" : "text-text-3 hover:bg-sunken hover:text-text",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold",
                        erreurs ? "border-danger bg-danger text-white" : i === etape ? "border-accent bg-accent text-white" : fait ? "border-accent-strong bg-accent-strong text-surface" : "border-line-strong",
                      )}
                    >
                      {erreurs ? "!" : fait ? <Check className="size-3" aria-hidden /> : i + 1}
                    </span>
                    {e.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <Panel>
          <PanelHeader title={ETAPES[etape].label} description={DESCRIPTIONS[courante]} />
          <PanelBody>
            <div className={cn("grid gap-8", courante !== "recap" && "md:grid-cols-[minmax(0,1fr)_minmax(0,240px)]")}>
              <div className="flex min-w-0 flex-col gap-6">
                <ContenuEtape etape={courante} c={c} maj={maj} lead={lead} evaluation={evaluation} />
                <MessagesRegles evaluation={evaluation} etape={courante} appliquer={maj} />
              </div>
              {courante !== "recap" ? (
                <div className="rounded-md border border-line bg-sunken p-4">
                  <SchemaPorte c={c} />
                </div>
              ) : null}
            </div>
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
              <Button variant="ghost" disabled={etape === 0} onClick={() => setEtape((e) => Math.max(0, e - 1))}>
                Étape précédente
              </Button>
              {etape < ETAPES.length - 1 ? (
                <Button onClick={() => setEtape((e) => Math.min(ETAPES.length - 1, e + 1))}>Étape suivante</Button>
              ) : null}
            </div>
          </PanelBody>
        </Panel>

        <aside className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-24 xl:self-start">
          <Panel>
            <PanelHeader title="Récapitulatif" description={niveauApplique ? undefined : "Tarif professionnel de base"} actions={niveauApplique ? <NiveauBadge type={niveauApplique} /> : null} />
            <ul className="px-6">
              {chiffrage.lignes.map((l) => (
                <li key={l.label} className="flex justify-between gap-4 border-t border-dashed border-line py-2 text-sm first:border-t-0">
                  <span className="text-text-2">{l.label}</span>
                  <span className="tabular font-medium text-text">{formatEuros(l.prix)}</span>
                </li>
              ))}
            </ul>
            <PanelBody className="mt-4 flex flex-col gap-4 border-t border-line pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-text-2">Tarif public HT</span>
                <span className="tabular text-sm text-text-3 line-through">{formatEuros(chiffrage.prixPublic)}</span>
              </div>
              <div>
                <p className="text-sm text-text-2">Votre prix d’achat HT, remise de {Math.round(chiffrage.remise * 100)} %</p>
                <p className="font-display tabular text-2xl font-bold text-text">{formatEuros(chiffrage.prixAchat)}</p>
              </div>
              <Field label="Votre prix de vente HT, pose comprise" htmlFor="prix-vente" hint={`Marge : ${formatEuros(marge)}${vente ? `, soit ${Math.round((marge / vente) * 100)} %` : ""}`}>
                <Input id="prix-vente" inputMode="decimal" value={prixVente === "" ? String(venteParDefaut) : prixVente} onChange={(e) => setPrixVente(e.target.value)} />
              </Field>
              <div className="flex items-center gap-3 rounded-md bg-sunken px-3 py-2">
                <Truck className="size-4 text-text-3" aria-hidden />
                <span className="text-sm text-text-2">
                  Fabrication en <span className="font-semibold text-text">{chiffrage.delaiSemaines} semaines</span>
                </span>
              </div>
              {bloque ? (
                <p className="flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                  <CircleAlert className="size-4 shrink-0" aria-hidden />
                  {evaluation.bloquants.length === 1 ? "1 point bloquant à corriger" : `${evaluation.bloquants.length} points bloquants à corriger`}
                </p>
              ) : null}
              {commandee ? (
                <div className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-sm text-success">
                    <Check className="size-4 shrink-0" aria-hidden />
                    Configuration commandée : elle n’est plus modifiable.
                  </p>
                  <ButtonLink href={`/configurateur/devis/${enregistree!.id}`} className="w-full">
                    <FileText aria-hidden />
                    Voir le devis
                  </ButtonLink>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="primary" size="lg" className="w-full" disabled={bloque || enCours !== null} onClick={() => action("commander")}>
                    <Truck aria-hidden />
                    {enCours === "commander" ? "Commande en cours…" : "Commander"}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => action("devis")} disabled={bloque || enCours !== null}>
                      <FileText aria-hidden />
                      Devis client
                    </Button>
                    <Button onClick={() => action("enregistrer")} disabled={enCours !== null}>
                      <Save aria-hidden />
                      Enregistrer
                    </Button>
                  </div>
                  {enregistree?.statut === "devis" ? (
                    <p className="text-xs text-text-3">Modifier la configuration la repasse en brouillon : régénérez ensuite le devis.</p>
                  ) : null}
                </div>
              )}
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </>
  );
}

const DESCRIPTIONS: Record<Etape | "recap", string> = {
  projet: "Le chantier et le modèle de porte.",
  pose: "Comment la porte sera posée.",
  dimensions: "Cotes du tableau de maçonnerie, en millimètres.",
  ouverture: "Sens et main, vus depuis le palier.",
  securite: "Niveau de certification contre l’effraction.",
  finitions: "Habillage côté palier et côté intérieur.",
  options: "Équipements complémentaires.",
  recap: "Vérifiez la configuration avant de chiffrer.",
};

function Choix({ actif, titre, detail, prix, onClick, desactive }: { actif: boolean; titre: string; detail?: string; prix?: number; onClick: () => void; desactive?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col rounded-md border-2 bg-surface px-4 py-3 text-left transition-colors",
        actif ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong",
        desactive && !actif && "opacity-60",
      )}
    >
      <span className="flex items-center justify-between gap-2 text-sm font-semibold text-text">
        {titre}
        {actif ? <Check className="size-4 text-accent" aria-hidden /> : null}
      </span>
      {detail ? <span className="mt-0.5 text-xs text-text-3">{detail}</span> : null}
      {prix !== undefined ? <span className="tabular mt-2 text-xs font-medium text-text-2">{prix ? `+ ${formatEuros(prix)}` : "Inclus"}</span> : null}
    </button>
  );
}

function Teintes({ label, valeur, onChange }: { label: string; valeur: FinitionId; onChange: (f: FinitionId) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-text">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-3">
        {FINITIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={valeur === f.id}
            onClick={() => onChange(f.id)}
            className={cn("flex w-24 flex-col items-center gap-2 rounded-md border-2 p-2 text-xs font-medium text-text transition-colors", valeur === f.id ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong")}
          >
            <span className="h-10 w-full rounded-sm border border-line" style={{ background: f.teinte }} aria-hidden />
            <span className="text-center leading-4">{f.nom}</span>
            {f.prix ? <span className="tabular text-text-3">+ {formatEuros(f.prix)}</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ContenuEtape({
  etape,
  c,
  maj,
  lead,
  evaluation,
}: {
  etape: Etape | "recap";
  c: Configuration;
  maj: (p: Partial<Configuration>) => void;
  lead: LeadSource;
  evaluation: Evaluation;
}) {
  const m = modele(c.modele);
  switch (etape) {
    case "projet":
      return (
        <>
          {lead ? (
            <div className="flex gap-3 rounded-md bg-accent-soft px-4 py-3">
              <Picto icon={DoorOpen} tone="cta" size="sm" />
              <p className="text-sm text-accent-strong">
                Le particulier a configuré sa porte dans Ma Porte : <span className="font-semibold">{lead.projet}</span>. Modèle, finition et dimensions sont repris ci-dessous.
              </p>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Référence du chantier" htmlFor="reference" hint="Elle apparaîtra sur le devis et la commande.">
              <Input id="reference" value={c.reference} onChange={(e) => maj({ reference: e.target.value })} placeholder="Ex. Bernard, Nantes" />
            </Field>
            <Field label="Client final" htmlFor="client">
              <Input id="client" value={c.clientFinal} onChange={(e) => maj({ clientFinal: e.target.value })} placeholder="Nom du particulier" />
            </Field>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-text">Modèle</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {MODELES.map((x) => (
                <Choix key={x.id} actif={c.modele === x.id} titre={x.nom} detail={`${x.usage}. ${x.securites.join(", ")}`} prix={undefined} onClick={() => maj({ modele: x.id })} />
              ))}
            </div>
          </fieldset>
        </>
      );
    case "pose":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {POSES.map((p) => (
            <Choix key={p.id} actif={c.pose === p.id} titre={p.nom} detail={p.detail} prix={p.prix} onClick={() => maj({ pose: p.id })} />
          ))}
        </div>
      );
    case "dimensions":
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Largeur du tableau" htmlFor="largeur" hint={`${m.nom} : de ${m.largeur.min} à ${m.largeur.max} mm`} error={evaluation.bloquants.some((b) => b.regle.id === "largeur-hors-gamme") ? "Hors gamme" : undefined}>
              <Input id="largeur" type="number" inputMode="numeric" step={10} value={c.largeur} onChange={(e) => maj({ largeur: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Hauteur du tableau" htmlFor="hauteur" hint={`${m.nom} : de ${m.hauteur.min} à ${m.hauteur.max} mm`} error={evaluation.bloquants.some((b) => b.regle.id === "hauteur-hors-gamme") ? "Hors gamme" : undefined}>
              <Input id="hauteur" type="number" inputMode="numeric" step={10} value={c.hauteur} onChange={(e) => maj({ hauteur: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <div className="flex gap-3 rounded-md bg-sunken px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden />
            <p className="text-sm text-text-2">Mesurez le tableau en trois points (haut, milieu, bas) et retenez la plus petite valeur. Le passage libre est d’environ 100 mm de moins que la largeur du tableau.</p>
          </div>
        </>
      );
    case "ouverture":
      return (
        <>
          <fieldset>
            <legend className="text-sm font-medium text-text">Sens d’ouverture</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Choix actif={c.sens === "poussant"} titre="Poussant" detail="La porte s’ouvre vers l’intérieur" onClick={() => maj({ sens: "poussant" })} />
              <Choix actif={c.sens === "tirant"} titre="Tirant" detail="La porte s’ouvre vers le palier" onClick={() => maj({ sens: "tirant" })} />
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-text">Main</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Choix actif={c.main === "gauche"} titre="Gauche" detail="Paumelles à gauche, vues du palier" onClick={() => maj({ main: "gauche" })} />
              <Choix actif={c.main === "droite"} titre="Droite" detail="Paumelles à droite, vues du palier" onClick={() => maj({ main: "droite" })} />
            </div>
          </fieldset>
        </>
      );
    case "securite":
      return (
        <>
          <div className="grid gap-3">
            {SECURITES.map((s) => (
              <Choix
                key={s.id}
                actif={c.securite === s.id}
                titre={s.nom}
                detail={m.securites.includes(s.id) ? s.detail : `${s.detail}. Indisponible en ${m.nom}`}
                prix={s.prix}
                desactive={!m.securites.includes(s.id)}
                onClick={() => maj({ securite: s.id })}
              />
            ))}
          </div>
          <p className="text-sm text-text-2">Serrure multipoints 5 points et cylindre certifié du même niveau inclus.</p>
        </>
      );
    case "finitions":
      return (
        <>
          <Teintes label="Côté palier" valeur={c.finitionExterieure} onChange={(f) => maj({ finitionExterieure: f })} />
          <Teintes label="Côté intérieur" valeur={c.finitionInterieure} onChange={(f) => maj({ finitionInterieure: f })} />
        </>
      );
    case "options":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((o) => {
            const actif = c.options.includes(o.id);
            return (
              <Choix
                key={o.id}
                actif={actif}
                titre={o.nom}
                detail={o.detail}
                prix={o.prix}
                onClick={() => maj({ options: actif ? c.options.filter((x) => x !== o.id) : ([...c.options, o.id] as OptionId[]) })}
              />
            );
          })}
        </div>
      );
    case "recap":
      return (
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)]">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 text-sm">
            {[
              ["Chantier", c.reference || "Non renseigné"],
              ["Client final", c.clientFinal || "Non renseigné"],
              ["Modèle", `${m.nom}, ${m.usage.toLowerCase()}`],
              ["Pose", POSES.find((p) => p.id === c.pose)!.nom],
              ["Tableau", `${c.largeur} × ${c.hauteur} mm`],
              ["Ouverture", `${c.sens === "poussant" ? "Poussant" : "Tirant"} ${c.main}`],
              ["Sécurité", SECURITES.find((s) => s.id === c.securite)!.nom],
              ["Côté palier", finition(c.finitionExterieure).nom],
              ["Côté intérieur", finition(c.finitionInterieure).nom],
              ["Options", c.options.length ? c.options.map((id) => OPTIONS.find((o) => o.id === id)!.nom).join(", ") : "Aucune"],
            ].map(([k, v]) => (
              <div key={k} className="col-span-2 grid grid-cols-subgrid border-t border-line py-2 first:border-t-0">
                <dt className="text-text-3">{k}</dt>
                <dd className="font-medium text-text">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-md border border-line bg-sunken p-4">
            <SchemaPorte c={c} />
          </div>
        </div>
      );
  }
}

function MessagesRegles({ evaluation, etape, appliquer }: { evaluation: Evaluation; etape: Etape | "recap"; appliquer: (p: Partial<Configuration>) => void }) {
  const garde = <T extends { regle: { etape: Etape } }>(x: T) => etape === "recap" || x.regle.etape === etape;
  const bloquants = evaluation.bloquants.filter(garde);
  const supplements = evaluation.supplements.filter(garde);
  const avertissements = evaluation.avertissements.filter(garde);
  if (!bloquants.length && !supplements.length && !avertissements.length) return null;
  return (
    <ul className="flex flex-col gap-3" aria-live="polite">
      {bloquants.map((b) => (
        <li key={b.regle.id} className="flex gap-3 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">{b.message}</p>
            {b.alternative ? (
              <Button size="sm" variant="danger" className="mt-2" onClick={() => appliquer(b.alternative!.appliquer)}>
                {b.alternative.label}
              </Button>
            ) : null}
          </div>
        </li>
      ))}
      {supplements.map((s) => (
        <li key={s.regle.id} className="flex gap-3 rounded-md bg-accent-soft px-4 py-3 text-sm text-accent-strong">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {s.message} <span className="font-semibold">{s.label} ajouté : + {formatEuros(s.prix)}</span>
          </p>
        </li>
      ))}
      {avertissements.map((a) => (
        <li key={a.regle.id} className="flex gap-3 rounded-md bg-warning-soft px-4 py-3 text-sm text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{a.message}</p>
        </li>
      ))}
    </ul>
  );
}
