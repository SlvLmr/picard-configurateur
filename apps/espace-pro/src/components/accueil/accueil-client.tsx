"use client";

import { BadgeCheck, CalendarDays, MapPin, Check, CheckCheck, Coins, Download, FolderOpen, Inbox, MessageCircle, Ruler, Timer, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { accepterLead } from "@/app/(app)/leads/actions";
import { lienTelechargement } from "@/app/(app)/mediatheque/actions";
import { TYPES_AGENDA } from "@/components/accueil/calendrier";
import { SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { TYPES as TYPES_MEDIA } from "@/components/mediatheque/libelles";
import { STATUTS as STATUTS_SAV } from "@/components/sav/libelles";
import { NiveauBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Picto } from "@/components/ui/picto";
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
const jourCourt = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));

/* ───────── Carte : même gabarit que les panneaux du site (picto, titre, sous-titre, lien) ───────── */
function Carte({
  id, titre, sousTitre, icone, ton, lien, children, className,
}: {
  id: string; titre: string; sousTitre: React.ReactNode; icone: LucideIcon; ton: React.ComponentProps<typeof Picto>["tone"];
  lien?: { href: string; label: string }; children: React.ReactNode; className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("flex flex-col rounded-lg border border-line bg-surface shadow-card", className)}>
      <header className="flex items-center gap-4 px-6 pb-4 pt-6">
        <Picto icon={icone} tone={ton} />
        <div className="min-w-0 flex-1">
          <h2 id={id} className="font-display text-lg font-semibold leading-tight text-text">
            {titre}
          </h2>
          <p className="mt-0.5 truncate text-sm text-text-3">{sousTitre}</p>
        </div>
        {lien ? (
          <Link href={lien.href} className="shrink-0 rounded-full border border-line px-3 py-1 text-sm font-medium text-text-2 transition-colors hover:border-line-strong hover:text-text">
            {lien.label}
          </Link>
        ) : null}
      </header>
      <div className="flex-1 px-6 pb-6">{children}</div>
    </section>
  );
}

function Vide({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md bg-sunken px-4 py-6 text-center text-sm text-text-3">{children}</p>;
}

/* ───────── Tâches : les leads à accepter en tête, puis le reste ───────── */
type Tache = { id: string; titre: string; detail: string; href: string; lead?: LeadPro; urgent: boolean };

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

/** Une tâche à cocher : SAV à compléter, client à appeler, devis à relancer. */
function LigneTache({ t, fait, basculer }: { t: Tache; fait: boolean; basculer: () => void }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={basculer}
        aria-pressed={fait}
        aria-label={fait ? "Marquer comme à faire" : "Marquer comme fait"}
        className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", fait ? "border-text bg-text text-surface" : t.urgent ? "border-cta" : "border-line-strong hover:border-text-2")}
      >
        {fait ? <Check aria-hidden className="size-3" /> : null}
      </button>
      <Link href={t.href} className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-semibold hover:underline", fait ? "text-text-3 line-through" : "text-text")}>{t.titre}</span>
        <span className="block truncate text-sm text-text-3">{t.detail}</span>
      </Link>
      {t.urgent && !fait ? <span className="shrink-0 rounded-full bg-cta-soft px-2 py-0.5 text-xs font-semibold text-cta-deep">Attendu</span> : null}
    </li>
  );
}

/* ───────── Document téléchargeable, présenté comme un fichier ───────── */
const COULEUR_MEDIA: Record<Ressource["type"], string> = { photo: "#3b82f6", video: "#0ea5a0", doc_commerciale: "#f2643d", doc_technique: "#64748b" };
function FichierDocument({ r }: { r: Ressource }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const Icone = TYPES_MEDIA[r.type].icon;
  return (
    <li>
      <button
        type="button"
        disabled={pending || !r.fichierChemin}
        onClick={() =>
          start(async () => {
            const res = await lienTelechargement(r.id);
            toast(res.message);
            if (res.ok && res.donnee) window.location.assign(res.donnee);
          })
        }
        className="group flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-sunken disabled:opacity-60"
      >
        <span className="relative flex h-12 w-10 shrink-0 items-center justify-center border border-line bg-sunken [clip-path:polygon(0_0,70%_0,100%_22%,100%_100%,0_100%)]">
          <Icone aria-hidden className="size-4" style={{ color: COULEUR_MEDIA[r.type] }} />
          <span className="absolute inset-x-0 bottom-0 text-center text-xs font-bold leading-4 text-white" style={{ background: COULEUR_MEDIA[r.type] }}>
            {(r.format ?? "").slice(0, 4) || TYPES_MEDIA[r.type].label.slice(0, 3)}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-semibold text-text group-hover:underline">{r.titre}</span>
          <span className="block truncate text-xs text-text-3">{TYPES_MEDIA[r.type].label}</span>
        </span>
        <Download aria-label="Télécharger" className="size-4 shrink-0 text-text-3 transition-transform group-hover:translate-y-0.5 group-hover:text-text" />
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
}: {
  profil: ProfilReel | null;
  donnees: DonneesClient;
  recap: Recap;
  annonces: Annonce[];
  agenda: ElementAgenda[];
  palier: number;
}) {
  const maintenant = new Date();
  const aAccepter = donnees.leads.filter((l) => l.statut === "attribue");
  const enCours = donnees.leads.filter((l) => ["accepte", "contacte", "rdv", "devis"].includes(l.statut));
  const savAttente = donnees.sav.filter((s) => s.statut === "infos_demandees");
  const aVenir = agenda
    .filter((e) => e.type !== "visite" && e.type !== "echeance" && new Date(e.fin ?? e.debut) >= maintenant)
    .sort((a, b) => a.debut.localeCompare(b.debut));
  const prochains = aVenir.slice(0, 3);
  // Les trois derniers messages, dans l'ordre de la conversation (le plus récent en bas)
  const fil = [...annonces].sort((a, b) => b.debut.localeCompare(a.debut)).slice(0, 3).reverse();
  const nouveaux = annonces.filter((a) => Date.now() - new Date(a.debut).getTime() < 7 * JOUR).length;

  /* Une seule liste de tâches : rien n'est répété ailleurs sur la page */
  const taches = useMemo(() => {
    const t: Tache[] = [];
    aAccepter.forEach((l) => t.push({ id: `accepter-${l.id}`, titre: `Nouveau lead : ${l.projet}`, detail: [l.ville, l.message ? `« ${l.message} »` : null].filter(Boolean).join(", ") || l.reference, href: `/leads/${l.id}`, lead: l, urgent: true }));
    savAttente.forEach((s) => t.push({ id: `sav-${s.id}`, titre: `Compléter la demande SAV ${s.reference}`, detail: s.produit ?? "Le service SAV attend votre réponse", href: `/sav/${s.id}`, urgent: true }));
    enCours
      .filter((l) => l.statut === "accepte")
      .forEach((l) => t.push({ id: `appeler-${l.id}`, titre: `Appeler ${l.contact ?? "le client"}`, detail: `${l.projet}${l.ville ? `, ${l.ville}` : ""}`, href: `/leads/${l.id}`, urgent: false }));
    enCours
      .filter((l) => l.statut === "devis")
      .forEach((l) => t.push({ id: `relancer-${l.id}`, titre: `Relancer le devis de ${l.contact ?? "votre client"}`, detail: `${l.projet}${l.ville ? `, ${l.ville}` : ""}`, href: `/leads/${l.id}`, urgent: false }));
    return t.slice(0, 6);
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
          className="pb-6"
          title={prenom ? `Bonjour ${prenom}` : "Bonjour"}
          meta={donnees.compte?.niveau_iap ? <NiveauBadge type={donnees.compte.niveau_iap} /> : null}
          description={
            <>
              {dateDuJour.replace(/^./, (c) => c.toLocaleUpperCase("fr-FR"))}
              {donnees.compte?.raison_sociale ? `, ${donnees.compte.raison_sociale}` : ""}
              {donnees.apercu ? <span className="mt-1 block text-sm text-text-3">Aperçu administrateur avec les données réelles du réseau. Le bouton Accepter est masqué.</span> : null}
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
              {taches.some((t) => !t.lead) ? (
                <div>
                  {aAccepter.length ? <p className="text-xs font-semibold text-text-3">Ensuite</p> : null}
                  <ul className="divide-y divide-line">
                    {taches
                      .filter((t) => !t.lead)
                      .map((t) => (
                        <LigneTache key={t.id} t={t} fait={faits.includes(t.id)} basculer={() => basculer(t.id)} />
                      ))}
                  </ul>
                </div>
              ) : null}
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

        {/* ───────── Messages : les codes de la page Messages, dans une carte ───────── */}
        <Carte
          id="fil"
          titre="Le fil Picard"
          icone={MessageCircle}
          ton="success"
          sousTitre={nouveaux ? `${nouveaux} message${nouveaux > 1 ? "s" : ""} cette semaine` : "Chaîne officielle du réseau"}
          lien={{ href: "/news", label: "Tous les messages" }}
        >
          <Link href="/news" className="wa flex h-full flex-col overflow-hidden rounded-md border border-line transition-shadow hover:shadow-card">
            <span className="flex items-center gap-3 bg-[var(--wa-barre)] px-4 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-nav">
                <SymboleEspacePro className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-semibold text-[var(--wa-texte)]">
                  Picard Serrures
                  <BadgeCheck aria-label="Chaîne officielle" className="size-4 fill-[var(--wa-vert)] text-[var(--wa-barre)]" />
                </span>
                <span className="block text-xs text-[var(--wa-texte-2)]">Chaîne officielle du réseau</span>
              </span>
              {nouveaux ? <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--wa-vert)] px-1 text-xs font-bold text-white">{nouveaux}</span> : null}
            </span>
            <span className="wa-fond flex min-h-60 flex-1 flex-col justify-end gap-2 p-4">
              {fil.length ? (
                fil.map((a, i) => (
                  <span key={a.id} className={cn("bulle-entree relative block max-w-[90%] rounded-lg bg-[var(--wa-bulle)] px-3 pb-1 pt-2 shadow-[var(--wa-ombre)]", i === 0 && "rounded-tl-none")} style={{ animationDelay: `${i * 60}ms` }}>
                    {i === 0 ? <span aria-hidden className="absolute -left-2 top-0 h-3 w-2 bg-[var(--wa-bulle)] [clip-path:polygon(0_0,100%_0,100%_100%)]" /> : null}
                    {a.ton !== "info" ? (
                      <span className="block text-xs font-semibold" style={{ color: a.ton === "operation" ? "#e26b00" : "#ea0038" }}>
                        {a.ton === "operation" ? "Opération" : "Important"}
                      </span>
                    ) : null}
                    <span className="line-clamp-2 block text-sm text-[var(--wa-texte)]">
                      {a.contenu.startsWith(a.titre) ? a.contenu : <><span className="font-semibold">{a.titre}</span> {a.contenu}</>}
                    </span>
                    <span className="flex items-center justify-end gap-1 text-xs text-[var(--wa-texte-2)]" suppressHydrationWarning>
                      {jourCourt(a.debut)}
                      <CheckCheck aria-hidden className="size-4 text-[var(--wa-bleu)]" />
                    </span>
                  </span>
                ))
              ) : (
                <span className="mx-auto rounded-lg bg-[var(--wa-bulle)] px-3 py-1 text-xs text-[var(--wa-texte-2)] shadow-[var(--wa-ombre)]">Aucun message pour l’instant</span>
              )}
            </span>
          </Link>
        </Carte>

        {/* ───────── Documents : façon gestionnaire de fichiers ───────── */}
        <Carte id="documents" titre="Nouveautés de la médiathèque" icone={FolderOpen} ton="accent" sousTitre="Brochures, notices, vidéos et photos à télécharger" lien={{ href: "/mediatheque", label: "Médiathèque" }}>
          {donnees.ressources.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {donnees.ressources.map((r) => (
                <FichierDocument key={r.id} r={r} />
              ))}
            </ul>
          ) : (
            <Vide>Aucun document pour l’instant.</Vide>
          )}
        </Carte>
        {/* ───────── Calendrier : grande date, mini frise et code couleur du calendrier ───────── */}
        <Carte
          id="agenda"
          titre="Agenda du réseau"
          icone={CalendarDays}
          ton="warning"
          sousTitre="Salons, formations et opérations à venir"
          lien={{ href: "/calendrier", label: "Calendrier" }}
        >
          <div className="flex items-end justify-between gap-4" suppressHydrationWarning>
            <span>
              <span className="block text-sm font-semibold text-cta-deep">{new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(maintenant).replace(/^./, (c) => c.toLocaleUpperCase("fr-FR"))}</span>
              <span className="block font-display text-3xl font-bold leading-none text-text">{maintenant.getDate()}</span>
            </span>
            <span className="pb-1 text-sm text-text-3">{new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(maintenant)}</span>
          </div>
          {/* Les 60 prochains jours, avec le code couleur des types d'événements */}
          <div className="relative mt-4 h-4" aria-hidden>
            <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
            <span className="absolute top-0 h-4 w-0.5 rounded-full bg-cta" />
            {aVenir
              .filter((e) => new Date(e.debut).getTime() - maintenant.getTime() < 60 * JOUR)
              .map((e) => {
                const debut = Math.max(0, (new Date(e.debut).getTime() - maintenant.getTime()) / JOUR);
                const fin = Math.min(60, (new Date(e.fin ?? e.debut).getTime() - maintenant.getTime()) / JOUR + 1);
                return (
                  <span
                    key={e.id}
                    className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
                    style={{ left: `${(debut / 60) * 100}%`, width: `max(8px, ${((fin - debut) / 60) * 100}%)`, background: TYPES_AGENDA[e.type].couleur }}
                  />
                );
              })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-text-3" aria-hidden>
            <span>Aujourd’hui</span>
            <span>Dans 60 jours</span>
          </div>
          {prochains.length ? (
            <ol className="mt-4 flex flex-col gap-3">
              {prochains.map((e) => {
                const d = new Date(e.debut);
                const j = Math.ceil((d.getTime() - maintenant.getTime()) / JOUR);
                const couleur = TYPES_AGENDA[e.type].couleur;
                return (
                  <li key={e.id}>
                    <Link href="/calendrier" className="flex items-center gap-3 rounded-md transition-colors hover:bg-sunken">
                      <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: couleur }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text">{e.titre}</span>
                        <span className="block truncate text-sm text-text-3">
                          <span style={{ color: couleur }}>{TYPES_AGENDA[e.type].label}</span>, {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(d)}
                          {e.lieu ? `, ${e.lieu}` : ""}
                        </span>
                      </span>
                      <span className="tabular shrink-0 pr-2 text-sm font-semibold" style={{ color: couleur }}>
                        {j <= 0 ? "En cours" : `J-${j}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="mt-4">
              <Vide>Aucun événement à venir.</Vide>
            </div>
          )}
        </Carte>

      </div>
    </div>
  );
}
