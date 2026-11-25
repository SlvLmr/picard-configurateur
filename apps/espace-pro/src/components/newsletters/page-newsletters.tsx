"use client";

import { ArrowDown, ArrowUp, Heading, Image as IconeImage, Link2, Mail, Minus, Plus, Send, Text, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { compterDestinataires, enregistrerNewsletter, envoyerNewsletter, supprimerNewsletter } from "@/app/(app)/newsletters/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { CIBLES, type Cible } from "@/lib/cibles";
import type { Newsletter } from "@/lib/data/newsletters";
import { htmlNewsletter, type Bloc } from "@/lib/newsletter";

type Sources = {
  actualites: { titre: string; contenu: string; lien: string }[];
  evenements: { titre: string; date: string; lieu: string }[];
  animations: { titre: string; accroche: string; lien: string }[];
};
type Edition = { id: string | null; objet: string; preheader: string; blocs: Bloc[]; cible: Cible; envoyee: boolean };

const zoneTexte = "min-h-24 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none";
const dateFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const MODELE: Bloc[] = [
  { type: "titre", texte: "Les nouvelles du réseau" },
  { type: "texte", texte: "Bonjour,\nVoici l’essentiel du mois chez Picard Serrures." },
];
const LIBELLES: Record<Bloc["type"], string> = {
  titre: "Titre", texte: "Texte", image: "Image", bouton: "Bouton", separateur: "Séparateur", actualite: "Actualité", evenement: "Événement", animation: "Animation",
};

/** Newsletters du réseau : liste des envois et éditeur par blocs avec aperçu de l'e-mail. */
export function PageNewsletters({ newsletters, modifiable, envoiConfigure, sources }: { newsletters: Newsletter[]; modifiable: boolean; envoiConfigure: boolean; sources: Sources }) {
  const [edition, setEdition] = useState<Edition | null>(null);
  if (edition) return <Editeur initial={edition} modifiable={modifiable} envoiConfigure={envoiConfigure} sources={sources} onFermer={() => setEdition(null)} />;
  return (
    <>
      <PageHeader
        title="Newsletters"
        description="Composez la lettre d’information du réseau, prévisualisez-la et envoyez-la par e-mail au public choisi."
        actions={
          modifiable ? (
            <Button variant="primary" onClick={() => setEdition({ id: null, objet: "", preheader: "", blocs: MODELE, cible: "clients", envoyee: false })}>
              <Plus aria-hidden />
              Nouvelle newsletter
            </Button>
          ) : null
        }
      />
      {!envoiConfigure ? (
        <p className="mb-6 rounded-md border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-text">
          L’envoi d’e-mails n’est pas encore configuré (clé Brevo). Vous pouvez rédiger et programmer l’envoi : les e-mails partiront dès que la clé sera ajoutée.
        </p>
      ) : null}
      {newsletters.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {newsletters.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setEdition({ id: n.id, objet: n.objet, preheader: n.preheader, blocs: n.blocs, cible: (n.cible in CIBLES ? n.cible : "clients") as Cible, envoyee: n.statut === "envoyee" })}
                className="flex h-full w-full flex-col gap-3 rounded-lg border border-line bg-surface p-6 text-left shadow-card transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                    <Mail aria-hidden className="size-5" />
                  </span>
                  {n.statut === "envoyee" ? <Badge variant="success">Envoyée</Badge> : <Badge variant="neutral">Brouillon</Badge>}
                </span>
                <span className="font-display text-lg font-semibold leading-tight text-text">{n.objet || "Sans objet"}</span>
                {n.preheader ? <span className="line-clamp-2 text-sm text-text-2">{n.preheader}</span> : null}
                <span className="mt-auto text-xs text-text-3">
                  {n.statut === "envoyee" && n.envoyeeLe ? `Envoyée le ${dateFr(n.envoyeeLe)} à ${n.nbDestinataires ?? 0} destinataires` : `Modifiée le ${dateFr(n.majLe)}`}, {CIBLES[n.cible as Cible]?.label ?? n.cible}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center text-sm text-text-2">Aucune newsletter pour l’instant.</p>
      )}
    </>
  );
}

function Editeur({ initial, modifiable, envoiConfigure, sources, onFermer }: { initial: Edition; modifiable: boolean; envoiConfigure: boolean; sources: Sources; onFermer: () => void }) {
  const toast = useToast();
  const [n, setN] = useState(initial);
  const [pending, start] = useTransition();
  const [nombre, setNombre] = useState<number | null>(null);
  const lecture = !modifiable || n.envoyee;
  const html = useMemo(() => htmlNewsletter(n.objet || "Newsletter", n.preheader, n.blocs), [n.objet, n.preheader, n.blocs]);

  useEffect(() => {
    if (!modifiable) return;
    let actif = true;
    compterDestinataires(n.cible).then((c) => actif && setNombre(c));
    return () => {
      actif = false;
    };
  }, [n.cible, modifiable]);

  const majBloc = (i: number, b: Bloc) => setN((x) => ({ ...x, blocs: x.blocs.map((y, k) => (k === i ? b : y)) }));
  const deplacer = (i: number, sens: -1 | 1) =>
    setN((x) => {
      const b = [...x.blocs];
      const j = i + sens;
      if (j < 0 || j >= b.length) return x;
      [b[i], b[j]] = [b[j], b[i]];
      return { ...x, blocs: b };
    });
  const ajouter = (b: Bloc) => setN((x) => ({ ...x, blocs: [...x.blocs, b] }));

  const enregistrer = (ensuite?: (id: string) => void) =>
    start(async () => {
      const r = await enregistrerNewsletter({ id: n.id, objet: n.objet, preheader: n.preheader, blocs: n.blocs, cible: n.cible });
      if (!r.ok || !r.id) return toast(r.message);
      setN((x) => ({ ...x, id: r.id! }));
      if (ensuite) ensuite(r.id);
      else toast(r.message);
    });
  const envoyer = (test: boolean) => {
    if (!test && !window.confirm(`Envoyer « ${n.objet} » à ${nombre ?? "tous les"} destinataires ? L’envoi est définitif.`)) return;
    enregistrer((id) =>
      start(async () => {
        const r = await envoyerNewsletter(id, test);
        toast(r.message);
        if (r.ok && !test) onFermer();
      }),
    );
  };

  return (
    <>
      <PageHeader
        editable={false}
        title={n.id ? n.objet || "Newsletter" : "Nouvelle newsletter"}
        description={lecture ? (n.envoyee ? "Newsletter envoyée, consultation seule." : "Consultation seule.") : "Rédigez par blocs : l’aperçu de l’e-mail se met à jour à droite."}
        actions={
          <>
            <Button variant="ghost" onClick={onFermer}>
              Retour
            </Button>
            {!lecture ? (
              <>
                {n.id ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      window.confirm("Supprimer ce brouillon ?") &&
                      start(async () => {
                        const r = await supprimerNewsletter(n.id!);
                        toast(r.message);
                        if (r.ok) onFermer();
                      })
                    }
                  >
                    <Trash2 aria-hidden />
                    Supprimer
                  </Button>
                ) : null}
                <Button variant="secondary" disabled={pending} onClick={() => enregistrer()}>
                  Enregistrer le brouillon
                </Button>
                <Button variant="secondary" disabled={pending || !n.objet.trim()} onClick={() => envoyer(true)}>
                  M’envoyer un test
                </Button>
                <Button variant="primary" disabled={pending || !n.objet.trim() || !n.blocs.length} onClick={() => envoyer(false)}>
                  <Send aria-hidden />
                  Envoyer
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)]">
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="Envoi" description={!lecture && nombre !== null ? `${nombre} destinataire${nombre > 1 ? "s" : ""} pour ce public${envoiConfigure ? "" : ", envoi Brevo à configurer"}` : undefined} />
            <PanelBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Objet de l’e-mail" htmlFor="nl-objet">
                <Input id="nl-objet" disabled={lecture} value={n.objet} onChange={(e) => setN({ ...n, objet: e.target.value })} placeholder="Les nouvelles de novembre" />
              </Field>
              <Field label="Public" htmlFor="nl-cible">
                <Combobox id="nl-cible" disabled={lecture} options={(Object.keys(CIBLES) as Cible[]).map((k) => ({ value: k, label: CIBLES[k].label }))} value={n.cible} onChange={(v) => setN({ ...n, cible: v as Cible })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Phrase d’aperçu" htmlFor="nl-pre" hint="Affichée après l’objet dans la boîte de réception">
                  <Input id="nl-pre" disabled={lecture} value={n.preheader} onChange={(e) => setN({ ...n, preheader: e.target.value })} />
                </Field>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Contenu" description={`${n.blocs.length} bloc${n.blocs.length > 1 ? "s" : ""}`} />
            <PanelBody className="flex flex-col gap-3">
              {n.blocs.map((b, i) => (
                <div key={i} className="rounded-md border border-line bg-sunken/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-2">{LIBELLES[b.type]}</span>
                    {!lecture ? (
                      <span className="ml-auto flex gap-1">
                        <Button variant="ghost" size="sm" iconOnly aria-label="Monter" onClick={() => deplacer(i, -1)}>
                          <ArrowUp />
                        </Button>
                        <Button variant="ghost" size="sm" iconOnly aria-label="Descendre" onClick={() => deplacer(i, 1)}>
                          <ArrowDown />
                        </Button>
                        <Button variant="ghost" size="sm" iconOnly aria-label="Retirer le bloc" onClick={() => setN((x) => ({ ...x, blocs: x.blocs.filter((_, k) => k !== i) }))}>
                          <Trash2 />
                        </Button>
                      </span>
                    ) : null}
                  </div>
                  <ChampsBloc b={b} lecture={lecture} onChange={(nb) => majBloc(i, nb)} />
                </div>
              ))}
              {!lecture ? (
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  <Button variant="secondary" size="sm" onClick={() => ajouter({ type: "titre", texte: "" })}>
                    <Heading aria-hidden />
                    Titre
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => ajouter({ type: "texte", texte: "" })}>
                    <Text aria-hidden />
                    Texte
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => ajouter({ type: "image", url: "", legende: "" })}>
                    <IconeImage aria-hidden />
                    Image
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => ajouter({ type: "bouton", libelle: "Découvrir", url: "/accueil" })}>
                    <Link2 aria-hidden />
                    Bouton
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => ajouter({ type: "separateur" })}>
                    <Minus aria-hidden />
                    Séparateur
                  </Button>
                  <Insertion
                    label="Actualité"
                    options={sources.actualites.map((a) => a.titre)}
                    onChoisir={(k) => ajouter({ type: "actualite", ...sources.actualites[k] })}
                  />
                  <Insertion
                    label="Événement"
                    options={sources.evenements.map((e) => `${e.titre}, ${e.date}`)}
                    onChoisir={(k) => ajouter({ type: "evenement", ...sources.evenements[k] })}
                  />
                  <Insertion label="Animation" options={sources.animations.map((a) => a.titre)} onChoisir={(k) => ajouter({ type: "animation", ...sources.animations[k] })} />
                </div>
              ) : null}
            </PanelBody>
          </Panel>
        </div>

        {/* Aperçu de l'e-mail, tel qu'il sera reçu */}
        <section className="self-start rounded-lg border border-line bg-surface shadow-card xl:sticky xl:top-24">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Mail aria-hidden className="size-4 text-text-3" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-text">{n.objet || "Objet de l’e-mail"}</span>
              <span className="block truncate text-xs text-text-3">{n.preheader || "Phrase d’aperçu"}</span>
            </span>
          </header>
          <iframe title="Aperçu de la newsletter" srcDoc={html} className="h-[720px] w-full rounded-b-lg border-0" sandbox="" />
        </section>
      </div>
    </>
  );
}

/** Insère un contenu existant de l'Espace Pro (actualité, événement, animation). */
function Insertion({ label, options, onChoisir }: { label: string; options: string[]; onChoisir: (i: number) => void }) {
  if (!options.length) return null;
  return (
    <select
      aria-label={`Insérer : ${label}`}
      value=""
      onChange={(e) => {
        if (e.target.value !== "") onChoisir(Number(e.target.value));
      }}
      className="h-8 rounded-md border border-line-strong bg-surface px-2 text-sm text-text-2 focus:border-accent focus:outline-none"
    >
      <option value="">{`+ ${label}`}</option>
      {options.map((o, i) => (
        <option key={i} value={i}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ChampsBloc({ b, lecture, onChange }: { b: Bloc; lecture: boolean; onChange: (b: Bloc) => void }) {
  switch (b.type) {
    case "titre":
      return <Input aria-label="Titre" disabled={lecture} value={b.texte} onChange={(e) => onChange({ ...b, texte: e.target.value })} placeholder="Titre de la section" />;
    case "texte":
      return <textarea aria-label="Texte" disabled={lecture} className={zoneTexte} value={b.texte} onChange={(e) => onChange({ ...b, texte: e.target.value })} />;
    case "image":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input aria-label="Adresse de l’image" disabled={lecture} value={b.url} onChange={(e) => onChange({ ...b, url: e.target.value })} placeholder="https://…/image.jpg" />
          <Input aria-label="Légende" disabled={lecture} value={b.legende} onChange={(e) => onChange({ ...b, legende: e.target.value })} placeholder="Légende (facultatif)" />
        </div>
      );
    case "bouton":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input aria-label="Libellé du bouton" disabled={lecture} value={b.libelle} onChange={(e) => onChange({ ...b, libelle: e.target.value })} />
          <Input aria-label="Lien du bouton" disabled={lecture} value={b.url} onChange={(e) => onChange({ ...b, url: e.target.value })} placeholder="/animations ou https://…" />
        </div>
      );
    case "separateur":
      return <p className="text-xs text-text-3">Une ligne fine pour séparer deux parties.</p>;
    case "actualite":
      return (
        <div className="flex flex-col gap-2">
          <Input aria-label="Titre de l’actualité" disabled={lecture} value={b.titre} onChange={(e) => onChange({ ...b, titre: e.target.value })} />
          <textarea aria-label="Texte de l’actualité" disabled={lecture} className={zoneTexte} value={b.contenu} onChange={(e) => onChange({ ...b, contenu: e.target.value })} />
        </div>
      );
    case "evenement":
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <Input aria-label="Événement" disabled={lecture} value={b.titre} onChange={(e) => onChange({ ...b, titre: e.target.value })} />
          <Input aria-label="Date" disabled={lecture} value={b.date} onChange={(e) => onChange({ ...b, date: e.target.value })} />
          <Input aria-label="Lieu" disabled={lecture} value={b.lieu} onChange={(e) => onChange({ ...b, lieu: e.target.value })} />
        </div>
      );
    case "animation":
      return (
        <div className="flex flex-col gap-2">
          <Input aria-label="Animation" disabled={lecture} value={b.titre} onChange={(e) => onChange({ ...b, titre: e.target.value })} />
          <Input aria-label="Accroche" disabled={lecture} value={b.accroche} onChange={(e) => onChange({ ...b, accroche: e.target.value })} />
        </div>
      );
  }
}
