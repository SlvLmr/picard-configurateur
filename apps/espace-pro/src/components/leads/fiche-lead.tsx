"use client";

import { Ban, BellRing, Check, ChevronLeft, EyeOff, Lock, Mail, MapPin, MessageSquare, Package, Pencil, Phone, Ruler, Send, Smile, StickyNote, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  accepterLead,
  ajouterNote,
  annulerLead,
  attribuerLead,
  changerStatutLead,
  commenterLead,
  envoyerEnquete,
  modifierLead,
  qualifierLead,
  reattribuerLead,
  refuserLead,
  relancerPro,
  validerCommande,
  type ChampsLead,
  type Qualification,
  type StatutAvancement,
} from "@/app/(app)/leads/actions";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Combobox, type OptionCombobox } from "@/components/ui/combobox";
import { Cote } from "@/components/ui/cote";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Attribution, FicheLead as DonneesFiche, Temperature } from "@/lib/data/types";
import { formatDuree } from "@/lib/format";
import { ilYa } from "@/lib/temps";
import { delaiDepasse } from "./gestion-leads";
import { SourcePicto } from "./source-picto";
import { EVENEMENTS_LEAD, MOTIFS_PERTE, MOTIFS_REFUS, QUALIFICATION, STATUTS_LEAD, TEMPERATURES, temperatureSuggeree } from "./statuts";

export type ModeFiche = "gestion" | "lecture" | "pro";

const dateHeure = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const ETAPES: { statut: StatutAvancement; label: string }[] = [
  { statut: "contacte", label: "Contacté" },
  { statut: "rdv", label: "Rendez-vous" },
  { statut: "devis", label: "Devis envoyé" },
  { statut: "signe", label: "Signé" },
  { statut: "pose", label: "Posé" },
];
const RANG: Record<string, number> = { accepte: -1, contacte: 0, rdv: 1, devis: 2, signe: 3, pose: 4 };

const PREFERE = { telephone: "Téléphone", email: "E-mail", sms: "SMS" } as const;

const textarea = "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none";

function BadgeAttribution({ a }: { a: Attribution }) {
  return a.type === "commercial" ? <NiveauBadge type="ATC" /> : a.niveau ? <NiveauBadge type={a.niveau} /> : <NiveauBadge type="Client" />;
}

/** Fiche d'un lead : Lead Manager (gestion), équipes internes et commercial (lecture), installateur (pro). */
export function FicheLead({ fiche, mode }: { fiche: DonneesFiche; mode: ModeFiche }) {
  const { lead, evenements, notes, candidats, enquetes, facturation } = fiche;
  const gestion = mode === "gestion";
  const pro = mode === "pro";
  const toast = useToast();
  const [pending, start] = useTransition();
  const [edition, setEdition] = useState(false);
  const [champs, setChamps] = useState<ChampsLead>({
    contact: lead.contact,
    telephone: lead.telephone ?? "",
    email: lead.email ?? "",
    adresse: lead.adresse ?? "",
    cp: lead.cp,
    ville: lead.ville ?? "",
    projet: lead.projet,
    message: lead.message ?? "",
    contactPrefere: lead.contactPrefere ?? "",
    grosProjet: lead.grosProjet,
  });
  const suggere = candidats.find((c) => c.suggere);
  const [choix, setChoix] = useState<string | null>(suggere ? `${suggere.type}:${suggere.id}` : null);
  const [message, setMessage] = useState("");
  const [interne, setInterne] = useState(!pro);
  const [q, setQ] = useState<Qualification>({
    temperature: lead.temperature ?? "tiede",
    nature: lead.natureProjet ?? "",
    echeance: lead.echeance ?? "",
    budget: lead.budget ?? "",
    typeBien: lead.typeBien ?? "",
  });
  const [refus, setRefus] = useState<string | null>(null);
  const [perte, setPerte] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [annulation, setAnnulation] = useState<{ faute: boolean; motif: string } | null>(null);
  const [commande, setCommande] = useState(lead.referenceCommande ?? "");

  const executer = (f: () => Promise<{ ok: boolean; message: string }>, apres?: () => void) =>
    start(async () => {
      const r = await f();
      toast(r.message);
      if (r.ok) apres?.();
    });

  const attribuable = gestion && (lead.statut === "a_valider" || lead.statut === "attribue");
  const enSuivi = ["accepte", "contacte", "rdv", "devis", "signe"].includes(lead.statut);
  const peutAvancer = (gestion || pro) && enSuivi;
  const ecoule = lead.attribueLe ? (Date.now() - new Date(lead.attribueLe).getTime()) / 60000 : 0;
  const reste = Math.max(0, lead.delaiMin - ecoule);
  const rang = RANG[lead.statut] ?? -1;
  const suggestion = q.echeance || q.budget || q.nature ? temperatureSuggeree(q.echeance, q.budget, q.nature) : null;
  const fil = notes.filter((n) => (pro ? !n.interne : true));

  const [famille, setFamille] = useState<"iap" | "atc" | "fenetrier" | "autre">(suggere?.famille ?? "iap");
  const nbFamille = (f: string) => candidats.filter((c) => c.famille === f).length;
  const options: OptionCombobox[] = candidats.filter((c) => c.famille === famille).map((c) => ({
    value: `${c.type}:${c.id}`,
    label: c.nom,
    groupe: c.groupe,
    detail:
      c.type === "compte"
        ? `${c.ville ?? "Ville inconnue"} (${c.departement ?? "?"}), ${c.leads30j} lead${c.leads30j > 1 ? "s" : ""} reçu${c.leads30j > 1 ? "s" : ""} sur 30 jours${c.suggere ? ", suggéré" : ""}`
        : `${c.ville ?? "Équipe"}, ${c.ecart} client${c.ecart > 1 ? "s" : ""} dans le département${c.suggere ? ", suggéré" : ""}`,
    prefixe: c.type === "commercial" ? <NiveauBadge type="ATC" /> : c.niveau ? <NiveauBadge type={c.niveau} /> : <NiveauBadge type="Client" />,
    desactive: lead.statut === "attribue" && c.type === "compte" && c.nom === lead.attribueA?.nom,
  }));

  const attribuer = () => {
    if (!choix) return;
    const [type, id] = choix.split(":");
    const compte = type === "compte" ? id : null;
    const commercial = type === "commercial" ? id : null;
    executer(() => (lead.statut === "attribue" ? reattribuerLead(lead.id, compte, commercial) : attribuerLead(lead.id, compte, commercial)));
  };

  const avancer = (statut: StatutAvancement) => {
    if (statut === "signe") return setSignature(lead.referenceCommande ?? "");
    executer(() => changerStatutLead(lead.id, statut));
  };

  const config = lead.configurationMaPorte;
  const titre = lead.masque ? lead.projet : lead.contact;

  return (
    <>
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        <ChevronLeft aria-hidden className="size-4" />
        {pro ? "Mes leads" : "Tous les leads"}
      </Link>
      <PageHeader
        title={titre}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUTS_LEAD[lead.statut].badge}>{STATUTS_LEAD[lead.statut].label}</Badge>
            {!pro && lead.temperature ? <Badge variant={TEMPERATURES[lead.temperature].badge}>{TEMPERATURES[lead.temperature].label}</Badge> : null}
            {delaiDepasse(lead) ? <Badge variant="danger">Délai dépassé</Badge> : null}
            {lead.grosProjet ? <Badge variant="warning">Gros projet</Badge> : null}
            {lead.creeParPro ? <Badge>Créé par l’installateur</Badge> : null}
            {lead.demo ? <Badge>Démonstration</Badge> : null}
          </span>
        }
        description={`${lead.reference}, ${lead.projet}${lead.ville ? ` à ${lead.ville}` : ""}`}
        actions={
          !lead.masque && lead.statut !== "a_valider" && lead.statut !== "perdu" ? (
            <ButtonLink href={`/configurateur?lead=${lead.id}`} variant="secondary">
              <Ruler aria-hidden />
              Faire le devis
            </ButtonLink>
          ) : null
        }
      />

      {/* Acceptation par l'installateur */}
      {pro && lead.statut === "attribue" ? (
        <Panel className="mb-8">
          <PanelBody className="flex flex-col gap-4">
            <Cote
              label="Délai d’acceptation"
              value={Math.min(ecoule, lead.delaiMin)}
              max={lead.delaiMin}
              tone={reste < lead.delaiMin * 0.3 ? "warning" : "accent"}
              valueLabel={reste > 0 ? `Encore ${formatDuree(reste)}` : "Délai dépassé"}
              startLabel="Attribué"
              endLabel="Retour au Lead Manager"
            />
            <p className="flex items-start gap-2 text-sm text-text-2">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-text-3" />
              Les coordonnées du client s’affichent dès que vous acceptez le lead.
            </p>
            {refus !== null ? (
              <div className="flex flex-wrap items-center gap-2">
                <Combobox id="motif-refus" size="sm" className="w-full sm:w-80" value={refus} onChange={setRefus} options={MOTIFS_REFUS.map((m) => ({ value: m, label: m }))} label="Motif du refus" />
                <Button size="sm" variant="danger" disabled={pending} onClick={() => executer(() => refuserLead(lead.id, refus))}>
                  Confirmer le refus
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRefus(null)}>
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled={pending || reste <= 0} onClick={() => executer(() => accepterLead(lead.id))}>
                  <Check aria-hidden />
                  Accepter le lead
                </Button>
                <Button variant="ghost" disabled={pending} onClick={() => setRefus(MOTIFS_REFUS[0])}>
                  <X aria-hidden />
                  Refuser
                </Button>
              </div>
            )}
          </PanelBody>
        </Panel>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Coordonnées et projet */}
          <Panel>
            <PanelHeader
              title="Client et projet"
              actions={
                gestion && !edition ? (
                  <Button size="sm" variant="ghost" onClick={() => setEdition(true)}>
                    <Pencil aria-hidden />
                    Modifier
                  </Button>
                ) : null
              }
            />
            <PanelBody>
              {edition ? (
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    executer(() => modifierLead(lead.id, champs), () => setEdition(false));
                  }}
                >
                  <Field label="Nom du client" htmlFor="f-contact" className="sm:col-span-2">
                    <Input id="f-contact" value={champs.contact} onChange={(e) => setChamps({ ...champs, contact: e.target.value })} required />
                  </Field>
                  <Field label="Téléphone" htmlFor="f-tel">
                    <Input id="f-tel" type="tel" value={champs.telephone} onChange={(e) => setChamps({ ...champs, telephone: e.target.value })} />
                  </Field>
                  <Field label="E-mail" htmlFor="f-email">
                    <Input id="f-email" type="email" value={champs.email} onChange={(e) => setChamps({ ...champs, email: e.target.value })} />
                  </Field>
                  <Field label="Contact préféré" htmlFor="f-pref" className="sm:col-span-2">
                    <Combobox
                      id="f-pref"
                      value={champs.contactPrefere}
                      onChange={(v) => setChamps({ ...champs, contactPrefere: v as ChampsLead["contactPrefere"] })}
                      options={[{ value: "", label: "Indifférent" }, ...Object.entries(PREFERE).map(([value, label]) => ({ value, label }))]}
                    />
                  </Field>
                  <Field label="Adresse" htmlFor="f-adresse" className="sm:col-span-2">
                    <Input id="f-adresse" value={champs.adresse} onChange={(e) => setChamps({ ...champs, adresse: e.target.value })} />
                  </Field>
                  <Field label="Code postal" htmlFor="f-cp" hint="Change la zone d’attribution">
                    <Input id="f-cp" inputMode="numeric" pattern="[0-9]{5}" value={champs.cp} onChange={(e) => setChamps({ ...champs, cp: e.target.value })} required />
                  </Field>
                  <Field label="Ville" htmlFor="f-ville">
                    <Input id="f-ville" value={champs.ville} onChange={(e) => setChamps({ ...champs, ville: e.target.value })} />
                  </Field>
                  <Field label="Projet" htmlFor="f-projet" className="sm:col-span-2">
                    <Input id="f-projet" value={champs.projet} onChange={(e) => setChamps({ ...champs, projet: e.target.value })} required />
                  </Field>
                  <Field label="Message du client" htmlFor="f-message" className="sm:col-span-2">
                    <textarea id="f-message" rows={3} value={champs.message} onChange={(e) => setChamps({ ...champs, message: e.target.value })} className={textarea} />
                  </Field>
                  <label className="flex items-center gap-2 text-sm font-medium text-text sm:col-span-2">
                    <input type="checkbox" checked={champs.grosProjet} onChange={(e) => setChamps({ ...champs, grosProjet: e.target.checked })} className="size-4 accent-[var(--accent)]" />
                    Gros projet (plusieurs portes, copropriété, prescription)
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <Button type="submit" variant="primary" disabled={pending}>
                      Enregistrer
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setEdition(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {lead.masque ? (
                    <div className="flex gap-3 rounded-md bg-sunken px-4 py-3 sm:col-span-2">
                      <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0 text-text-3" />
                      <p className="text-sm text-text-2">Nom, téléphone, e-mail et adresse du client sont masqués jusqu’à l’acceptation du lead.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3">
                        <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-text-3" />
                        <div className="min-w-0">
                          <dt className="text-xs text-text-3">Téléphone</dt>
                          <dd className="text-sm font-medium text-text">
                            {lead.telephone ? (
                              <a href={`tel:${lead.telephone.replace(/\s/g, "")}`} className="text-accent hover:underline">
                                {lead.telephone}
                              </a>
                            ) : (
                              "Non renseigné"
                            )}
                          </dd>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-text-3" />
                        <div className="min-w-0">
                          <dt className="text-xs text-text-3">E-mail</dt>
                          <dd className="truncate text-sm font-medium text-text">
                            {lead.email ? (
                              <a href={`mailto:${lead.email}`} className="text-accent hover:underline">
                                {lead.email}
                              </a>
                            ) : (
                              "Non renseigné"
                            )}
                          </dd>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex gap-3">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-text-3" />
                    <div className="min-w-0">
                      <dt className="text-xs text-text-3">Adresse du projet</dt>
                      <dd className="text-sm font-medium text-text">
                        {!lead.masque && lead.adresse ? `${lead.adresse}, ` : ""}
                        {lead.cp} {lead.ville}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <SourcePicto source={lead.source} />
                    <div className="min-w-0">
                      <dt className="text-xs text-text-3">Origine</dt>
                      <dd className="text-sm font-medium text-text" suppressHydrationWarning>
                        {lead.source}, reçu {ilYa(lead.recuLe)}
                        {lead.contactPrefere && !lead.masque ? `, préfère être contacté par ${PREFERE[lead.contactPrefere].toLowerCase()}` : ""}
                      </dd>
                    </div>
                  </div>
                  {lead.message ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-text-3">Message du client</dt>
                      <dd className="mt-1 whitespace-pre-line text-sm text-text">{lead.message}</dd>
                    </div>
                  ) : null}
                  {config ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-text-3">Configuration réalisée dans Ma Porte</dt>
                      <dd className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(config).map(([k, v]) => (
                          <span key={k} className="rounded-md bg-accent-soft px-2 text-sm leading-6 text-accent-strong">
                            {String(v)}
                            {k.endsWith("_cm") ? " cm" : ""}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </PanelBody>
          </Panel>

          {/* Échanges */}
          {!lead.masque ? (
            <Panel>
              <PanelHeader title="Échanges" description={pro ? "Avec Picard Serrures" : "Commentaires partagés avec l’installateur et notes internes"} />
              <PanelBody className="flex flex-col gap-4">
                {(
                  <form
                    className="flex flex-col gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!message.trim()) return;
                      executer(() => (interne ? ajouterNote(lead.id, message) : commenterLead(lead.id, message)), () => setMessage(""));
                    }}
                  >
                    <label htmlFor="message" className="sr-only">
                      Nouveau message
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder={interne ? "Note interne : jamais visible par l’installateur ni par le client" : "Message visible par l’installateur et par Picard"}
                      className={textarea}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      {!pro ? (
                        <Segmented
                          size="sm"
                          label="Visibilité"
                          value={interne ? "interne" : "partage"}
                          onChange={(v) => setInterne(v === "interne")}
                          options={[
                            { value: "interne", label: "Note interne" },
                            { value: "partage", label: "Partagé avec l’installateur" },
                          ]}
                        />
                      ) : null}
                      <Button type="submit" size="sm" variant="secondary" disabled={pending || !message.trim()}>
                        {interne ? <StickyNote aria-hidden /> : <MessageSquare aria-hidden />}
                        Publier
                      </Button>
                    </div>
                  </form>
                )}
                {fil.length ? (
                  <ul className="flex flex-col">
                    {fil.map((n) => (
                      <li key={n.id} className="border-t border-line py-3">
                        <p className="whitespace-pre-line text-sm text-text">{n.contenu}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-3">
                          {n.auteur ?? "Utilisateur"}, {dateHeure(n.creeLe)}
                          {!pro && n.interne ? <Badge>Interne</Badge> : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-3">Aucun échange pour l’instant.</p>
                )}
              </PanelBody>
            </Panel>
          ) : null}

          {/* Chronologie */}
          <Panel>
            <PanelHeader title="Chronologie" description={`${evenements.length} événement${evenements.length > 1 ? "s" : ""}`} />
            <PanelBody>
              <ol className="relative flex flex-col gap-4 border-l border-line pl-6">
                {evenements.map((e) => (
                  <li key={e.id} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -left-6 top-1 size-3 -translate-x-1/2 rounded-full border-2 border-surface",
                        e.statut === "signe" || e.statut === "pose" ? "bg-success" : e.statut === "perdu" || e.type === "refus" || e.type === "annulation" ? "bg-danger" : e.type === "relance" || e.type === "reattribution_auto" ? "bg-warning" : "bg-accent",
                      )}
                    />
                    <p className="text-sm font-semibold text-text">
                      {EVENEMENTS_LEAD[e.type] ?? e.type}
                      {e.type === "statut" && e.statut ? ` : ${STATUTS_LEAD[e.statut].label.toLowerCase()}` : ""}
                      {e.type === "qualification" && typeof e.details?.temperature === "string" && !pro ? ` : ${TEMPERATURES[e.details.temperature as Temperature]?.label.toLowerCase() ?? ""}` : ""}
                    </p>
                    <p className="text-xs text-text-3">
                      {dateHeure(e.creeLe)}
                      {e.compteNom ? `, ${e.compteNom}` : ""}
                      {typeof e.details?.motif === "string" ? `, motif : ${e.details.motif}` : ""}
                      {typeof e.details?.reference === "string" ? `, commande ${e.details.reference}` : ""}
                      {typeof e.details?.par === "string" && !pro ? `, par ${e.details.par}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          {/* Qualification */}
          {!pro ? (
            <Panel>
              <PanelHeader title="Qualification" description={lead.qualifieLe ? `Qualifié ${ilYa(lead.qualifieLe)}` : "Pas encore qualifié"} />
              <PanelBody className="flex flex-col gap-4">
                {gestion ? (
                  <>
                    <Field label="Nature du projet" htmlFor="q-nature">
                      <Combobox id="q-nature" value={q.nature || null} onChange={(v) => setQ({ ...q, nature: v })} placeholder="Choisir" options={QUALIFICATION.nature.map((x) => ({ value: x, label: x }))} />
                    </Field>
                    <Field label="Échéance" htmlFor="q-echeance">
                      <Combobox id="q-echeance" value={q.echeance || null} onChange={(v) => setQ({ ...q, echeance: v })} placeholder="Choisir" options={QUALIFICATION.echeance.map((x) => ({ value: x, label: x }))} />
                    </Field>
                    <Field label="Budget" htmlFor="q-budget">
                      <Combobox id="q-budget" value={q.budget || null} onChange={(v) => setQ({ ...q, budget: v })} placeholder="Choisir" options={QUALIFICATION.budget.map((x) => ({ value: x, label: x }))} />
                    </Field>
                    <Field label="Type de bien" htmlFor="q-bien">
                      <Combobox id="q-bien" value={q.typeBien || null} onChange={(v) => setQ({ ...q, typeBien: v })} placeholder="Choisir" options={QUALIFICATION.typeBien.map((x) => ({ value: x, label: x }))} />
                    </Field>
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-text">Température</span>
                      <Segmented
                        label="Température du lead"
                        value={q.temperature}
                        onChange={(v) => setQ({ ...q, temperature: v })}
                        options={[
                          { value: "froid", label: "Froid" },
                          { value: "tiede", label: "Tiède" },
                          { value: "chaud", label: "Chaud" },
                        ]}
                      />
                      {suggestion && suggestion !== q.temperature ? (
                        <button type="button" className="self-start text-xs text-accent hover:underline" onClick={() => setQ({ ...q, temperature: suggestion })}>
                          D’après ces réponses : {TEMPERATURES[suggestion].label.toLowerCase()}. Appliquer
                        </button>
                      ) : null}
                    </div>
                    <Button variant="secondary" disabled={pending} onClick={() => executer(() => qualifierLead(lead.id, q))} className="self-start">
                      <Check aria-hidden />
                      Enregistrer la qualification
                    </Button>
                  </>
                ) : (
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ["Nature", lead.natureProjet],
                      ["Échéance", lead.echeance],
                      ["Budget", lead.budget],
                      ["Bien", lead.typeBien],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-text-3">{k}</dt>
                        <dd className="font-medium text-text">{v ?? "–"}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </PanelBody>
            </Panel>
          ) : null}

          {/* Attribution */}
          {!pro ? (
            <Panel>
              <PanelHeader title="Attribution" description={attribuable ? "Candidats classés par zone et par niveau" : undefined} />
              <PanelBody className="flex flex-col gap-4">
                {lead.statut === "a_valider" ? (
                  lead.suggestion ? (
                    <div className="flex items-center justify-between gap-3 rounded-md bg-sunken px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs text-text-3">Suggestion automatique</p>
                        <p className="truncate font-semibold text-text">{lead.suggestion.nom}</p>
                      </div>
                      <BadgeAttribution a={lead.suggestion} />
                    </div>
                  ) : (
                    <p className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">Aucun installateur ni commercial suggéré : choisissez un destinataire.</p>
                  )
                ) : lead.attribueA ? (
                  <div className="flex items-center justify-between gap-3 rounded-md bg-sunken px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs text-text-3">{lead.statut === "attribue" ? "Attribué, en attente d’acceptation" : "Attribué à"}</p>
                      <p className="truncate font-semibold text-text">{lead.attribueA.nom}</p>
                      {lead.commercialNom && lead.attribueA.type === "compte" ? <p className="text-xs text-text-3">Commercial : {lead.commercialNom}</p> : null}
                    </div>
                    <BadgeAttribution a={lead.attribueA} />
                  </div>
                ) : null}

                {lead.statut === "attribue" ? (
                  <Cote
                    label="Délai d’acceptation"
                    value={Math.min(ecoule, lead.delaiMin)}
                    max={lead.delaiMin}
                    tone={reste <= 0 ? "danger" : reste < lead.delaiMin * 0.3 ? "warning" : "accent"}
                    valueLabel={reste > 0 ? `Encore ${formatDuree(reste)}` : "Délai dépassé"}
                    startLabel="Attribué"
                    endLabel="Retour au Lead Manager"
                  />
                ) : null}

                {attribuable ? (
                  <>
                    <div className="overflow-x-auto">
                      <Segmented
                        size="sm"
                        label="Type de destinataire"
                        value={famille}
                        onChange={setFamille}
                        options={[
                          { value: "iap", label: "IAP", count: nbFamille("iap") },
                          { value: "atc", label: "ATC", count: nbFamille("atc") },
                          { value: "fenetrier", label: "Fenêtriers", count: nbFamille("fenetrier") },
                          { value: "autre", label: "Autres", count: nbFamille("autre") },
                        ]}
                      />
                    </div>
                    <Field label={lead.statut === "attribue" ? "Réattribuer à" : "Attribuer à"} htmlFor="destinataire">
                      <Combobox
                        id="destinataire"
                        options={options}
                        value={options.some((o) => o.value === choix) ? choix : null}
                        onChange={setChoix}
                        placeholder={famille === "atc" ? "Choisir un commercial" : options.length ? "Choisir un destinataire" : "Aucun candidat dans cette catégorie"}
                        recherche
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" disabled={pending || !choix || !options.some((o) => o.value === choix)} onClick={attribuer}>
                        <Check aria-hidden />
                        {lead.statut === "attribue" ? "Réattribuer" : "Attribuer"}
                      </Button>
                      {lead.statut === "attribue" ? (
                        <Button variant="secondary" disabled={pending} onClick={() => executer(() => relancerPro(lead.id))}>
                          <BellRing aria-hidden />
                          Relancer
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-xs text-text-3">L’installateur et son commercial reçoivent un e-mail et un SMS à l’attribution.</p>
                  </>
                ) : gestion && ["accepte", "contacte", "rdv", "devis"].includes(lead.statut) ? (
                  <Button variant="secondary" disabled={pending} onClick={() => executer(() => relancerPro(lead.id))} className="self-start">
                    <BellRing aria-hidden />
                    Relancer l’installateur
                  </Button>
                ) : null}
              </PanelBody>
            </Panel>
          ) : null}

          {/* Avancement */}
          {lead.statut !== "a_valider" && lead.statut !== "attribue" ? (
            <Panel>
              <PanelHeader title="Avancement" description={lead.statut === "perdu" && lead.motifPerte ? `Perdu : ${lead.motifPerte}` : undefined} />
              <PanelBody className="flex flex-col gap-4">
                <ol className="flex flex-wrap gap-2">
                  {ETAPES.map((e, i) => (
                    <li key={e.statut}>
                      <Button
                        size="sm"
                        variant={i === rang + 1 && peutAvancer ? "primary" : "secondary"}
                        disabled={pending || !peutAvancer || i <= rang}
                        onClick={() => avancer(e.statut)}
                      >
                        {i <= rang ? <Check aria-hidden /> : e.statut === "devis" ? <Send aria-hidden /> : null}
                        {e.label}
                      </Button>
                    </li>
                  ))}
                </ol>

                {signature !== null ? (
                  <div className="flex flex-col gap-2 rounded-md bg-sunken p-4">
                    <Field label="Référence de la commande Picard" htmlFor="ref-commande" hint="Facultatif : elle permet de rattacher la vente au lead">
                      <Input id="ref-commande" value={signature} onChange={(e) => setSignature(e.target.value)} />
                    </Field>
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" disabled={pending} onClick={() => executer(() => changerStatutLead(lead.id, "signe", undefined, signature), () => setSignature(null))}>
                        Confirmer la signature
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSignature(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : null}

                {peutAvancer && lead.statut !== "signe" ? (
                  perte !== null ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Combobox id="motif-perte" size="sm" className="w-full sm:w-80" value={perte} onChange={setPerte} options={MOTIFS_PERTE.map((m) => ({ value: m, label: m }))} label="Motif de la perte" />
                      <Button size="sm" variant="danger" disabled={pending} onClick={() => executer(() => changerStatutLead(lead.id, "perdu", perte), () => setPerte(null))}>
                        Classer perdu
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPerte(null)}>
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="self-start" disabled={pending} onClick={() => setPerte(MOTIFS_PERTE[0])}>
                      Projet perdu
                    </Button>
                  )
                ) : null}

                {gestion && ["accepte", "contacte", "rdv", "devis"].includes(lead.statut) ? (
                  annulation ? (
                    <div className="flex flex-col gap-3 rounded-md bg-sunken p-4">
                      <Segmented
                        size="sm"
                        label="Responsabilité"
                        value={annulation.faute ? "installateur" : "client"}
                        onChange={(v) => setAnnulation({ ...annulation, faute: v === "installateur" })}
                        options={[
                          { value: "installateur", label: "Faute de l’installateur" },
                          { value: "client", label: "Le client renonce" },
                        ]}
                      />
                      <Field label="Motif" htmlFor="motif-annulation" hint={annulation.faute ? "Le lead revient dans la file pour être réattribué" : "Le lead est classé perdu"}>
                        <Input id="motif-annulation" value={annulation.motif} onChange={(e) => setAnnulation({ ...annulation, motif: e.target.value })} />
                      </Field>
                      <div className="flex gap-2">
                        <Button size="sm" variant="danger" disabled={pending || !annulation.motif.trim()} onClick={() => executer(() => annulerLead(lead.id, annulation.faute, annulation.motif), () => setAnnulation(null))}>
                          Annuler le lead
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAnnulation(null)}>
                          Fermer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="self-start" onClick={() => setAnnulation({ faute: true, motif: "" })}>
                      <Ban aria-hidden />
                      Annuler le lead
                    </Button>
                  )
                ) : null}

                {/* Commande rattachée */}
                {!pro && lead.statut !== "perdu" && lead.attribueA ? (
                  <div className="flex flex-col gap-2 border-t border-line pt-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-text">
                      <Package aria-hidden className="size-4 text-text-3" />
                      Commande Picard
                      {lead.referenceValideeLe ? <Badge variant="success">Validée</Badge> : lead.referenceCommande ? <Badge variant="warning">À vérifier</Badge> : null}
                    </p>
                    <p className="text-xs text-text-3">Code à reporter sur la commande : {lead.reference}</p>
                    {gestion ? (
                      <div className="flex flex-wrap gap-2">
                        <Input aria-label="Référence de la commande" value={commande} onChange={(e) => setCommande(e.target.value)} placeholder="Numéro de commande" className="w-full sm:w-60" />
                        <Button size="sm" variant="secondary" disabled={pending || !commande.trim()} onClick={() => executer(() => validerCommande(lead.id, commande))}>
                          Valider la commande
                        </Button>
                      </div>
                    ) : lead.referenceCommande ? (
                      <p className="text-sm text-text">{lead.referenceCommande}</p>
                    ) : null}
                  </div>
                ) : null}

                {facturation && !pro ? (
                  <p className="border-t border-line pt-4 text-sm text-text-2">
                    Facturation :{" "}
                    {facturation.statut === "offert"
                      ? `offert (${facturation.motif ?? "remise"})`
                      : facturation.statut === "rembourse"
                        ? `${facturation.montant.toFixed(2)} € remboursés après la vente`
                        : `${facturation.montant.toFixed(2)} €${facturation.remisePct ? ` après ${facturation.remisePct} % de remise` : ""}`}
                  </p>
                ) : null}
              </PanelBody>
            </Panel>
          ) : null}

          {/* Satisfaction */}
          {!pro && lead.statut !== "a_valider" && lead.statut !== "attribue" ? (
            <Panel>
              <PanelHeader title="Satisfaction" description="Enquête NPS : recommanderiez-vous… ? de 0 à 10" />
              <ul>
                {(["client", "installateur"] as const).map((cible) => {
                  const e = enquetes.find((x) => x.cible === cible);
                  return (
                    <li key={cible} className="flex flex-wrap items-center gap-3 border-t border-line px-6 py-4">
                      <Smile aria-hidden className="size-4 text-text-3" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text">{cible === "client" ? "Client final" : "Installateur"}</p>
                        <p className="text-xs text-text-3">
                          {!e
                            ? "Pas encore envoyée"
                            : e.reponduLe
                              ? `Note ${e.note} sur 10${e.commentaire ? `, « ${e.commentaire} »` : ""}`
                              : `Envoyée ${ilYa(e.envoyeeLe)}${e.relances ? `, ${e.relances} relance${e.relances > 1 ? "s" : ""}` : ""}, sans réponse`}
                        </p>
                      </div>
                      {e?.reponduLe ? (
                        <Badge variant={(e.note ?? 0) >= 9 ? "success" : (e.note ?? 0) >= 7 ? "neutral" : "danger"}>{e.note}</Badge>
                      ) : gestion ? (
                        <Button size="sm" variant="secondary" disabled={pending || (cible === "installateur" && lead.attribueA?.type !== "compte")} onClick={() => executer(() => envoyerEnquete(lead.id, cible))}>
                          <Send aria-hidden />
                          {e ? "Relancer" : "Envoyer"}
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
