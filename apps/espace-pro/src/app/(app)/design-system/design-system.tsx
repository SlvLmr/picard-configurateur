"use client";

import { Check, Coins, Download, Hourglass, Inbox, Plus, Timer } from "lucide-react";
import { Jauge } from "@/components/ui/jauge";
import { KpiBand } from "@/components/ui/kpi";
import { Picto } from "@/components/ui/picto";
import { Repartition } from "@/components/ui/repartition";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cote } from "@/components/ui/cote";
import { Field, Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";

const COULEURS = [
  { groupe: "Surfaces", tokens: [["--bg", "Fond de page"], ["--surface", "Panneaux, champs"], ["--surface-sunken", "Survol, zones en retrait"], ["--line", "Filets"], ["--line-strong", "Bordures de champs"]] },
  { groupe: "Texte", tokens: [["--text", "Titres, valeurs"], ["--text-2", "Texte courant secondaire"], ["--text-3", "Métadonnées, aides"]] },
  { groupe: "Bleus et action", tokens: [["--accent", "Liens, données, focus"], ["--accent-soft", "Fonds informatifs"], ["--nav-bg", "Navigation"], ["--cta", "Action principale (laiton)"]] },
  { groupe: "États", tokens: [["--success", "Réussi, au-dessus de l’objectif"], ["--warning", "À surveiller"], ["--danger", "Bloquant, en retard"]] },
] as const;

const TYPO = [
  { cls: "font-display text-3xl font-bold", nom: "Chiffre héros", spec: "48/52, 700, semi-étendu", usage: "Un seul par écran, si le chiffre est le sujet" },
  { cls: "font-display text-2xl font-semibold", nom: "Titre de page", spec: "36/40, 600, semi-étendu", usage: "Titre de page sur grand écran" },
  { cls: "font-display text-xl font-semibold", nom: "Titre de page mobile, chiffre", spec: "24/28, 600", usage: "Titre sur mobile, valeurs des indicateurs (700)" },
  { cls: "text-lg font-semibold", nom: "Titre de section", spec: "18/24, 600", usage: "États vides, sous-parties" },
  { cls: "text-base font-semibold", nom: "Titre de panneau", spec: "16/24, 600", usage: "En-tête de panneau, élément principal d’une ligne" },
  { cls: "text-sm", nom: "Texte courant", spec: "14/20, 400", usage: "Corps de l’interface" },
  { cls: "text-sm font-medium", nom: "Interface", spec: "14/20, 500", usage: "Boutons, libellés, navigation" },
  { cls: "text-xs text-text-3", nom: "Métadonnée", spec: "12/16, 400", usage: "Dates, sources, aides de champ" },
];

const ESPACES = [
  [1, 4, "Icône ↔ texte serré"],
  [2, 8, "Éléments d’un même groupe"],
  [3, 12, "Libellé ↔ contenu"],
  [4, 16, "Lignes de liste (vertical)"],
  [6, 24, "Marge interne des panneaux"],
  [8, 32, "Entre blocs d’une page"],
  [12, 48, "Entre sections majeures"],
] as const;

export function DesignSystem() {
  const toast = useToast();
  const [vue, setVue] = useState<"jour" | "mois" | "annee">("mois");

  return (
    <>
      <PageHeader
        title="Design system"
        description="Les règles communes à tous les modules. Toute valeur utilisée dans l’interface vient d’ici : aucune couleur, taille ou marge écrite en dur."
      />

      <section aria-labelledby="ds-principes" className="grid gap-6 md:grid-cols-3">
        <h2 id="ds-principes" className="sr-only">
          Principes
        </h2>
        {[
          ["Une action principale par zone", "Le laiton est réservé à l’action qu’on attend de l’utilisateur. Tout le reste est secondaire."],
          ["La structure porte l’information", "Filets, panneaux et étiquettes signalent une donnée, jamais une décoration."],
          ["La cote mesure", "La ligne de cote représente une mesure entre deux bornes : objectif, délai, palier. Rien d’autre."],
        ].map(([t, d]) => (
          <div key={t} className="border-t-2 border-text pt-4">
            <h3 className="text-base font-semibold text-text">{t}</h3>
            <p className="mt-2 text-sm text-text-2">{d}</p>
          </div>
        ))}
      </section>

      <Section titre="Couleurs" description="Des tokens sémantiques, déclinés pour Picard, Eliot, le mode clair et le mode sombre. Changez de marque ou de mode en haut de page pour les voir varier.">
        <div className="grid gap-8 md:grid-cols-2">
          {COULEURS.map((g) => (
            <div key={g.groupe}>
              <h3 className="text-sm font-semibold text-text">{g.groupe}</h3>
              <ul className="mt-3">
                {g.tokens.map(([t, u]) => (
                  <li key={t} className="flex items-center gap-4 border-t border-line py-3">
                    <span className="size-8 shrink-0 rounded-md border border-line" style={{ background: `var(${t})` }} aria-hidden />
                    <code className="w-40 shrink-0 text-xs text-text">{t}</code>
                    <span className="text-sm text-text-2">{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section titre="Typographie" description="Archivo, une seule famille. Les titres sont légèrement étendus (largeur 112), le texte reste à largeur normale. Échelle : 12, 14, 16, 18, 24, 36, 48.">
        <ul>
          {TYPO.map((t) => (
            <li key={t.nom} className="grid gap-2 border-t border-line py-4 md:grid-cols-[minmax(0,1fr)_240px]">
              <p className={t.cls}>{t.nom === "Chiffre héros" ? "4 820" : "Porte blindée palière, A2P BP2"}</p>
              <div>
                <p className="text-sm font-medium text-text">{t.nom}</p>
                <p className="text-xs text-text-3">
                  {t.spec}. {t.usage}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-text-2">
          Graisses : 400 texte, 500 interface, 600 titres, 700 chiffres. Les chiffres sont toujours en chasse fixe dans les tableaux et indicateurs. Pas de capitales pour les libellés.
        </p>
      </Section>

      <Section titre="Espacements et rayons" description="Grille de 4 px. Les classes Tailwind par défaut sont désactivées : seules ces valeurs existent.">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <ul>
            {ESPACES.map(([k, px, u]) => (
              <li key={k} className="flex items-center gap-4 border-t border-line py-3">
                <code className="w-10 text-xs text-text">{k}</code>
                <span className="tabular w-12 text-xs text-text-3">{px} px</span>
                <span className="h-3 shrink-0 rounded-sm bg-accent" style={{ width: px * 2 }} aria-hidden />
                <span className="text-sm text-text-2">{u}</span>
              </li>
            ))}
          </ul>
          <ul>
            {[
              ["sm", "4 px", "Étiquettes, segments", "rounded-sm"],
              ["md", "8 px", "Boutons, champs", "rounded-md"],
              ["lg", "12 px", "Panneaux", "rounded-lg"],
            ].map(([k, v, u, r]) => (
              <li key={k} className="flex items-center gap-4 border-t border-line py-3">
                <span className={`size-10 shrink-0 border-2 border-accent bg-accent-soft ${r}`} aria-hidden />
                <div>
                  <p className="text-sm font-medium text-text">
                    {k}, {v}
                  </p>
                  <p className="text-xs text-text-3">{u}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section titre="Boutons" description="Deux tailles : 32 px dans les listes, 40 px ailleurs. Le libellé dit exactement ce qui se passe.">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" onClick={() => toast("Lead attribué à Serrurerie Lambert")}>
            <Inbox aria-hidden />
            Traiter les leads
          </Button>
          <Button variant="primary" onClick={() => toast("Lead attribué à Serrurerie Lambert")}>
            <Check aria-hidden />
            Attribuer
          </Button>
          <Button>
            <Download aria-hidden />
            Exporter
          </Button>
          <Button variant="ghost">Annuler</Button>
          <Button variant="danger">Refuser le lead</Button>
          <Button variant="primary" size="sm">
            <Plus aria-hidden />
            Nouvelle action
          </Button>
          <Button size="sm">Relancer</Button>
          <Button disabled>Indisponible</Button>
        </div>
      </Section>

      <Section titre="Étiquettes" description="Un statut ou une catégorie, jamais une décoration. Les niveaux IAP vont du plus affirmé au plus discret.">
        <div className="flex flex-wrap gap-2">
          <Badge variant="elite">IAP Elite</Badge>
          <Badge variant="premium">IAP Premium</Badge>
          <Badge variant="officiel">IAP Officiel</Badge>
          <Badge>Client</Badge>
          <Badge variant="atc">Commercial</Badge>
          <Badge variant="success">Accepté</Badge>
          <Badge variant="warning">Gros projet</Badge>
          <Badge variant="danger">En retard</Badge>
        </div>
      </Section>

      <Section titre="Champs" description="Le libellé est toujours visible au-dessus du champ. L’aide passe dessous, remplacée par l’erreur s’il y en a une.">
        <div className="grid max-w-3xl gap-6 md:grid-cols-3">
          <Field label="Largeur du tableau" htmlFor="ds-l" hint="En millimètres">
            <Input id="ds-l" defaultValue="930" inputMode="numeric" />
          </Field>
          <Field label="Hauteur du tableau" htmlFor="ds-h" error="1 000 mm maximum pour la gamme Altitude">
            <Input id="ds-h" defaultValue="1 120" aria-invalid />
          </Field>
          <Field label="Niveau de sécurité" htmlFor="ds-s">
            <Select id="ds-s" defaultValue="BP2">
              <option>BP1</option>
              <option>BP2</option>
              <option>BP3</option>
            </Select>
          </Field>
        </div>
        <div className="mt-6">
          <Segmented
            label="Période"
            value={vue}
            onChange={setVue}
            options={[
              { value: "jour", label: "Jour" },
              { value: "mois", label: "Mois" },
              { value: "annee", label: "Année" },
            ]}
          />
        </div>
      </Section>

      <Section titre="La cote" description="L’élément signature : une ligne de cote graduée comme un réglet, avec deux butées, une mesure et sa valeur. Elle remplace les barres de progression génériques.">
        <div className="grid gap-12 md:grid-cols-3">
          <Cote label="Objectif" value={412} max={500} valueLabel="412 k€" startLabel="Chiffre d’affaires" endLabel="500 k€" />
          <Cote label="Délai" value={1100} max={1440} tone="warning" valueLabel="Encore 5 h 40" startLabel="Reçu" endLabel="Réattribution" />
          <Cote label="Marché" value={1.5} max={1.5} tone="success" valueLabel="104 %" endLabel="1,5 M€" />
        </div>
      </Section>

      <Section titre="Pictos" description="Un picto signale la nature d’une information, dans un carré teinté selon son sens. Le laiton signale ce qui rapporte (points, Ma Porte).">
        <div className="flex flex-wrap items-center gap-3">
          <Picto icon={Inbox} />
          <Picto icon={Coins} tone="cta" />
          <Picto icon={Check} tone="success" />
          <Picto icon={Hourglass} tone="warning" />
          <Picto icon={Timer} tone="danger" />
          <Picto icon={Inbox} tone="neutral" />
          <Picto icon={Inbox} tone="nav" size="lg" />
          <Picto icon={Inbox} size="sm" />
        </div>
      </Section>

      <Section titre="Indicateurs clés" description="Une seule bande par page, en tête. Picto, valeur forte, évolution colorée selon qu’elle est bonne ou mauvaise, tendance sur 7 périodes.">
        <KpiBand
          items={[
            { label: "À valider", value: 37, icon: Inbox, tone: "cta", delta: { text: "+9 depuis 8 h", sens: "up", bon: false }, trend: [22, 25, 19, 28, 31, 27, 37] },
            { label: "Délai moyen", value: "2 h 14", icon: Timer, delta: { text: "−18 min", sens: "down", bon: true }, trend: [190, 176, 168, 160, 151, 142, 134] },
            { label: "Acceptés sous 24 h", value: 92, unit: "%", icon: Hourglass, tone: "success", delta: { text: "+4 pts", sens: "up", bon: true }, trend: [81, 84, 83, 87, 88, 90, 92] },
            { label: "Points", value: "4 820", icon: Coins, tone: "cta", note: "Prochain palier à 6 500" },
          ]}
        />
      </Section>

      <Section titre="Jauge" description="Un instrument de mesure gradué : pour l’indicateur principal d’un panneau (objectif annuel, palier). L’aiguille donne la valeur, le trait noir l’objectif.">
        <div className="flex flex-wrap gap-12">
          <Jauge value={412} max={500} target={450} label="Objectif" valueLabel="82 %" sousTitre="412 k€ sur 500 k€" />
          <Jauge value={4820} max={6500} label="Palier" valueLabel="4 820 pts" sousTitre="Encore 1 680 points" tone="cta" />
          <Jauge value={71} max={100} label="Marché" valueLabel="71 %" sousTitre="Fenêtriers" tone="danger" />
        </div>
      </Section>

      <Section titre="Répartition" description="Une barre segmentée pour montrer comment un total se décompose.">
        <Repartition
          className="max-w-xl"
          label="Leads par statut"
          segments={[
            { label: "Contactés", value: 21, color: "var(--bleu-400)" },
            { label: "Devis envoyés", value: 25, color: "var(--accent)" },
            { label: "Signés", value: 12, color: "var(--success)" },
            { label: "Perdus", value: 14, color: "var(--danger)" },
          ]}
        />
      </Section>

      <Section titre="Panneau" description="Pour un ensemble de données qu’on manipule : une liste, un formulaire, un graphique. Pas pour encadrer un texte.">
        <Panel className="max-w-xl">
          <PanelHeader title="Professionnels en retard" description="Délai d’acceptation dépassé" actions={<Button size="sm">Tout relancer</Button>} />
          <PanelBody>
            <p className="text-sm text-text-2">Contenu du panneau : marges de 24 px, lignes séparées par des filets.</p>
          </PanelBody>
        </Panel>
      </Section>
    </>
  );
}

function Section({ titre, description, children }: { titre: string; description?: string; children: React.ReactNode }) {
  const id = `ds-${titre.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="mt-12 border-t border-line pt-8">
      <h2 id={id} className="font-display text-lg font-semibold text-text">
        {titre}
      </h2>
      {description ? <p className="mt-1 max-w-prose text-sm text-text-2">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
