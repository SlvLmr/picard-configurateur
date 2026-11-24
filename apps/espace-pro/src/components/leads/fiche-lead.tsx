"use client";

import { BellRing, Check, ChevronLeft, Mail, MapPin, Pencil, Phone, Ruler, StickyNote } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ajouterNote, attribuerLead, modifierLead, reattribuerLead, relancerPro, type ChampsLead } from "@/app/(app)/leads/actions";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Combobox, type OptionCombobox } from "@/components/ui/combobox";
import { Cote } from "@/components/ui/cote";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Attribution, FicheLead as DonneesFiche } from "@/lib/data/types";
import { formatDuree } from "@/lib/format";
import { ilYa } from "@/lib/temps";
import { delaiDepasse } from "./gestion-leads";
import { SourcePicto } from "./source-picto";
import { EVENEMENTS_LEAD, STATUTS_LEAD } from "./statuts";

const dateHeure = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function BadgeAttribution({ a }: { a: Attribution }) {
  return a.type === "commercial" ? <NiveauBadge type="ATC" /> : a.niveau ? <NiveauBadge type={a.niveau} /> : <NiveauBadge type="Client" />;
}

/** Fiche d'un lead pour les équipes internes : détail, attribution par zone, chronologie et notes. */
export function FicheLead({ fiche, peutGerer }: { fiche: DonneesFiche; peutGerer: boolean }) {
  const { lead, evenements, notes, candidats } = fiche;
  const toast = useToast();
  const [pending, start] = useTransition();
  const [edition, setEdition] = useState(false);
  const [champs, setChamps] = useState<ChampsLead>({
    contact: lead.contact,
    telephone: lead.telephone ?? "",
    email: lead.email ?? "",
    cp: lead.cp,
    ville: lead.ville ?? "",
    projet: lead.projet,
    grosProjet: lead.grosProjet,
  });
  const suggere = candidats.find((c) => c.suggere);
  const [choix, setChoix] = useState<string | null>(suggere ? `${suggere.type}:${suggere.id}` : null);
  const [note, setNote] = useState("");

  const executer = (f: () => Promise<{ ok: boolean; message: string }>, apres?: () => void) =>
    start(async () => {
      const r = await f();
      toast(r.message);
      if (r.ok) apres?.();
    });

  const attribuable = peutGerer && (lead.statut === "a_valider" || lead.statut === "attribue");
  const ecoule = lead.attribueLe ? (Date.now() - new Date(lead.attribueLe).getTime()) / 60000 : 0;
  const reste = Math.max(0, lead.delaiMin - ecoule);

  const options: OptionCombobox[] = candidats.map((c) => ({
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

  const config = lead.configurationMaPorte;

  return (
    <>
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        <ChevronLeft aria-hidden className="size-4" />
        Tous les leads
      </Link>
      <PageHeader
        title={lead.contact}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUTS_LEAD[lead.statut].badge}>{STATUTS_LEAD[lead.statut].label}</Badge>
            {delaiDepasse(lead) ? <Badge variant="danger">Délai dépassé</Badge> : null}
            {lead.grosProjet ? <Badge variant="warning">Gros projet</Badge> : null}
            {lead.demo ? <Badge>Démonstration</Badge> : null}
          </span>
        }
        description={`${lead.reference}, ${lead.projet}`}
        actions={
          lead.statut !== "a_valider" ? (
            <ButtonLink href={`/configurateur?lead=${lead.id}`} variant="secondary">
              <Ruler aria-hidden />
              Ouvrir le configurateur
            </ButtonLink>
          ) : null
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Coordonnées et projet */}
          <Panel>
            <PanelHeader
              title="Coordonnées et projet"
              actions={
                peutGerer && !edition ? (
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
                  <Field label="Contact" htmlFor="f-contact" className="sm:col-span-2">
                    <Input id="f-contact" value={champs.contact} onChange={(e) => setChamps({ ...champs, contact: e.target.value })} required />
                  </Field>
                  <Field label="Téléphone" htmlFor="f-tel">
                    <Input id="f-tel" type="tel" value={champs.telephone} onChange={(e) => setChamps({ ...champs, telephone: e.target.value })} />
                  </Field>
                  <Field label="E-mail" htmlFor="f-email">
                    <Input id="f-email" type="email" value={champs.email} onChange={(e) => setChamps({ ...champs, email: e.target.value })} />
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
                  <div className="flex gap-3">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-text-3" />
                    <div className="min-w-0">
                      <dt className="text-xs text-text-3">Adresse du projet</dt>
                      <dd className="text-sm font-medium text-text">
                        {lead.cp} {lead.ville}, département {lead.departement}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <SourcePicto source={lead.source} />
                    <div className="min-w-0">
                      <dt className="text-xs text-text-3">Source</dt>
                      <dd className="text-sm font-medium text-text" suppressHydrationWarning>
                        {lead.source}, reçu {ilYa(lead.recuLe)}
                      </dd>
                    </div>
                  </div>
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
                        e.statut === "signe" ? "bg-success" : e.statut === "perdu" || e.type === "refus" ? "bg-danger" : e.type === "relance" ? "bg-warning" : "bg-accent",
                      )}
                    />
                    <p className="text-sm font-semibold text-text">
                      {EVENEMENTS_LEAD[e.type] ?? e.type}
                      {e.type === "statut" && e.statut ? ` : ${STATUTS_LEAD[e.statut].label.toLowerCase()}` : ""}
                    </p>
                    <p className="text-xs text-text-3">
                      {dateHeure(e.creeLe)}
                      {e.compteNom ? `, ${e.compteNom}` : ""}
                      {typeof e.details?.motif === "string" ? `, motif : ${e.details.motif}` : ""}
                      {typeof e.details?.par === "string" ? `, par ${e.details.par}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          {/* Attribution */}
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
                  <p className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">Aucun professionnel ni commercial suggéré : choisissez un destinataire.</p>
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
                  endLabel="Réattribution"
                />
              ) : null}

              {attribuable ? (
                <>
                  <Field label={lead.statut === "attribue" ? "Réattribuer à" : "Attribuer à"} htmlFor="destinataire">
                    <Combobox id="destinataire" options={options} value={choix} onChange={setChoix} placeholder="Choisir un professionnel ou un commercial" recherche />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" disabled={pending || !choix} onClick={attribuer}>
                      <Check aria-hidden />
                      {lead.statut === "attribue" ? "Réattribuer" : "Attribuer"}
                    </Button>
                    {lead.statut === "attribue" ? (
                      <Button variant="secondary" disabled={pending} onClick={() => executer(() => relancerPro(lead.id))}>
                        <BellRing aria-hidden />
                        Relancer le professionnel
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-text-3">
                    Départements voisins estimés d’après la proximité des numéros de département, en attendant la géolocalisation.
                  </p>
                </>
              ) : peutGerer && ["accepte", "contacte", "devis"].includes(lead.statut) ? (
                <Button variant="secondary" disabled={pending} onClick={() => executer(() => relancerPro(lead.id))} className="self-start">
                  <BellRing aria-hidden />
                  Relancer le professionnel
                </Button>
              ) : null}
            </PanelBody>
          </Panel>

          {/* Notes internes */}
          <Panel>
            <PanelHeader title="Notes internes" description="Jamais visibles par le client ni par le professionnel" />
            <PanelBody className="flex flex-col gap-4">
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (note.trim()) executer(() => ajouterNote(lead.id, note), () => setNote(""));
                }}
              >
                <label htmlFor="note" className="sr-only">
                  Nouvelle note
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Ajouter une information utile : préférence d’horaire, budget, contexte…"
                  className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none"
                />
                <Button type="submit" size="sm" variant="secondary" disabled={pending || !note.trim()} className="self-start">
                  <StickyNote aria-hidden />
                  Ajouter la note
                </Button>
              </form>
              {notes.length ? (
                <ul className="flex flex-col">
                  {notes.map((n) => (
                    <li key={n.id} className="border-t border-line py-3">
                      <p className="whitespace-pre-line text-sm text-text">{n.contenu}</p>
                      <p className="mt-1 text-xs text-text-3">
                        {n.auteur ?? "Utilisateur"}, {dateHeure(n.creeLe)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-3">Aucune note pour l’instant.</p>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}
