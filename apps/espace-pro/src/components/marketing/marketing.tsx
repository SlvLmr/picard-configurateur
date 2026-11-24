"use client";

import { Check, CircleCheck, Coins, Globe, Megaphone, MonitorSmartphone, PackageCheck, Printer, Send, Share2, Store, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { Repartition } from "@/components/ui/repartition";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { CATEGORIES, CLIENT_DEMO, CLIENTS_ATC, COMMANDES_TRIMESTRE, OPERATION, SUPPORTS, type CategorieSupport, type Support } from "@/lib/mock/marketing";
import { isClient } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { ApercuSupport } from "./apercu-support";

const ICONES: Record<CategorieSupport, typeof Printer> = {
  imprime: Printer,
  reseaux: Share2,
  google: Globe,
  campagne: Megaphone,
  site: MonitorSmartphone,
};

const prixMin = (s: Support) => s.options.reduce((m, o) => (o.euros < m.euros ? o : m), s.options[0]);
const euros = (n: number) => (n === 0 ? "Inclus" : `${formatNumber(n)} €`);

export function Marketing() {
  const { persona } = useSession();
  return persona.role === "atc" ? <VueCommercial /> : <VueClient apercu={!isClient(persona.role)} />;
}

/* ─────────────────────────── Client ─────────────────────────── */
function VueClient({ apercu }: { apercu: boolean }) {
  const toast = useToast();
  const [inscrit, setInscrit] = useState(false);
  const [categorie, setCategorie] = useState<"tout" | CategorieSupport>("tout");
  const [choix, setChoix] = useState<string>(SUPPORTS[0].id);
  const [option, setOption] = useState(0);
  const [paiement, setPaiement] = useState<"euros" | "points">("euros");

  const visibles = categorie === "tout" ? SUPPORTS : SUPPORTS.filter((s) => s.categorie === categorie);
  const support = SUPPORTS.find((s) => s.id === choix) ?? SUPPORTS[0];
  const o = support.options[Math.min(option, support.options.length - 1)];
  const gratuit = o.euros === 0;
  const pointsSuffisants = CLIENT_DEMO.points >= o.points;

  const choisir = (id: string) => {
    setChoix(id);
    setOption(0);
    setPaiement("euros");
  };

  return (
    <>
      <PageHeader
        title="Marketing"
        meta={apercu ? <Badge variant="neutral">Aperçu au nom de {CLIENT_DEMO.raison}</Badge> : null}
        description="Des supports à votre nom pour vous faire connaître autour de chez vous. Chaque commande passe par un bon à tirer que vous validez."
      />

      <section aria-labelledby="operation-titre" className="relative overflow-hidden rounded-lg bg-nav p-6 text-nav-text shadow-card sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="elite" className="bg-cta text-cta-text">
                Opération nationale
              </Badge>
              <span className="text-sm text-nav-muted">
                {OPERATION.periode}, {OPERATION.limite.toLowerCase()}
              </span>
            </div>
            <h2 id="operation-titre" className="font-display mt-4 text-2xl font-semibold text-white">
              {OPERATION.titre}
            </h2>
            <p className="mt-2 max-w-prose text-base text-nav-muted">{OPERATION.accroche}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {OPERATION.inclus.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-white">
                  <Check className="mt-0.5 size-4 shrink-0 text-cta" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-6">
            <p className="text-sm text-nav-muted">{OPERATION.cofinancement}</p>
            <p className="tabular mt-2 text-sm text-white">
              <span className="font-display text-xl font-bold">{OPERATION.participants}</span> installateurs déjà inscrits
            </p>
            {inscrit ? (
              <p className="mt-6 inline-flex h-12 items-center gap-2 rounded-md bg-success-soft px-4 text-sm font-semibold text-success">
                <CircleCheck className="size-5" aria-hidden />
                Vous participez. Vos supports sont prêts.
              </p>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="mt-6 w-full"
                onClick={() => {
                  setInscrit(true);
                  toast("Inscription confirmée. Vos supports de l’opération sont prêts.");
                }}
              >
                Je participe
              </Button>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="catalogue-titre" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="catalogue-titre" className="font-display text-lg font-semibold text-text">
              Catalogue des supports
            </h2>
            <p className="mt-1 text-sm text-text-2">Payables en euros ou avec vos points. Vous avez {formatNumber(CLIENT_DEMO.points)} points.</p>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Segmented
              label="Catégorie de supports"
              value={categorie}
              onChange={setCategorie}
              options={[
                { value: "tout", label: "Tout", count: SUPPORTS.length },
                ...(Object.keys(CATEGORIES) as CategorieSupport[]).map((k) => ({
                  value: k,
                  label: CATEGORIES[k],
                  count: SUPPORTS.filter((s) => s.categorie === k).length,
                })),
              ]}
            />
          </div>
        </div>

        <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {visibles.map((s) => {
              const min = prixMin(s);
              const actif = s.id === support.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => choisir(s.id)}
                    aria-pressed={actif}
                    className={cn(
                      "group flex h-full w-full flex-col gap-3 rounded-lg border bg-surface p-5 text-left shadow-card transition-colors",
                      actif ? "border-accent ring-2 ring-accent-soft" : "border-line hover:border-line-strong",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Picto icon={ICONES[s.categorie]} tone={s.operation ? "cta" : "accent"} />
                      <div className="flex flex-wrap justify-end gap-1">
                        {s.operation ? <Badge variant="warning">Opération</Badge> : null}
                        {s.cofinance ? <Badge variant="success">Co-financé</Badge> : null}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-text group-hover:text-accent">{s.titre}</p>
                      <p className="mt-1 text-sm text-text-2">{s.description}</p>
                    </div>
                    <div className="tabular mt-auto flex items-baseline justify-between gap-3 border-t border-line pt-3 text-sm">
                      <span className="font-semibold text-text">
                        {min.euros === 0 ? "Inclus" : `Dès ${euros(min.euros)}`}
                        {min.points ? <span className="font-normal text-text-3"> ou {formatNumber(min.points)} pts</span> : null}
                      </span>
                      <span className="text-xs text-text-3">{s.delai}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <Panel className="order-first xl:sticky xl:top-24 xl:order-none">
            <PanelHeader title={support.titre} description="Aperçu personnalisé, le bon à tirer fait foi" />
            <PanelBody className="flex flex-col gap-6">
              <div className="rounded-md bg-sunken p-6">
                <ApercuSupport type={support.apercu} />
              </div>
              <Field label="Quantité ou formule" htmlFor="mk-option">
                <Select id="mk-option" value={option} onChange={(e) => setOption(Number(e.target.value))}>
                  {support.options.map((op, i) => (
                    <option key={op.label} value={i}>
                      {op.label}, {euros(op.euros)}
                      {op.points ? ` ou ${formatNumber(op.points)} points` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              {!gratuit ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-text">Paiement</span>
                  <Segmented
                    label="Mode de paiement"
                    value={paiement}
                    onChange={setPaiement}
                    options={[
                      { value: "euros", label: "En euros" },
                      { value: "points", label: "Avec mes points" },
                    ]}
                  />
                  {paiement === "points" && !pointsSuffisants ? (
                    <p className="text-xs font-medium text-danger">
                      Il vous manque {formatNumber(o.points - CLIENT_DEMO.points)} points pour cette formule.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <dl className="text-sm">
                <div className="flex justify-between border-t border-line py-2">
                  <dt className="text-text-3">Total</dt>
                  <dd className="tabular font-display text-lg font-bold text-text">
                    {gratuit ? "Inclus" : paiement === "points" ? `${formatNumber(o.points)} pts` : euros(o.euros)}
                  </dd>
                </div>
                {paiement === "points" && !gratuit && pointsSuffisants ? (
                  <div className="flex justify-between border-t border-line py-2">
                    <dt className="text-text-3">Solde après commande</dt>
                    <dd className="tabular font-medium text-text">{formatNumber(CLIENT_DEMO.points - o.points)} pts</dd>
                  </div>
                ) : null}
                {support.cofinance ? (
                  <div className="flex justify-between border-t border-line py-2">
                    <dt className="text-text-3">Co-financement Picard</dt>
                    <dd className="font-medium text-success">50 % remboursés en points</dd>
                  </div>
                ) : null}
              </dl>
              <Button
                variant="primary"
                size="lg"
                disabled={paiement === "points" && !gratuit && !pointsSuffisants}
                onClick={() => toast(`Bon à tirer demandé pour « ${support.titre} ». Vous le recevrez sous 48 h pour validation.`)}
              >
                <PackageCheck aria-hidden />
                Valider le BAT
              </Button>
            </PanelBody>
          </Panel>
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────── Commercial ─────────────────────────── */
const GOOGLE: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  optimisee: { label: "Fiche Google optimisée", variant: "success" },
  incomplete: { label: "Fiche Google incomplète", variant: "warning" },
  a_creer: { label: "Pas de fiche Google", variant: "danger" },
};

function VueCommercial() {
  const toast = useToast();
  const [envoyes, setEnvoyes] = useState<string[]>([]);
  const inscrits = CLIENTS_ATC.filter((c) => c.operation).length;
  const fichesAFaire = CLIENTS_ATC.filter((c) => c.google !== "optimisee").length;
  const priorites = useMemo(() => [...CLIENTS_ATC].sort((a, b) => Number(a.operation) - Number(b.operation)), []);

  return (
    <>
      <PageHeader
        title="Marketing de mes clients"
        description="Aidez vos clients à se faire connaître localement : chaque support commandé et chaque campagne génèrent des leads dans votre secteur."
      />
      <KpiBand
        items={[
          { label: "Inscrits à l’opération", value: `${inscrits} / ${CLIENTS_ATC.length}`, icon: Users, tone: "cta", note: OPERATION.limite },
          { label: "Fiches Google à reprendre", value: fichesAFaire, icon: Store, tone: "warning", note: "Premier levier de visibilité locale" },
          { label: "Supports commandés", value: COMMANDES_TRIMESTRE.reduce((s, c) => s + c.value, 0), icon: PackageCheck, tone: "success", delta: { text: "+12 %", sens: "up", bon: true }, note: "Ce trimestre" },
          { label: "Points dépensés en marketing", value: formatNumber(18450), icon: Coins, note: "Ce trimestre" },
        ]}
      />
      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="À proposer cette semaine" description="Les clients non inscrits à l’opération d’abord" />
          <ul>
            {priorites.map((c) => {
              const g = GOOGLE[c.google];
              const envoye = envoyes.includes(c.nom);
              return (
                <li key={c.nom} className="grid gap-3 border-t border-line px-6 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-text">{c.nom}</span>
                      <NiveauBadge type={c.niveau} />
                      <span className="text-sm text-text-3">{c.ville}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant={c.operation ? "success" : "neutral"}>{c.operation ? "Inscrit à l’opération" : "Pas encore inscrit"}</Badge>
                      <Badge variant={g.variant}>{g.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-text-2">{c.recommandation}</p>
                    <p className="mt-1 text-xs text-text-3">{c.derniereCommande ? `Dernière commande : ${c.derniereCommande}` : "Aucune commande de supports"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={envoye ? "ghost" : "secondary"}
                    disabled={envoye}
                    onClick={() => {
                      setEnvoyes((e) => [...e, c.nom]);
                      toast(`Proposition envoyée à ${c.nom}`);
                    }}
                  >
                    {envoye ? <Check aria-hidden /> : <Send aria-hidden />}
                    {envoye ? "Envoyée" : "Envoyer la proposition"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader title="Supports commandés" description="Par vos clients, ce trimestre" />
          <PanelBody>
            <Repartition
              label="Supports commandés par catégorie"
              segments={COMMANDES_TRIMESTRE.map((c, i) => ({
                ...c,
                color: ["var(--accent)", "var(--bleu-400)", "var(--success)", "var(--cta)", "var(--bleu-300)"][i],
              }))}
            />
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
