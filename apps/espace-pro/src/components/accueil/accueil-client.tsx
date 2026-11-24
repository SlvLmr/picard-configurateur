"use client";

import { Check, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { accepterLead } from "@/app/(app)/leads/actions";
import { lienTelechargement } from "@/app/(app)/mediatheque/actions";
import { TYPES_AGENDA } from "@/components/accueil/calendrier";
import { SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { TYPES as TYPES_MEDIA } from "@/components/mediatheque/libelles";
import { STATUTS as STATUTS_SAV } from "@/components/sav/libelles";
import { NiveauBadge } from "@/components/ui/badge";
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

/* ───────── Carte : un seul gabarit pour toutes les zones ───────── */
function Carte({ id, titre, compteur, lien, children, className }: { id: string; titre: string; compteur?: string; lien?: { href: string; label: string }; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("flex flex-col rounded-lg border border-line bg-surface shadow-card", className)}>
      <header className="flex items-baseline gap-2 px-6 pb-4 pt-6">
        <h2 id={id} className="font-display text-lg font-semibold text-text">
          {titre}
        </h2>
        {compteur ? <span className="tabular text-sm text-text-3">{compteur}</span> : null}
        {lien ? (
          <Link href={lien.href} className="ml-auto text-sm font-medium text-text-2 underline-offset-4 hover:text-text hover:underline">
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

/* ───────── Porte qui s'ouvre au survol du configurateur ───────── */
function PorteAnimee() {
  return (
    <svg viewBox="0 0 120 140" className="h-24 w-auto" aria-hidden>
      <path d="M20 132h80" stroke="currentColor" strokeOpacity={0.3} strokeWidth={2} strokeLinecap="round" />
      <path d="M30 130V14h60v116" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" />
      <rect x={34} y={18} width={52} height={112} rx={2} fill="var(--cta)" />
      <g className="porte-vantail">
        <rect x={34} y={18} width={52} height={112} rx={2} fill="var(--nav-bg)" stroke="currentColor" strokeWidth={2.5} />
        <rect x={42} y={28} width={36} height={40} rx={1} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1.5} />
        <rect x={42} y={78} width={36} height={40} rx={1} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1.5} />
        <circle cx={78} cy={74} r={3} fill="var(--cta)" />
      </g>
    </svg>
  );
}

/* ───────── Jauge de points, sur le même modèle que les autres chiffres ───────── */
function Chiffre({ valeur, label, part, href }: { valeur: string; label: string; part?: number; href?: string }) {
  const [pret, setPret] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPret(true), 120);
    return () => clearTimeout(t);
  }, []);
  const contenu = (
    <>
      <span className="block font-display tabular text-xl font-bold text-white">{valeur}</span>
      <span className="mt-1 block text-xs text-nav-muted">{label}</span>
      <span className="mt-3 block h-1 overflow-hidden rounded-full bg-white/10">
        {part !== undefined ? (
          <span className="block h-full rounded-full bg-cta transition-[width] duration-1000 ease-out" style={{ width: pret ? `${Math.min(1, part) * 100}%` : 0 }} />
        ) : null}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="block min-w-0 hover:opacity-90">
      {contenu}
    </Link>
  ) : (
    <div className="min-w-0">{contenu}</div>
  );
}

/* ───────── Tâche : un lead à accepter, un SAV à compléter, un client à rappeler ───────── */
type Tache = { id: string; titre: string; detail: string; href: string; lead?: LeadPro; urgent: boolean };

function LigneTache({ t, fait, basculer, apercu }: { t: Tache; fait: boolean; basculer: () => void; apercu: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const l = t.lead;
  const ecoule = l?.attribueLe ? (Date.now() - new Date(l.attribueLe).getTime()) / 60000 : 0;
  const reste = l ? Math.max(0, l.delaiMin - ecoule) : 0;
  const part = l ? Math.min(1, ecoule / l.delaiMin) : 0;

  return (
    <li className="flex items-start gap-4 py-4">
      {l ? (
        <span aria-hidden className="mt-1 size-5 shrink-0 rounded-full border-2 border-cta bg-cta/20" />
      ) : (
        <button
          type="button"
          onClick={basculer}
          aria-pressed={fait}
          aria-label={fait ? "Marquer comme à faire" : "Marquer comme fait"}
          className={cn("mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", fait ? "border-text bg-text text-surface" : t.urgent ? "border-cta" : "border-line-strong hover:border-text-2")}
        >
          {fait ? <Check aria-hidden className="size-3" /> : null}
        </button>
      )}
      <div className="min-w-0 flex-1">
        <Link href={t.href} className={cn("block text-sm font-semibold hover:underline", fait ? "text-text-3 line-through" : "text-text")}>
          {t.titre}
        </Link>
        <p className="mt-0.5 truncate text-sm text-text-3">{t.detail}</p>
        {l ? (
          <div className="mt-3 flex items-center gap-3">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
              <span className="block h-full rounded-full bg-cta" style={{ width: `${part * 100}%` }} />
            </span>
            <span className="tabular shrink-0 text-xs text-text-3" suppressHydrationWarning>
              {reste > 0 ? `${formatDuree(reste)} pour répondre` : "Délai dépassé"}
            </span>
          </div>
        ) : null}
      </div>
      {l && !apercu ? (
        <button
          type="button"
          disabled={pending || reste <= 0}
          onClick={() => start(async () => toast((await accepterLead(l.id)).message))}
          className="inline-flex h-10 shrink-0 items-center rounded-full bg-cta px-4 text-sm font-semibold text-cta-text transition-colors hover:bg-cta-hover disabled:opacity-50"
        >
          Accepter
        </button>
      ) : null}
    </li>
  );
}

/* ───────── Document téléchargeable ───────── */
function LigneDocument({ r }: { r: Ressource }) {
  const toast = useToast();
  const [pending, start] = useTransition();
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
        className="group flex w-full items-center gap-4 py-3 text-left disabled:opacity-60"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text group-hover:underline">{r.titre}</span>
          <span className="block truncate text-sm text-text-3">{TYPES_MEDIA[r.type].label}</span>
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
  const prochains = agenda
    .filter((e) => e.type !== "visite" && e.type !== "echeance" && new Date(e.fin ?? e.debut) >= maintenant)
    .sort((a, b) => a.debut.localeCompare(b.debut))
    .slice(0, 4);
  const fil = [...annonces].sort((a, b) => Number(b.ton === "operation") - Number(a.ton === "operation") || b.debut.localeCompare(a.debut)).slice(0, 3);

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
  const phrase =
    restantes === 0
      ? "Tout est à jour. Belle journée."
      : `${restantes} chose${restantes > 1 ? "s" : ""} à traiter aujourd’hui${aAccepter.length ? `, dont ${aAccepter.length} lead${aAccepter.length > 1 ? "s" : ""} à accepter` : ""}.`;
  const tauxAcceptation = donnees.stats && donnees.stats.recus ? Math.round((donnees.stats.acceptes / donnees.stats.recus) * 100) : null;
  const dateDuJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(maintenant);

  return (
    <div className="flex flex-col gap-6">
      {/* ───────── Bandeau ───────── */}
      <section className="overflow-hidden rounded-lg bg-nav text-white shadow-card">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm capitalize text-nav-muted">{dateDuJour}</p>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{prenom ? `Bonjour ${prenom}` : "Bonjour"}</h1>
            <p className="mt-3 max-w-xl text-base text-white/80">{phrase}</p>
            {donnees.compte?.niveau_iap ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-nav-muted">
                <NiveauBadge type={donnees.compte.niveau_iap} />
                {donnees.compte.raison_sociale}
              </p>
            ) : donnees.apercu ? (
              <p className="mt-4 text-sm text-nav-muted">Aperçu administrateur avec les données réelles du réseau. Le bouton Accepter est masqué.</p>
            ) : null}
          </div>

          <Link href="/configurateur" className="group flex items-center gap-6 rounded-lg bg-white/5 p-4 pr-8 ring-1 ring-white/10 transition-colors hover:bg-white/10">
            <span className="text-white">
              <PorteAnimee />
            </span>
            <span>
              <span className="block font-display text-xl font-semibold leading-tight">Configurer une porte</span>
              <span className="mt-1 block text-sm text-nav-muted">Votre devis en quelques minutes</span>
              <span className="mt-4 inline-flex h-10 items-center rounded-full bg-cta px-4 text-sm font-semibold text-cta-text transition-colors group-hover:bg-cta-hover">Commencer</span>
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t border-white/10 px-6 py-6 sm:px-8 lg:grid-cols-4">
          <Chiffre valeur={formatNumber(recap.points)} label={`points, prochain palier à ${formatNumber(palier)}`} part={recap.points / Math.max(1, palier)} href="/boutique" />
          <Chiffre valeur={donnees.stats ? String(donnees.stats.recus) : "–"} label="leads reçus sur 12 mois" />
          <Chiffre valeur={tauxAcceptation === null ? "–" : `${tauxAcceptation} %`} label="de leads acceptés" part={tauxAcceptation === null ? undefined : tauxAcceptation / 100} />
          <Chiffre valeur={donnees.stats?.temps_reponse_min ? formatDuree(donnees.stats.temps_reponse_min) : "–"} label="temps de réponse moyen" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* ───────── À traiter ───────── */}
        <Carte id="a-traiter" titre="À traiter" compteur={taches.length ? `${restantes} sur ${taches.length}` : undefined} lien={{ href: "/leads", label: "Mes leads" }}>
          {taches.length ? (
            <ul className="-mt-4 divide-y divide-line">
              {taches.map((t) => (
                <LigneTache key={t.id} t={t} fait={faits.includes(t.id)} basculer={() => basculer(t.id)} apercu={donnees.apercu} />
              ))}
            </ul>
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

        {/* ───────── Fil Picard, dans l'esprit de la page Messages ───────── */}
        <Carte id="fil" titre="Picard Serrures" compteur="canal officiel" lien={{ href: "/news", label: "Ouvrir le canal" }}>
          {fil.length ? (
            <ol className="flex flex-col gap-3 rounded-md bg-sunken p-4">
              {fil.map((a) => (
                <li key={a.id} className="bulle-entree flex items-end gap-2">
                  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-nav">
                    <SymboleEspacePro className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-lg rounded-bl-sm bg-surface p-3 shadow-card">
                    {a.ton === "operation" ? <p className="text-xs font-semibold text-cta-deep">Animation en cours</p> : null}
                    <p className="text-sm font-semibold text-text">{a.titre}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-text-2">{a.contenu}</p>
                    <p className="mt-2 flex items-center gap-3 text-xs text-text-3">
                      {a.ton === "operation" && a.lienUrl ? (
                        <Link href={a.lienUrl} className="font-semibold text-text underline underline-offset-4">
                          {a.lienLibelle ?? "J’en profite"}
                        </Link>
                      ) : null}
                      <span className="ml-auto" suppressHydrationWarning>
                        {jourCourt(a.debut)}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Vide>Aucune annonce pour l’instant.</Vide>
          )}
        </Carte>

        {/* ───────── Agenda ───────── */}
        <Carte id="agenda" titre="Prochains rendez-vous" lien={{ href: "/calendrier", label: "Calendrier" }}>
          {prochains.length ? (
            <ol className="-mt-3 divide-y divide-line">
              {prochains.map((e) => {
                const d = new Date(e.debut);
                const j = Math.ceil((d.getTime() - maintenant.getTime()) / JOUR);
                return (
                  <li key={e.id} className="flex items-center gap-4 py-3">
                    <span className="flex w-12 shrink-0 flex-col items-center">
                      <span className="font-display tabular text-xl font-bold leading-none text-text">{d.getDate()}</span>
                      <span className="mt-1 text-xs text-text-3">{new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text">{e.titre}</span>
                      <span className="block truncate text-sm text-text-3">
                        {TYPES_AGENDA[e.type].label}
                        {e.lieu ? `, ${e.lieu}` : ""}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-sm text-text-3">{j <= 0 ? "En cours" : `J-${j}`}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Vide>Aucun événement à venir.</Vide>
          )}
        </Carte>

        {/* ───────── Documents ───────── */}
        <Carte id="documents" titre="Derniers documents" lien={{ href: "/mediatheque", label: "Médiathèque" }}>
          {donnees.ressources.length ? (
            <ul className="-mt-3 divide-y divide-line">
              {donnees.ressources.map((r) => (
                <LigneDocument key={r.id} r={r} />
              ))}
            </ul>
          ) : (
            <Vide>Aucun document pour l’instant.</Vide>
          )}
        </Carte>
      </div>
    </div>
  );
}
