"use client";

import {
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Coins,
  Download,
  Inbox,
  LifeBuoy,
  Megaphone,
  Ruler,
  ShoppingBag,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
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
import { ilYa } from "@/lib/temps";

export type DonneesClient = {
  leads: LeadPro[];
  sav: { id: string; reference: string; type: string; statut: keyof typeof STATUTS_SAV; mis_a_jour_le: string; produit: string | null }[];
  ressources: Ressource[];
  stats: StatsPro | null;
  compte: { raison_sociale: string; niveau_iap: "Elite" | "Premium" | "Officiel" | null } | null;
  /** L'administrateur voit l'accueil client avec des données réelles du réseau */
  apercu: boolean;
};

type Conversation = "leads" | "sav" | "picard";

const JOUR = 86400000;
const heure = (iso: string) => {
  const d = new Date(iso);
  return Date.now() - d.getTime() < JOUR
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d)
    : new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(d);
};

/* ───────── Porte animée du raccourci « Configurer une porte » ───────── */
function PorteAnimee() {
  return (
    <svg viewBox="0 0 120 140" className="h-24 w-auto drop-shadow-sm" aria-hidden>
      <path d="M20 132h80" stroke="currentColor" strokeOpacity={0.4} strokeWidth={2} strokeLinecap="round" />
      <path d="M30 130V14h60v116" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" />
      <rect x={34} y={18} width={52} height={112} rx={2} fill="color-mix(in srgb, var(--cta) 45%, transparent)" />
      <g className="porte-vantail">
        <rect x={34} y={18} width={52} height={112} rx={2} fill="var(--surface)" stroke="currentColor" strokeWidth={2.5} />
        <rect x={42} y={28} width={36} height={40} rx={1} fill="none" stroke="currentColor" strokeOpacity={0.4} strokeWidth={1.5} />
        <rect x={42} y={78} width={36} height={40} rx={1} fill="none" stroke="currentColor" strokeOpacity={0.4} strokeWidth={1.5} />
        <circle cx={78} cy={74} r={3} fill="var(--cta)" />
      </g>
      <path d="M100 20v110M96 20h8M96 130h8" stroke="var(--cta)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/* ───────── Anneau de points ───────── */
function AnneauPoints({ points, palier }: { points: number; palier: number }) {
  const [pret, setPret] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPret(true), 100);
    return () => clearTimeout(t);
  }, []);
  const part = Math.min(1, points / Math.max(1, palier));
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <Link href="/boutique" className="group flex items-center gap-3" aria-label={`${formatNumber(points)} points sur ${formatNumber(palier)}`}>
      <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />
        <circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke="var(--cta)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={pret ? c * (1 - part) : c}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
      </svg>
      <span>
        <span className="block font-display tabular text-xl font-bold text-white">{formatNumber(points)}</span>
        <span className="block text-xs text-white/70 group-hover:text-white">points, palier à {formatNumber(palier)}</span>
      </span>
    </Link>
  );
}

/* ───────── Bulle d'un lead à accepter ───────── */
function BulleLead({ l, apercu }: { l: LeadPro; apercu: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const ecoule = l.attribueLe ? (Date.now() - new Date(l.attribueLe).getTime()) / 60000 : 0;
  const reste = Math.max(0, l.delaiMin - ecoule);
  const part = Math.min(1, ecoule / l.delaiMin);
  return (
    <div className="rounded-lg rounded-tl-sm bg-surface p-3 shadow-[0_1px_1px_rgba(11,37,69,0.12)]">
      <p className="text-xs font-semibold text-cta-deep">Nouveau lead {l.reference}</p>
      <p className="mt-1 text-sm font-semibold text-text">
        {l.projet}
        {l.ville ? ` à ${l.ville}` : ""}
      </p>
      {l.message ? <p className="mt-1 line-clamp-2 text-sm text-text-2">« {l.message} »</p> : null}
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full" style={{ width: `${part * 100}%`, background: part > 0.7 ? "var(--danger)" : "var(--cta)" }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-text-3">
          <Timer aria-hidden className="size-3" />
          {reste > 0 ? `Encore ${formatDuree(reste)}` : "Délai dépassé"}
        </span>
        <span className="ml-auto flex gap-2">
          <Link href={`/leads/${l.id}`} className="inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold text-text-2 hover:bg-sunken">
            Voir
          </Link>
          {!apercu ? (
            <button
              type="button"
              disabled={pending || reste <= 0}
              onClick={() => start(async () => toast((await accepterLead(l.id)).message))}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-success px-3 text-xs font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Check aria-hidden className="size-3" />
              Accepter
            </button>
          ) : null}
        </span>
      </div>
    </div>
  );
}

/* ───────── Ressource téléchargeable ───────── */
function TuileRessource({ r }: { r: Ressource }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const Icone = TYPES_MEDIA[r.type].icon;
  return (
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
      className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/10 disabled:opacity-60"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10">
        <Icone aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{r.titre}</span>
        <span className="block truncate text-xs opacity-70">{TYPES_MEDIA[r.type].label}</span>
      </span>
      <Download aria-hidden className="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-y-0.5 group-hover:opacity-100" />
    </button>
  );
}

/** Accueil des clients : un poste de pilotage personnel, vivant et actionnable. */
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
  const animation = annonces.find((a) => a.ton === "operation") ?? null;
  const prochains = agenda
    .filter((e) => e.type !== "visite" && e.type !== "echeance" && new Date(e.fin ?? e.debut) >= maintenant)
    .sort((a, b) => a.debut.localeCompare(b.debut))
    .slice(0, 4);

  /* Conversations façon messagerie */
  const conversations: { id: Conversation; nom: string; couleur: string; icone: typeof Inbox; dernier: string; quand: string | null; nonLus: number }[] = [
    {
      id: "leads",
      nom: "Leads Picard",
      couleur: "var(--cta)",
      icone: Inbox,
      dernier: aAccepter[0] ? `Nouveau lead : ${aAccepter[0].projet}${aAccepter[0].ville ? ` à ${aAccepter[0].ville}` : ""}` : enCours[0] ? `${enCours.length} projet${enCours.length > 1 ? "s" : ""} en cours` : "Aucun nouveau lead",
      quand: aAccepter[0]?.attribueLe ?? enCours[0]?.attribueLe ?? null,
      nonLus: aAccepter.length,
    },
    {
      id: "sav",
      nom: "Service SAV",
      couleur: "var(--accent)",
      icone: LifeBuoy,
      dernier: donnees.sav[0] ? `${donnees.sav[0].reference} : ${STATUTS_SAV[donnees.sav[0].statut]?.client ?? ""}` : "Aucune demande en cours",
      quand: donnees.sav[0]?.mis_a_jour_le ?? null,
      nonLus: savAttente.length,
    },
    {
      id: "picard",
      nom: "Picard Serrures",
      couleur: "#0b2545",
      icone: Megaphone,
      dernier: annonces[0]?.titre ?? "Aucune annonce",
      quand: annonces[0]?.debut ?? null,
      nonLus: annonces.filter((a) => Date.now() - new Date(a.debut).getTime() < 7 * JOUR).length,
    },
  ];
  const [ouverte, setOuverte] = useState<Conversation | null>(aAccepter.length ? "leads" : savAttente.length ? "sav" : "picard");

  /* Actions à faire, cochables (mémorisées dans le navigateur) */
  const actions = useMemo(() => {
    const a: { id: string; texte: string; href: string; urgent?: boolean; icone: typeof Inbox }[] = [];
    aAccepter.forEach((l) => a.push({ id: `accepter-${l.id}`, texte: `Accepter le lead ${l.projet}${l.ville ? ` à ${l.ville}` : ""}`, href: `/leads/${l.id}`, urgent: true, icone: Inbox }));
    savAttente.forEach((s) => a.push({ id: `sav-${s.id}`, texte: `Répondre au SAV ${s.reference}`, href: `/sav/${s.id}`, urgent: true, icone: LifeBuoy }));
    enCours
      .filter((l) => l.statut === "accepte")
      .forEach((l) => a.push({ id: `appeler-${l.id}`, texte: `Appeler ${l.contact ?? "le client"} pour son projet ${l.projet}`, href: `/leads/${l.id}`, icone: Inbox }));
    enCours
      .filter((l) => l.statut === "devis")
      .forEach((l) => a.push({ id: `relancer-${l.id}`, texte: `Relancer le devis de ${l.contact ?? "votre client"}`, href: `/leads/${l.id}`, icone: Inbox }));
    if (animation) a.push({ id: `animation-${animation.id}`, texte: `Participer : ${animation.titre}`, href: animation.lienUrl ?? "/news", icone: Megaphone });
    return a.slice(0, 7);
  }, [aAccepter, savAttente, enCours, animation]);

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
  const nbFaits = actions.filter((a) => faits.includes(a.id)).length;

  const prenom = profil?.prenom ?? "";
  const resume = [
    aAccepter.length ? `${aAccepter.length} lead${aAccepter.length > 1 ? "s" : ""} à accepter` : null,
    savAttente.length ? `${savAttente.length} réponse${savAttente.length > 1 ? "s" : ""} attendue${savAttente.length > 1 ? "s" : ""} par le SAV` : null,
    prochains[0] ? `prochain rendez-vous : ${prochains[0].titre}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const tauxAcceptation = donnees.stats && donnees.stats.recus ? Math.round((donnees.stats.acceptes / donnees.stats.recus) * 100) : null;
  const dateDuJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(maintenant);

  return (
    <div className="flex flex-col gap-6">
      {/* ───────── Cockpit ───────── */}
      <section className="relative overflow-hidden rounded-lg bg-nav-gradient p-6 text-white shadow-lg sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-cta/20 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm capitalize text-white/70">{dateDuJour}</p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{prenom ? `Bonjour ${prenom}` : "Bonjour"}</h1>
            <p className="mt-2 max-w-xl text-base text-white/80">{resume ? `${resume.charAt(0).toUpperCase()}${resume.slice(1)}.` : "Tout est à jour. Belle journée !"}</p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              {donnees.compte?.niveau_iap ? (
                <span className="flex items-center gap-2">
                  <NiveauBadge type={donnees.compte.niveau_iap} />
                  <span className="text-sm text-white/80">{donnees.compte.raison_sociale}</span>
                </span>
              ) : donnees.apercu ? (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Aperçu administrateur, données réelles du réseau</span>
              ) : null}
              <AnneauPoints points={recap.points} palier={palier} />
            </div>
          </div>

          <Link
            href="/configurateur"
            className="group relative flex items-center gap-4 overflow-hidden rounded-lg bg-white/10 p-4 pr-6 ring-1 ring-white/20 backdrop-blur transition-[transform,background-color] duration-300 hover:-translate-y-1 hover:bg-white/15"
          >
            <span className="text-white">
              <PorteAnimee />
            </span>
            <span>
              <span className="flex items-center gap-1 text-xs font-semibold text-cta">
                <Ruler aria-hidden className="size-3" />
                Configurateur
              </span>
              <span className="mt-1 block font-display text-xl font-semibold leading-tight">Configurer
                <br />
                une porte
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-sm text-white/80 group-hover:text-white">
                Devis en quelques minutes
                <ChevronRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </span>
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* ───────── Messagerie ───────── */}
        <section className="overflow-hidden rounded-lg border border-line bg-surface shadow-card" aria-labelledby="messagerie">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#0b2545]">
              <SymboleEspacePro className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="messagerie" className="font-semibold text-text">Mes messages</h2>
              <p className="text-xs text-text-3">Leads, SAV et annonces au même endroit</p>
            </div>
          </header>
          <ul>
            {conversations.map((c) => {
              const Icone = c.icone;
              const actif = ouverte === c.id;
              return (
                <li key={c.id} className="border-b border-line last:border-b-0">
                  <button type="button" onClick={() => setOuverte(actif ? null : c.id)} aria-expanded={actif} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sunken">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full text-white" style={{ background: c.couleur }}>
                      <Icone aria-hidden className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold text-text">{c.nom}</span>
                        <span className={cn("shrink-0 text-xs", c.nonLus ? "font-semibold text-success" : "text-text-3")} suppressHydrationWarning>
                          {c.quand ? heure(c.quand) : ""}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1 text-sm text-text-2">
                          {!c.nonLus ? <CheckCheck aria-hidden className="size-4 shrink-0 text-accent" /> : null}
                          <span className="truncate">{c.dernier}</span>
                        </span>
                        {c.nonLus ? <span className="tabular flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-success px-1 text-xs font-bold text-white">{c.nonLus}</span> : null}
                      </span>
                    </span>
                    <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-text-3 transition-transform", actif && "rotate-180")} />
                  </button>
                  {actif ? (
                    <div
                      className="flex max-h-[420px] flex-col gap-2 overflow-y-auto px-4 py-4"
                      style={{ backgroundColor: "color-mix(in srgb, var(--cta) 6%, var(--surface-sunken))" }}
                    >
                      {c.id === "leads" ? (
                        aAccepter.length || enCours.length ? (
                          <>
                            {aAccepter.map((l) => (
                              <div key={l.id} className="bulle-entree max-w-[92%]">
                                <BulleLead l={l} apercu={donnees.apercu} />
                              </div>
                            ))}
                            {enCours.slice(0, 4).map((l) => (
                              <Link key={l.id} href={`/leads/${l.id}`} className="bulle-entree max-w-[92%] rounded-lg rounded-tl-sm bg-surface p-3 shadow-[0_1px_1px_rgba(11,37,69,0.12)] transition-colors hover:bg-sunken">
                                <span className="block text-sm text-text">
                                  {l.contact ?? "Client"}, {l.projet}
                                </span>
                                <span className="mt-1 flex items-center justify-end gap-1 text-xs text-text-3">
                                  En cours
                                  <CheckCheck aria-hidden className="size-4 text-accent" />
                                </span>
                              </Link>
                            ))}
                            <Link href="/leads" className="mx-auto mt-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-accent shadow-card">
                              Tous mes leads
                            </Link>
                          </>
                        ) : (
                          <p className="mx-auto rounded-full bg-surface px-3 py-1 text-xs text-text-2 shadow-card">Vous serez prévenu ici, par e-mail et par SMS.</p>
                        )
                      ) : c.id === "sav" ? (
                        donnees.sav.length ? (
                          <>
                            {donnees.sav.map((s) => (
                              <Link
                                key={s.id}
                                href={`/sav/${s.id}`}
                                className={cn("bulle-entree max-w-[92%] rounded-lg rounded-tl-sm bg-surface p-3 shadow-[0_1px_1px_rgba(11,37,69,0.12)] transition-colors hover:bg-sunken", s.statut === "infos_demandees" && "ring-1 ring-warning/50")}
                              >
                                <span className="block text-xs font-semibold text-accent">{s.reference}{s.produit ? `, ${s.produit}` : ""}</span>
                                <span className="mt-1 block text-sm text-text">{STATUTS_SAV[s.statut]?.client}</span>
                                <span className="mt-1 block text-right text-xs text-text-3" suppressHydrationWarning>
                                  {heure(s.mis_a_jour_le)}
                                </span>
                              </Link>
                            ))}
                            <Link href="/sav/nouvelle" className="mx-auto mt-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-accent shadow-card">
                              Déclarer un problème
                            </Link>
                          </>
                        ) : (
                          <p className="mx-auto rounded-full bg-surface px-3 py-1 text-xs text-text-2 shadow-card">Aucune demande SAV en cours.</p>
                        )
                      ) : annonces.length ? (
                        <>
                          {annonces.slice(0, 4).map((a) => (
                            <Link key={a.id} href="/news" className="bulle-entree max-w-[92%] rounded-lg rounded-tl-sm bg-surface p-3 shadow-[0_1px_1px_rgba(11,37,69,0.12)] transition-colors hover:bg-sunken">
                              <span className="block text-sm font-semibold text-text">{a.titre}</span>
                              <span className="mt-1 line-clamp-2 block text-sm text-text-2">{a.contenu}</span>
                            </Link>
                          ))}
                          <Link href="/news" className="mx-auto mt-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-accent shadow-card">
                            Toutes les annonces
                          </Link>
                        </>
                      ) : (
                        <p className="mx-auto rounded-full bg-surface px-3 py-1 text-xs text-text-2 shadow-card">Aucune annonce pour l’instant.</p>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        {/* ───────── À faire et agenda ───────── */}
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-line bg-surface p-5 shadow-card" aria-labelledby="a-faire">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="a-faire" className="font-semibold text-text">À faire</h2>
              <span className="tabular text-xs text-text-3">
                {nbFaits} sur {actions.length}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
              <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${actions.length ? (nbFaits / actions.length) * 100 : 100}%` }} />
            </div>
            {actions.length ? (
              <ul className="mt-4 flex flex-col gap-1">
                {actions.map((a) => {
                  const fait = faits.includes(a.id);
                  return (
                    <li key={a.id} className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-sunken">
                      <button
                        type="button"
                        onClick={() => basculer(a.id)}
                        aria-pressed={fait}
                        aria-label={fait ? "Marquer comme à faire" : "Marquer comme fait"}
                        className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", fait ? "border-success bg-success text-white" : a.urgent ? "border-cta" : "border-line-strong")}
                      >
                        {fait ? <Check aria-hidden className="size-3" /> : null}
                      </button>
                      <Link href={a.href} className={cn("min-w-0 flex-1 truncate text-sm", fait ? "text-text-3 line-through" : "text-text")}>
                        {a.texte}
                      </Link>
                      {a.urgent && !fait ? <span className="shrink-0 rounded-full bg-cta/20 px-2 text-xs font-semibold text-cta-deep">Urgent</span> : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm text-text-2">
                <BadgeCheck aria-hidden className="size-4 text-success" />
                Rien à faire pour l’instant.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-5 shadow-card" aria-labelledby="agenda">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="agenda" className="flex items-center gap-2 font-semibold text-text">
                <CalendarDays aria-hidden className="size-4 text-accent" />
                Prochains rendez-vous
              </h2>
              <Link href="/calendrier" className="text-xs font-semibold text-accent hover:underline">
                Calendrier
              </Link>
            </div>
            {prochains.length ? (
              <ol className="mt-4 flex flex-col gap-3">
                {prochains.map((e) => {
                  const d = new Date(e.debut);
                  const j = Math.ceil((d.getTime() - maintenant.getTime()) / JOUR);
                  return (
                    <li key={e.id} className="flex items-center gap-3">
                      <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-md text-white" style={{ background: TYPES_AGENDA[e.type].couleur }}>
                        <span className="font-display text-base font-bold leading-none">{d.getDate()}</span>
                        <span className="text-xs leading-none">{new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text">{e.titre}</span>
                        <span className="block truncate text-xs text-text-3">
                          {TYPES_AGENDA[e.type].label}
                          {e.lieu ? `, ${e.lieu}` : ""}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-xs font-semibold text-text-2">{j <= 0 ? "En cours" : `J-${j}`}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-text-3">Aucun événement à venir.</p>
            )}
          </section>
        </div>

        {/* ───────── Raccourcis ───────── */}
        <div className="flex flex-col gap-6">
          {animation ? (
            <Link href={animation.lienUrl ?? "/news"} className="group relative overflow-hidden rounded-lg bg-cta p-5 text-cta-text shadow-cta transition-transform hover:-translate-y-0.5">
              <Sparkles aria-hidden className="absolute -right-2 -top-2 size-20 opacity-20 transition-transform duration-500 group-hover:rotate-12" />
              <span className="text-xs font-bold">Animation en cours</span>
              <span className="mt-1 block font-display text-lg font-semibold leading-tight">{animation.titre}</span>
              <span className="mt-2 line-clamp-2 block text-sm opacity-80">{animation.contenu}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                {animation.lienLibelle ?? "J’en profite"}
                <ChevronRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ) : null}

          <section className="rounded-lg bg-[#0b2545] p-4 text-white shadow-card" aria-labelledby="nouveautes">
            <div className="mb-2 flex items-baseline justify-between gap-2 px-2">
              <h2 id="nouveautes" className="font-semibold">Derniers documents</h2>
              <Link href="/mediatheque" className="text-xs font-semibold text-cta hover:underline">
                Médiathèque
              </Link>
            </div>
            {donnees.ressources.length ? (
              <ul>
                {donnees.ressources.map((r) => (
                  <li key={r.id}>
                    <TuileRessource r={r} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 text-sm text-white/70">Aucun document pour l’instant.</p>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/sav/nouvelle" className="group flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <LifeBuoy aria-hidden className="size-5" />
              </span>
              <span className="text-sm font-semibold text-text">Déclarer un SAV</span>
            </Link>
            <Link href="/boutique" className="group flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5">
              <span className="flex size-10 items-center justify-center rounded-full bg-cta/20 text-cta-deep">
                <ShoppingBag aria-hidden className="size-5" />
              </span>
              <span className="text-sm font-semibold text-text">Boutique</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ───────── Mon activité ───────── */}
      {donnees.stats ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Mon activité sur 12 mois">
          {[
            { label: "Leads reçus", valeur: String(donnees.stats.recus), icone: Inbox },
            { label: "Taux d’acceptation", valeur: tauxAcceptation === null ? "–" : `${tauxAcceptation} %`, icone: Check },
            { label: "Temps de réponse", valeur: donnees.stats.temps_reponse_min ? formatDuree(donnees.stats.temps_reponse_min) : "–", icone: Timer },
            { label: "Satisfaction client", valeur: donnees.stats.nps === null ? "–" : String(donnees.stats.nps), icone: Coins },
          ].map((s) => {
            const Icone = s.icone;
            return (
              <div key={s.label} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-card">
                <Icone aria-hidden className="size-5 text-accent" />
                <span>
                  <span className="block font-display tabular text-lg font-bold text-text">{s.valeur}</span>
                  <span className="block text-xs text-text-3">{s.label}</span>
                </span>
              </div>
            );
          })}
        </section>
      ) : null}
      {donnees.apercu ? (
        <p className="flex items-center gap-2 text-xs text-text-3">
          <X aria-hidden className="size-3" />
          En aperçu, les boutons d’acceptation sont masqués : seul l’installateur concerné peut accepter ses leads.
        </p>
      ) : null}
      <span className="sr-only" suppressHydrationWarning>
        Mis à jour {ilYa(maintenant.toISOString())}
      </span>
    </div>
  );
}
