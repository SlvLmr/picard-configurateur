"use client";

import { Camera, Check, FileText, Lock, Send, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  affecterDemande,
  changerStatut,
  deciderDemande,
  enregistrerFichier,
  envoyerMessage,
  qualifierDemande,
  resoudreDemande,
  type ResultatSav,
} from "@/app/(app)/sav/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { DemandeSav, EvenementSav, FichierSav, Intervenant, MessageSav } from "@/lib/data/sav";
import type { RoleId } from "@/lib/roles";
import { supabaseNavigateur } from "@/lib/supabase/client";
import { Frise, StatutBadge, Textarea, TypePicto, dateCourte, dateHeure, tailleLisible } from "./elements";
import { CAUSES, DECISIONS, RESOLUTIONS, STATUTS, TYPES, type SavDecision, type SavResolution } from "./libelles";
import { useRoleVue } from "./vue-sav";

type Props = {
  demande: DemandeSav;
  messages: MessageSav[];
  fichiers: FichierSav[];
  evenements: EvenementSav[];
  intervenants: Intervenant[];
  role: RoleId;
};

const LIBELLES_EVENEMENT: Record<string, string> = {
  declaration: "Demande déposée",
  affectation: "Responsable modifié",
  decision: "Décision prise",
  resolution: "Demande résolue",
  qualification: "Qualification qualité",
  message: "Message",
  fichier: "Fichier ajouté",
};

/** Exécute une action serveur, affiche le résultat et rafraîchit la page. */
function useAction() {
  const toast = useToast();
  const router = useRouter();
  const [enCours, start] = useTransition();
  const lancer = (f: () => Promise<ResultatSav>, apres?: () => void) =>
    start(async () => {
      const r = await f();
      toast(r.message);
      if (r.ok) {
        apres?.();
        router.refresh();
      }
    });
  return { enCours, lancer };
}

export function FicheDemande({ demande: d, messages, fichiers, evenements, intervenants, role }: Props) {
  const { roleVue, apercu } = useRoleVue(role);
  const client = roleVue === "client_gerant" || roleVue === "client_equipe";
  const peutTraiter = !apercu && (roleVue === "admin" || roleVue === "sav");
  const peutQualifier = !apercu && (roleVue === "admin" || roleVue === "sav" || roleVue === "qualite");
  const estBE = !apercu && roleVue === "bureau_etudes";
  const fermee = d.statut === "cloturee";
  const visiblesMessages = client ? messages.filter((m) => !m.interne) : messages;
  const responsable = intervenants.find((i) => i.id === d.affecteA);

  return (
    <>
      <p className="mb-4 text-sm">
        <Link href="/sav" className="font-medium text-accent hover:underline">
          Toutes les demandes
        </Link>
      </p>
      <PageHeader
        title={d.reference}
        meta={
          <>
            <StatutBadge statut={d.statut} />
            {d.demo ? <Badge>Démo</Badge> : null}
            {apercu ? <Badge variant="warning">Aperçu</Badge> : null}
          </>
        }
        description={`${TYPES[d.type].label}${d.compteNom && !client ? `, ${d.compteNom}` : ""}. ${client ? STATUTS[d.statut].client : ""}`}
      />

      <Panel className="mb-8">
        <PanelBody className="pt-6">
          <Frise statut={d.statut} refusee={d.decision === "garantie_refusee"} />
        </PanelBody>
      </Panel>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">
          <Panel>
            <PanelHeader title="Description" description={`Déposée le ${dateCourte(d.creeLe)}${d.declarantNom ? ` par ${d.declarantNom}` : ""}`} />
            <PanelBody>
              <div className="flex gap-3">
                <TypePicto type={d.type} size="md" />
                <p className="whitespace-pre-line text-sm text-text">{d.description}</p>
              </div>
            </PanelBody>
          </Panel>

          <FilEchanges demandeId={d.id} messages={visiblesMessages} interneAutorise={!client} ferme={fermee || apercu} />

          <PhotosVideos demandeId={d.id} fichiers={fichiers} peutAjouter={!fermee && !apercu} />
        </div>

        <div className="flex flex-col gap-8">
          {peutTraiter && !fermee ? <ActionsSav d={d} intervenants={intervenants} /> : null}
          {estBE && d.statut === "avis_technique" ? <AvisTechnique demandeId={d.id} /> : null}

          <Panel>
            <PanelHeader title="Détails" />
            <PanelBody>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-sm">
                {!client && d.compteNom ? (
                  <>
                    <dt className="text-text-3">Client</dt>
                    <dd className="font-medium text-text">
                      <Link href={`/crm/${d.compteId}`} className="hover:text-accent">
                        {d.compteNom}
                      </Link>
                    </dd>
                  </>
                ) : null}
                <Ligne label="Gamme" valeur={d.gamme} />
                <Ligne label="Produit" valeur={d.produit} />
                <Ligne label="Référence" valeur={d.referenceProduit} />
                <Ligne label="Commande d’origine" valeur={d.numeroCommande} />
                <Ligne label="Numéro de série" valeur={d.numeroSerie} />
                <Ligne label="Chantier" valeur={d.adresseChantier} />
                {!client ? <Ligne label="Responsable" valeur={responsable?.nom || (d.affecteA ? "Affectée" : "Non affectée")} /> : null}
                <Ligne label="Décision" valeur={d.decision ? DECISIONS[d.decision] : null} />
                <Ligne label="Motif" valeur={d.decisionMotif} />
                <Ligne label="Résolution" valeur={d.resolution ? RESOLUTIONS[d.resolution] : null} />
                <Ligne label="Bon de retour" valeur={d.bonRetour} />
                <Ligne
                  label="Avoir"
                  valeur={d.avoirReference ? `${d.avoirReference}, ${d.avoirMontant?.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}` : null}
                />
              </dl>
            </PanelBody>
          </Panel>

          {!client ? <Qualite d={d} modifiable={peutQualifier} /> : null}

          <Panel>
            <PanelHeader title="Historique" />
            <ol>
              {evenements
                .filter((e) => e.type !== "message")
                .map((e) => (
                  <li key={e.id} className="flex items-baseline gap-3 border-t border-line px-6 py-3 text-sm">
                    <span className="tabular w-40 shrink-0 text-xs text-text-3" suppressHydrationWarning>
                      {dateHeure(e.creeLe)}
                    </span>
                    <span className="text-text">{e.type === "statut" && e.statut ? STATUTS[e.statut].label : (LIBELLES_EVENEMENT[e.type] ?? e.type)}</span>
                  </li>
                ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string | null | undefined }) {
  if (!valeur) return null;
  return (
    <>
      <dt className="text-text-3">{label}</dt>
      <dd className="text-text">{valeur}</dd>
    </>
  );
}

/* ─────────────────────────── Fil d'échanges ─────────────────────────── */
function FilEchanges({ demandeId, messages, interneAutorise, ferme }: { demandeId: string; messages: MessageSav[]; interneAutorise: boolean; ferme: boolean }) {
  const { enCours, lancer } = useAction();
  const [texte, setTexte] = useState("");
  const [interne, setInterne] = useState(false);

  return (
    <Panel>
      <PanelHeader title="Fil d’échanges" description={interneAutorise ? "Les notes internes ne sont pas visibles par le client" : undefined} />
      {messages.length ? (
        <ol>
          {messages.map((m) => (
            <li key={m.id} className={cn("border-t border-line px-6 py-4", m.interne && "bg-sunken")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-text">{m.deMoi ? "Vous" : m.auteurNom}</span>
                {m.interne ? (
                  <Badge>
                    <Lock aria-hidden />
                    Note interne
                  </Badge>
                ) : null}
                <span className="ml-auto text-xs text-text-3" suppressHydrationWarning>
                  {dateHeure(m.creeLe)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-text-2">{m.contenu}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-t border-line px-6 py-6 text-sm text-text-2">Aucun échange pour l’instant.</p>
      )}
      {!ferme ? (
        <form
          className="border-t border-line px-6 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            lancer(() => envoyerMessage(demandeId, texte, interne), () => setTexte(""));
          }}
        >
          <label htmlFor={`msg-${demandeId}`} className="sr-only">
            Votre message
          </label>
          <Textarea id={`msg-${demandeId}`} rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Écrire un message" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {interneAutorise ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-text-2">
                <input type="checkbox" checked={interne} onChange={(e) => setInterne(e.target.checked)} className="size-4 accent-[var(--accent)]" />
                Note interne
              </label>
            ) : null}
            <Button type="submit" className="ml-auto" disabled={enCours || !texte.trim()}>
              <Send aria-hidden />
              {interne ? "Ajouter la note" : "Envoyer"}
            </Button>
          </div>
        </form>
      ) : null}
    </Panel>
  );
}

/* ─────────────────────────── Photos et vidéos ─────────────────────────── */
function PhotosVideos({ demandeId, fichiers, peutAjouter }: { demandeId: string; fichiers: FichierSav[]; peutAjouter: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const saisie = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);

  const deposer = async (liste: FileList | null) => {
    if (!liste?.length) return;
    setEnvoi(true);
    const supabase = supabaseNavigateur();
    let ok = 0;
    for (const f of Array.from(liste).slice(0, 10)) {
      if (!(f.type.startsWith("image/") || f.type.startsWith("video/")) || f.size > 200 * 1024 * 1024) continue;
      const nom = f.name.normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-80);
      const chemin = `${demandeId}/${crypto.randomUUID()}-${nom}`;
      const { error } = await supabase.storage.from("ep-sav").upload(chemin, f, { contentType: f.type });
      if (!error && (await enregistrerFichier(demandeId, chemin, f.name, f.type, f.size)).ok) ok++;
    }
    setEnvoi(false);
    toast(ok ? `${ok} fichier${ok > 1 ? "s" : ""} ajouté${ok > 1 ? "s" : ""}` : "Aucun fichier n’a pu être ajouté. Photos et vidéos de moins de 200 Mo uniquement.");
    router.refresh();
  };

  return (
    <Panel>
      <PanelHeader
        title="Photos et vidéos"
        description={fichiers.length ? `${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""}` : undefined}
        actions={
          peutAjouter ? (
            <>
              <input
                ref={saisie}
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  deposer(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button size="sm" onClick={() => saisie.current?.click()} disabled={envoi}>
                <Camera aria-hidden />
                {envoi ? "Envoi en cours" : "Ajouter"}
              </Button>
            </>
          ) : null
        }
      />
      <PanelBody>
        {fichiers.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fichiers.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-md border border-line bg-sunken"
                  aria-label={`Ouvrir ${f.nom}`}
                >
                  {f.url && f.typeMime?.startsWith("image/") ? (
                    // Lien signé temporaire : pas d'optimisation d'image
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt={f.nom} className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90" />
                  ) : (
                    <span className="grid aspect-square place-items-center text-text-3">
                      {f.typeMime?.startsWith("video/") ? <Video className="size-6" aria-hidden /> : <FileText className="size-6" aria-hidden />}
                    </span>
                  )}
                </a>
                <p className="mt-1 truncate text-xs text-text-2">{f.nom}</p>
                <p className="text-xs text-text-3">{tailleLisible(f.tailleOctets)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-2">Aucun fichier joint.</p>
        )}
      </PanelBody>
    </Panel>
  );
}

/* ─────────────────────────── Actions du service SAV ─────────────────────────── */
type Onglet = "infos" | "avis" | "decision" | "resolution" | "affectation";

function ActionsSav({ d, intervenants }: { d: DemandeSav; intervenants: Intervenant[] }) {
  const { enCours, lancer } = useAction();
  const decidee = !!d.decision;
  const resolue = d.statut === "resolue";
  const onglets: { value: Onglet; label: string }[] = resolue
    ? [{ value: "affectation", label: "Responsable" }]
    : [
        { value: "infos", label: "Informations" },
        { value: "avis", label: "Avis BE" },
        ...(decidee ? [{ value: "resolution" as const, label: "Résolution" }] : [{ value: "decision" as const, label: "Décision" }]),
        { value: "affectation", label: "Responsable" },
      ];
  const [onglet, setOnglet] = useState<Onglet>(onglets[0].value);
  const [texte, setTexte] = useState("");
  const [decision, setDecision] = useState<SavDecision>("garantie_acceptee");
  const [resolution, setResolution] = useState<SavResolution>("piece_envoyee");
  const [avoirRef, setAvoirRef] = useState("");
  const [avoirMontant, setAvoirMontant] = useState("");
  const [bonRetour, setBonRetour] = useState("");
  const [qui, setQui] = useState(d.affecteA ?? "");
  const vider = () => setTexte("");

  return (
    <Panel>
      <PanelHeader title="Traiter la demande" />
      <PanelBody className="flex flex-col gap-4">
        {d.statut === "nouvelle" ? (
          <Button variant="primary" size="lg" disabled={enCours} onClick={() => lancer(() => changerStatut(d.id, "en_analyse", ""))}>
            <Check aria-hidden />
            Prendre en charge
          </Button>
        ) : null}
        {resolue ? (
          <Button variant="primary" size="lg" disabled={enCours} onClick={() => lancer(() => changerStatut(d.id, "cloturee", ""))}>
            <Check aria-hidden />
            Clôturer la demande
          </Button>
        ) : null}

        <Segmented label="Action" size="sm" value={onglet} onChange={setOnglet} options={onglets} />

        {onglet === "infos" ? (
          <>
            <Field label="Informations attendues du client" htmlFor="sav-infos" hint="Le client reçoit ce message et la demande passe en attente de sa réponse.">
              <Textarea id="sav-infos" rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} />
            </Field>
            <Button disabled={enCours || !texte.trim()} onClick={() => lancer(() => changerStatut(d.id, "infos_demandees", texte), vider)}>
              Demander les informations
            </Button>
          </>
        ) : null}

        {onglet === "avis" ? (
          <>
            <Field label="Question au bureau d’études" htmlFor="sav-avis" hint="Note interne, non visible par le client.">
              <Textarea id="sav-avis" rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} />
            </Field>
            <Button disabled={enCours || d.statut === "avis_technique"} onClick={() => lancer(() => changerStatut(d.id, "avis_technique", texte), vider)}>
              {d.statut === "avis_technique" ? "Avis déjà demandé" : "Demander un avis technique"}
            </Button>
          </>
        ) : null}

        {onglet === "decision" ? (
          <>
            <Field label="Décision" htmlFor="sav-decision">
              <Select id="sav-decision" value={decision} onChange={(e) => setDecision(e.target.value as SavDecision)}>
                {(Object.keys(DECISIONS) as SavDecision[]).map((k) => (
                  <option key={k} value={k}>
                    {DECISIONS[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={decision === "garantie_refusee" ? "Motif du refus" : "Précision pour le client (facultatif)"}
              htmlFor="sav-motif"
              hint="Ce texte est communiqué au client."
            >
              <Textarea id="sav-motif" rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} />
            </Field>
            <Button disabled={enCours} onClick={() => lancer(() => deciderDemande(d.id, decision, texte), vider)}>
              Enregistrer la décision
            </Button>
          </>
        ) : null}

        {onglet === "resolution" ? (
          <>
            <Field label="Solution apportée" htmlFor="sav-resolution">
              <Select id="sav-resolution" value={resolution} onChange={(e) => setResolution(e.target.value as SavResolution)}>
                {(Object.keys(RESOLUTIONS) as SavResolution[]).map((k) => (
                  <option key={k} value={k}>
                    {RESOLUTIONS[k]}
                  </option>
                ))}
              </Select>
            </Field>
            {resolution === "avoir" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Référence de l’avoir" htmlFor="sav-avoir-ref" hint="Émis dans Navision">
                  <Input id="sav-avoir-ref" value={avoirRef} onChange={(e) => setAvoirRef(e.target.value)} />
                </Field>
                <Field label="Montant en euros" htmlFor="sav-avoir-montant">
                  <Input id="sav-avoir-montant" inputMode="decimal" value={avoirMontant} onChange={(e) => setAvoirMontant(e.target.value)} />
                </Field>
              </div>
            ) : null}
            {resolution === "retour_produit" ? (
              <Field label="Numéro du bon de retour" htmlFor="sav-bon-retour">
                <Input id="sav-bon-retour" value={bonRetour} onChange={(e) => setBonRetour(e.target.value)} />
              </Field>
            ) : null}
            <Field label="Message au client (facultatif)" htmlFor="sav-commentaire">
              <Textarea id="sav-commentaire" rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} />
            </Field>
            <Button
              disabled={enCours}
              onClick={() =>
                lancer(() => resoudreDemande(d.id, { resolution, commentaire: texte, avoirReference: avoirRef, avoirMontant, bonRetour }), vider)
              }
            >
              Marquer comme résolue
            </Button>
          </>
        ) : null}

        {onglet === "affectation" ? (
          <>
            <Field label="Responsable de la demande" htmlFor="sav-qui" hint={intervenants.length ? undefined : "Aucune personne avec un rôle SAV, bureau d’études ou qualité pour l’instant."}>
              <Select id="sav-qui" value={qui} onChange={(e) => setQui(e.target.value)}>
                <option value="">Personne</option>
                {intervenants.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nom || "Sans nom"}
                  </option>
                ))}
              </Select>
            </Field>
            <Button disabled={enCours || qui === (d.affecteA ?? "")} onClick={() => lancer(() => affecterDemande(d.id, qui || null))}>
              Enregistrer le responsable
            </Button>
          </>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

function AvisTechnique({ demandeId }: { demandeId: string }) {
  const { enCours, lancer } = useAction();
  const [texte, setTexte] = useState("");
  return (
    <Panel>
      <PanelHeader title="Votre avis technique" description="Il est transmis au service SAV, pas au client." />
      <PanelBody className="flex flex-col gap-4">
        <label htmlFor="sav-avis-be" className="sr-only">
          Avis technique
        </label>
        <Textarea id="sav-avis-be" rows={5} value={texte} onChange={(e) => setTexte(e.target.value)} />
        <Button variant="primary" disabled={enCours || !texte.trim()} onClick={() => lancer(() => changerStatut(demandeId, "en_analyse", texte), () => setTexte(""))}>
          <Send aria-hidden />
          Rendre l’avis
        </Button>
      </PanelBody>
    </Panel>
  );
}

/* ─────────────────────────── Qualité ─────────────────────────── */
function Qualite({ d, modifiable }: { d: DemandeSav; modifiable: boolean }) {
  const { enCours, lancer } = useAction();
  const [nc, setNc] = useState(d.nonConformite ?? false);
  const [cause, setCause] = useState(d.cause ?? "");
  const [action, setAction] = useState(d.actionCorrective ?? "");

  if (!modifiable) {
    return (
      <Panel>
        <PanelHeader title="Qualité" />
        <PanelBody className="text-sm text-text-2">
          {d.nonConformite === null ? "Pas encore qualifiée." : d.nonConformite ? `Non-conformité : ${d.cause ?? "cause à préciser"}.` : "Pas de non-conformité."}
          {d.actionCorrective ? <p className="mt-1">Action corrective : {d.actionCorrective}</p> : null}
        </PanelBody>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader title="Qualité" description={d.nonConformite === null ? "À qualifier" : "Qualifiée"} />
      <PanelBody className="flex flex-col gap-4">
        <Segmented
          label="Non-conformité"
          size="sm"
          value={nc ? "oui" : "non"}
          onChange={(v) => setNc(v === "oui")}
          options={[
            { value: "non", label: "Pas de non-conformité" },
            { value: "oui", label: "Non-conformité" },
          ]}
        />
        {nc ? (
          <>
            <Field label="Cause" htmlFor="sav-cause">
              <Select id="sav-cause" value={cause} onChange={(e) => setCause(e.target.value)}>
                <option value="">Choisir une cause</option>
                {CAUSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Action corrective" htmlFor="sav-action">
              <Textarea id="sav-action" rows={2} value={action} onChange={(e) => setAction(e.target.value)} />
            </Field>
          </>
        ) : null}
        <Button disabled={enCours} onClick={() => lancer(() => qualifierDemande(d.id, nc, cause, action))}>
          Enregistrer la qualification
        </Button>
      </PanelBody>
    </Panel>
  );
}
