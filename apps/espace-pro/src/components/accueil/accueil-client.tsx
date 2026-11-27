"use client";

import { CalendarDays, LifeBuoy, MapPin, Phone, Send, Check, CheckCheck, Coins, Inbox, MessageCircle, Ruler, Timer, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { accepterLead } from "@/app/(app)/leads/actions";
import { STATUTS as STATUTS_SAV } from "@/components/sav/libelles";
import { Carte } from "@/components/accueil/carte";
import { Nouveautes, type QuestionnaireAFaire } from "@/components/accueil/nouveautes";
import { CanalMessages } from "@/components/communication/canal-messages";
import { FriseCalendrier } from "@/components/communication/frise-calendrier";
import { NiveauBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Annonce, ElementAgenda, Recap } from "@/lib/data/accueil";
import type { LeadPro } from "@/lib/data/leads";
import type { Ressource } from "@/lib/data/mediatheque";
import type { ProfilReel, StatsPro } from "@/lib/data/types";
import { formatDuree, formatNumber } from "@/lib/format";

export type DonneesClient = {
  leads: LeadPro[];
  sav: { id: string; reference: string; type: string; statut: keyof typeof STATUTS_SAV; mis_a_jour_le: string; produit: string | null }[];
  ressources: Ressource[];
  stats: StatsPro | null;
  compte: { raison_sociale: string; niveau_iap: "Elite" | "Premium" | "Officiel" | null } | null;
  /** L'administrateur voit l'accueil client avec des données réelles du réseau */
  apercu: boolean;
};

/*
 * Direction artistique de l'accueil client
 * Un bandeau sombre (la couleur du menu), puis des cartes blanches identiques.
 * L'orange est réservé à ce qui demande une action. Pas de picto décoratif :
 * seuls les pictos qui font quelque chose (cocher, télécharger) sont affichés.
 */

const JOUR = 86400000;

function Vide({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md bg-sunken px-4 py-6 text-center text-sm text-text-3">{children}</p>;
}

/* ───────── Tâches : les leads à accepter en tête, puis le reste ───────── */
type Genre = "accepter" | "sav" | "appeler" | "relancer";
type Tache = { id: string; genre: Genre; titre: string; detail: string; lieu: string | null; href: string; telephone?: string | null; lead?: LeadPro; urgent: boolean };

/** Villes saisies en capitales : « HAY-LES-ROSES » devient « Hay-les-Roses » */
const PETITS_MOTS = new Set(["le", "la", "les", "de", "du", "des", "sur", "en", "et", "sous", "lès"]);
function joliNom(v: string | null) {
  if (!v) return null;
  if (v !== v.toUpperCase()) return v;
  return v
    .toLowerCase()
    .split(/([\s-])/)
    .map((m, i) => (i > 0 && PETITS_MOTS.has(m) ? m : m.charAt(0).toUpperCase() + m.slice(1)))
    .join("");
}
const initiales = (nom: string | null) =>
  (nom ?? "?")
    .replace(/^(M\.|Mme|Mlle|Monsieur|Madame)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m.charAt(0).toUpperCase())
    .join("") || "?";

const GENRES: Record<Exclude<Genre, "accepter">, { groupe: string; etiquette: string; action: string; icone: LucideIcon; fond: string; texte: string }> = {
  sav: { groupe: "SAV à compléter", etiquette: "Réponse attendue", action: "Répondre", icone: LifeBuoy, fond: "var(--success-soft)", texte: "var(--success)" },
  appeler: { groupe: "Clients à appeler", etiquette: "À appeler", action: "Appeler", icone: Phone, fond: "var(--accent-soft)", texte: "var(--accent-strong)" },
  relancer: { groupe: "Devis à relancer", etiquette: "Devis envoyé", action: "Relancer", icone: Send, fond: "var(--warning-soft)", texte: "var(--warning)" },
};

/** Un lead à accepter : compte à rebours circulaire, projet, lieu, message et actions. */
function CarteLead({ l, apercu }: { l: LeadPro; apercu: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const ecoule = l.attribueLe ? (Date.now() - new Date(l.attribueLe).getTime()) / 60000 : 0;
  const reste = Math.max(0, l.delaiMin - ecoule);
  const partRestante = Math.max(0, 1 - ecoule / l.delaiMin);
  const presse = partRestante < 0.25;
  const couleur = presse ? "var(--danger)" : "var(--cta)";
  const r = 26;
  const c = 2 * Math.PI * r;
  const heures = Math.floor(reste / 60);
  return (
    <li className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* Compte à rebours : l'anneau se vide à mesure que le délai s'écoule */}
        <span className="relative flex size-16 shrink-0 items-center justify-center" title={reste > 0 ? `${formatDuree(reste)} pour répondre` : "Délai dépassé"}>
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx={32} cy={32} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={5} />
            <circle cx={32} cy={32} r={r} fill="none" stroke={couleur} strokeWidth={5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - partRestante)} />
          </svg>
          <span className="text-center leading-none" suppressHydrationWarning>
            <span className="block font-display tabular text-sm font-bold text-text">{reste <= 0 ? "0" : heures >= 1 ? `${heures} h` : `${Math.round(reste)}`}</span>
            <span className="block text-xs text-text-3">{heures >= 1 || reste <= 0 ? "restant" : "min"}</span>
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `color-mix(in srgb, ${couleur} 15%, transparent)`, color: presse ? "var(--danger)" : "var(--cta-deep)" }}>
              Nouveau lead
            </span>
            <span className="tabular text-xs text-text-3">{l.reference}</span>
          </p>
          <Link href={`/leads/${l.id}`} className="mt-1 block truncate text-base font-semibold text-text hover:underline">
            {l.projet}
          </Link>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-text-2">
            <MapPin aria-hidden className="size-4 shrink-0 text-text-3" />
            <span className="truncate">{[l.ville, l.cp].filter(Boolean).join(", ")}</span>
          </p>
          {l.message ? <p className="mt-1 line-clamp-1 text-sm italic text-text-3">« {l.message} »</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
        {!apercu ? (
          <button
            type="button"
            disabled={pending || reste <= 0}
            onClick={() => start(async () => toast((await accepterLead(l.id)).message))}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-cta px-5 text-sm font-semibold text-cta-text shadow-cta transition-colors hover:bg-cta-hover disabled:opacity-50 sm:flex-none"
          >
            Accepter
          </button>
        ) : null}
        <Link href={`/leads/${l.id}`} className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-line px-4 text-sm font-medium text-text-2 transition-colors hover:border-line-strong hover:text-text sm:flex-none">
          Voir le détail
        </Link>
      </div>
    </li>
  );
}

/** Une tâche de suivi : avatar, étiquette, lieu, action directe et case « fait ». */
function LigneSuivi({ t, fait, basculer }: { t: Tache; fait: boolean; basculer: () => void }) {
  const g = GENRES[t.genre as Exclude<Genre, "accepter">];
  const Icone = g.icone;
  const telephone = t.genre === "appeler" && t.telephone ? `tel:${t.telephone.replace(/\s/g, "")}` : null;
  return (
    <li className={cn("group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-sunken", fait && "opacity-60")}>
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: g.fond, color: g.texte }}>
        {t.genre === "sav" ? <LifeBuoy className="size-5" /> : initiales(t.titre)}
      </span>
      <Link href={t.href} className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("truncate text-sm font-semibold", fait ? "text-text-3 line-through" : "text-text")}>{t.titre}</span>
          <span className="hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold sm:inline" style={{ background: g.fond, color: g.texte }}>
            {g.etiquette}
          </span>
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-text-3">
          <span className="truncate">{t.detail}</span>
          {t.lieu ? (
            <>
              <MapPin aria-hidden className="ml-1 size-3 shrink-0" />
              <span className="shrink-0">{t.lieu}</span>
            </>
          ) : null}
        </span>
      </Link>
      {!fait ? (
        telephone ? (
          <a href={telephone} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-semibold text-text-2 transition-colors hover:border-line-strong hover:text-text">
            <Icone aria-hidden className="size-4" />
            {g.action}
          </a>
        ) : (
          <Link href={t.href} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-semibold text-text-2 transition-colors hover:border-line-strong hover:text-text">
            <Icone aria-hidden className="size-4" />
            {g.action}
          </Link>
        )
      ) : null}
      <button
        type="button"
        onClick={basculer}
        aria-pressed={fait}
        aria-label={fait ? "Marquer comme à faire" : "Marquer comme fait"}
        title={fait ? "Marquer comme à faire" : "Marquer comme fait"}
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors", fait ? "border-text bg-text text-surface" : "border-line text-text-3 hover:border-success hover:text-success")}
      >
        <Check aria-hidden className="size-4" />
      </button>
    </li>
  );
}

/** Accueil des clients : un bandeau, ce qu'il y a à faire, le fil Picard, l'agenda et les documents. */
export function AccueilClient({
  profil,
  donnees,
  recap,
  annonces,
  agenda,
  palier,
  questionnaires,
}: {
  profil: ProfilReel | null;
  donnees: DonneesClient;
  recap: Recap;
  annonces: Annonce[];
  agenda: ElementAgenda[];
  palier: number;
  questionnaires: QuestionnaireAFaire[];
}) {
  const maintenant = new Date();
  const aAccepter = donnees.leads.filter((l) => l.statut === "attribue");
  const enCours = donnees.leads.filter((l) => ["accepte", "contacte", "rdv", "devis"].includes(l.statut));
  const savAttente = donnees.sav.filter((s) => s.statut === "infos_demandees");
  const nouveaux = annonces.filter((a) => Date.now() - new Date(a.debut).getTime() < 7 * JOUR).length;

  /* Une seule liste de tâches : rien n'est répété ailleurs sur la page */
  const taches = useMemo(() => {
    const t: Tache[] = [];
    aAccepter.forEach((l) => t.push({ id: `accepter-${l.id}`, genre: "accepter", titre: l.projet, detail: l.reference, lieu: joliNom(l.ville), href: `/leads/${l.id}`, lead: l, urgent: true }));
    savAttente.forEach((s) => t.push({ id: `sav-${s.id}`, genre: "sav", titre: `Demande ${s.reference}`, detail: s.produit ?? "Le service SAV attend votre réponse", lieu: null, href: `/sav/${s.id}`, urgent: true }));
    enCours
      .filter((l) => l.statut === "accepte")
      .forEach((l) => t.push({ id: `appeler-${l.id}`, genre: "appeler", titre: l.contact ?? "Votre client", detail: l.projet, lieu: joliNom(l.ville), href: `/leads/${l.id}`, telephone: l.masque ? null : l.telephone, urgent: false }));
    enCours
      .filter((l) => l.statut === "devis")
      .forEach((l) => t.push({ id: `relancer-${l.id}`, genre: "relancer", titre: l.contact ?? "Votre client", detail: l.projet, lieu: joliNom(l.ville), href: `/leads/${l.id}`, urgent: false }));
    return t;
  }, [aAccepter, savAttente, enCours]);

  const [faits, setFaits] = useState<string[]>([]);
  useEffect(() => {
    try {
      setFaits(JSON.parse(window.localStorage.getItem("ep-faits") ?? "[]"));
    } catch {
      /* navigation privée */
    }
  }, []);
  const basculer = (id: string) =>
    setFaits((f) => {
      const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      try {
        window.localStorage.setItem("ep-faits", JSON.stringify(n.slice(-100)));
      } catch {
        /* navigation privée */
      }
      return n;
    });
  const restantes = taches.filter((t) => !faits.includes(t.id)).length;

  const prenom = profil?.prenom ?? "";
  const tauxAcceptation = donnees.stats && donnees.stats.recus ? Math.round((donnees.stats.acceptes / donnees.stats.recus) * 100) : null;
  const dateDuJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(maintenant);

  return (
    <div className="flex flex-col gap-6">
      {/* ───────── En-tête et indicateurs, aux standards des autres pages ───────── */}
      <div>
        <PageHeader
          editable={false}
          className="pb-6"
          title={prenom ? `Bonjour ${prenom}` : "Bonjour"}
          meta={donnees.compte?.niveau_iap ? <NiveauBadge type={donnees.compte.niveau_iap} /> : null}
          description={
            <>
              {dateDuJour.replace(/^./, (c) => c.toLocaleUpperCase("fr-FR"))}
              {donnees.compte?.raison_sociale ? `, ${donnees.compte.raison_sociale}` : ""}
              {donnees.apercu ? <span className="mt-1 block text-sm text-text-3">Aperçu avec les données réelles du réseau : les boutons d’action sont masqués.</span> : null}
            </>
          }
          actions={
            <ButtonLink href="/configurateur" variant="primary" size="lg">
              <Ruler aria-hidden />
              Configurer une porte
            </ButtonLink>
          }
        />
        <KpiBand
          items={[
            { label: "Points fidélité", value: formatNumber(recap.points), icon: Coins, tone: "cta", note: `Prochain palier à ${formatNumber(palier)}`, href: "/boutique" },
            { label: "Leads reçus", value: donnees.stats ? String(donnees.stats.recus) : "–", icon: Inbox, tone: "accent", note: "Sur 12 mois", href: "/leads" },
            { label: "Leads acceptés", value: tauxAcceptation === null ? "–" : tauxAcceptation, unit: tauxAcceptation === null ? undefined : "%", icon: CheckCheck, tone: "success", note: "Taux d’acceptation" },
            { label: "Temps de réponse", value: donnees.stats?.temps_reponse_min ? formatDuree(donnees.stats.temps_reponse_min) : "–", icon: Timer, tone: "neutral", note: "En moyenne" },
          ]}
        />
      </div>

      <Nouveautes questionnaires={questionnaires} annonces={annonces} apercu={donnees.apercu} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* ───────── À traiter ───────── */}
        <Carte
          id="a-traiter"
          titre="Vos priorités"
          icone={Inbox}
          ton="cta"
          sousTitre={restantes ? `${restantes} action${restantes > 1 ? "s" : ""} à mener${aAccepter.length ? `, dont ${aAccepter.length} lead${aAccepter.length > 1 ? "s" : ""} à accepter` : ""}` : "Tout est à jour"}
          lien={{ href: "/leads", label: "Mes leads" }}
        >
          {taches.length ? (
            <div className="flex flex-col gap-6">
              {aAccepter.length ? (
                <ul className="flex flex-col gap-3">
                  {aAccepter.map((l) => (
                    <CarteLead key={l.id} l={l} apercu={donnees.apercu} />
                  ))}
                </ul>
              ) : null}
              {(["sav", "appeler", "relancer"] as const).map((genre) => {
                const liste = taches.filter((t) => t.genre === genre);
                if (!liste.length) return null;
                const visibles = liste.slice(0, 4);
                return (
                  <div key={genre}>
                    <p className="flex items-center gap-2 px-3 text-xs font-semibold text-text-3">
                      {GENRES[genre].groupe}
                      <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-sunken px-1 text-xs text-text-2">{liste.length}</span>
                    </p>
                    <ul className="mt-1 flex flex-col">
                      {visibles.map((t) => (
                        <LigneSuivi key={t.id} t={t} fait={faits.includes(t.id)} basculer={() => basculer(t.id)} />
                      ))}
                    </ul>
                    {liste.length > visibles.length ? (
                      <Link href="/leads" className="mt-1 inline-block px-3 text-sm font-medium text-text-2 underline-offset-4 hover:text-text hover:underline">
                        {liste.length - visibles.length > 1 ? `Voir les ${liste.length - visibles.length} autres` : "Voir le dernier"}
                      </Link>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <Vide>Rien à traiter. Vous serez prévenu ici, par e-mail et par SMS, dès qu’un lead arrive.</Vide>
          )}
          <p className="mt-4 text-sm text-text-3">
            Un souci sur un chantier ?{" "}
            <Link href="/sav/nouvelle" className="font-medium text-text-2 underline underline-offset-4 hover:text-text">
              Déclarer une demande SAV
            </Link>
          </p>
        </Carte>

        {/* ───────── Messages : le canal complet, avec photos ───────── */}
        <Carte
          id="messages"
          titre="Le fil Picard"
          icone={MessageCircle}
          ton="success"
          sousTitre={nouveaux ? `${nouveaux} message${nouveaux > 1 ? "s" : ""} cette semaine` : "Chaîne officielle du réseau"}
          className="scroll-mt-24"
        >
          <CanalMessages annonces={annonces} admin={false} />
        </Carte>
      </div>

      {/* ───────── Agenda : la frise du réseau ───────── */}
      <Carte
        id="agenda"
        titre="Agenda du réseau"
        icone={CalendarDays}
        ton="warning"
        sousTitre="Salons, opérations, formations, webinaires et réunions"
        sousTitreFixe
        className="scroll-mt-24"
        actions={
          null
        }
      >
        <FriseCalendrier elements={agenda} />
      </Carte>
    </div>
  );
}
