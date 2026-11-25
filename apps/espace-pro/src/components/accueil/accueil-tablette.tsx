"use client";

import { BadgeCheck, CheckCheck, Download, Timer } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { accepterLead } from "@/app/(app)/leads/actions";
import { lienTelechargement } from "@/app/(app)/mediatheque/actions";
import { TYPES_AGENDA } from "@/components/accueil/calendrier";
import { SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { TYPES as TYPES_MEDIA } from "@/components/mediatheque/libelles";
import { NAV_ICONS } from "@/components/shell/nav-icons";
import { STATUTS as STATUTS_SAV } from "@/components/sav/libelles";
import { NiveauBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Annonce, ElementAgenda, Recap } from "@/lib/data/accueil";
import type { Ressource } from "@/lib/data/mediatheque";
import type { ProfilReel } from "@/lib/data/types";
import { formatDuree, formatNumber } from "@/lib/format";
import { MODULES, type ModuleId } from "@/lib/roles";
import type { DonneesClient } from "./accueil-client";

/*
 * Accueil « écran de tablette »
 * Un fond d'écran, des widgets qui reprennent chacun les codes de leur appli
 * (Messages façon messagerie, Calendrier avec son code couleur, Leads avec son compte à rebours…),
 * une grille d'applis avec pastilles, et un dock pour les applis favorites.
 */

const JOUR = 86400000;

/** Icônes d'applis : un dégradé par appli, comme sur une tablette */
const APPLIS: Partial<Record<ModuleId, { fond: string }>> = {
  leads: { fond: "linear-gradient(160deg, #ff9a5a, #f2643d)" },
  crm: { fond: "linear-gradient(160deg, #60a5fa, #2563eb)" },
  pilotage: { fond: "linear-gradient(160deg, #a78bfa, #6d28d9)" },
  configurateur: { fond: "linear-gradient(160deg, #1f3b66, #0b2545)" },
  mediatheque: { fond: "linear-gradient(160deg, #5eb3ff, #3b82f6)" },
  marketing: { fond: "linear-gradient(160deg, #fbbf24, #e3a52f)" },
  animations: { fond: "linear-gradient(160deg, #f472b6, #d9468f)" },
  boutique: { fond: "linear-gradient(160deg, #fcd34d, #f59e0b)" },
  sav: { fond: "linear-gradient(160deg, #2dd4bf, #0ea5a0)" },
  campagnes: { fond: "linear-gradient(160deg, #94a3b8, #475569)" },
  news: { fond: "linear-gradient(160deg, #25d366, #00a884)" },
  calendrier: { fond: "#ffffff" },
  administration: { fond: "linear-gradient(160deg, #9ca3af, #4b5563)" },
};
const DOCK: ModuleId[] = ["leads", "configurateur", "news", "calendrier", "mediatheque"];

/* ───────── Icône d'appli ───────── */
function IconeAppli({ id, badge, taille = "md", libelle = true }: { id: ModuleId; badge?: number; taille?: "md" | "lg"; libelle?: boolean }) {
  const Icone = NAV_ICONS[id];
  const d = new Date();
  const dim = taille === "lg" ? "size-16" : "size-16 sm:size-[72px]";
  return (
    <Link href={MODULES[id].href} className="group flex flex-col items-center gap-2" aria-label={`${MODULES[id].label}${badge ? `, ${badge} en attente` : ""}`}>
      <span
        className={cn("relative flex items-center justify-center rounded-[22%] shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-transform duration-200 group-hover:-translate-y-1 group-active:scale-95", dim)}
        style={{ background: APPLIS[id]?.fond ?? "#475569" }}
      >
        {id === "calendrier" ? (
          // L'appli Calendrier affiche le jour, comme sur une tablette
          <span className="flex flex-col items-center leading-none" suppressHydrationWarning>
            <span className="text-xs font-semibold text-[#f2643d]">{new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d)}</span>
            <span className="mt-0.5 font-display text-2xl font-normal text-[#111]">{d.getDate()}</span>
          </span>
        ) : id === "configurateur" ? (
          <SymboleEspacePro className="size-10" />
        ) : (
          <Icone aria-hidden className="size-8 text-white" strokeWidth={1.8} />
        )}
        {badge ? (
          <span className="tabular absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#f2643d] px-1 text-xs font-bold text-white ring-2 ring-white/80">{badge}</span>
        ) : null}
      </span>
      {libelle ? <span className="max-w-20 truncate text-xs font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">{MODULES[id].label}</span> : null}
    </Link>
  );
}

/* ───────── Gabarit de widget ───────── */
function Widget({ className, href, children, style, label }: { className?: string; href?: string; children: React.ReactNode; style?: React.CSSProperties; label: string }) {
  const classe = cn(
    "widget-entree relative flex flex-col overflow-hidden rounded-[28px] bg-surface p-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform duration-200",
    href && "hover:-translate-y-0.5 active:scale-[0.99]",
    className,
  );
  return href ? (
    <Link href={href} className={classe} style={style} aria-label={label}>
      {children}
    </Link>
  ) : (
    <section className={classe} style={style} aria-label={label}>
      {children}
    </section>
  );
}

function TitreWidget({ id, children, couleur }: { id: ModuleId; children?: React.ReactNode; couleur?: string }) {
  const Icone = NAV_ICONS[id];
  return (
    <p className="flex items-center gap-2 text-xs font-semibold" style={{ color: couleur }}>
      <span className="flex size-5 items-center justify-center rounded-[6px]" style={{ background: APPLIS[id]?.fond }}>
        <Icone aria-hidden className={cn("size-3", id === "calendrier" ? "text-[#f2643d]" : "text-white")} strokeWidth={2.4} />
      </span>
      {children ?? MODULES[id].label}
    </p>
  );
}

/* ───────── Widget Leads : compte à rebours comme dans l'appli ───────── */
function WidgetLeads({ donnees, large }: { donnees: DonneesClient; large: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const aAccepter = donnees.leads.filter((l) => l.statut === "attribue");
  const enCours = donnees.leads.filter((l) => ["accepte", "contacte", "rdv", "devis"].includes(l.statut)).length;
  const l = aAccepter[0];
  const ecoule = l?.attribueLe ? (Date.now() - new Date(l.attribueLe).getTime()) / 60000 : 0;
  const reste = l ? Math.max(0, l.delaiMin - ecoule) : 0;
  const part = l ? Math.min(1, ecoule / l.delaiMin) : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <Widget label="Leads" className={cn("col-span-2", large && "lg:col-span-4")}>
      <div className="flex items-center justify-between">
        <TitreWidget id="leads" couleur="#f2643d" />
        <Link href="/leads" className="text-xs font-semibold text-text-3 hover:text-text">
          {enCours} en cours
        </Link>
      </div>
      {l ? (
        <div className="mt-3 flex flex-1 items-center gap-4">
          <span className="relative flex size-16 shrink-0 items-center justify-center">
            <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx={32} cy={32} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={6} />
              <circle cx={32} cy={32} r={r} fill="none" stroke="#f2643d" strokeWidth={6} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * part} />
            </svg>
            <Timer aria-hidden className="size-5 text-[#f2643d]" />
          </span>
          <Link href={`/leads/${l.id}`} className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold text-text">{l.projet}</span>
            <span className="block truncate text-sm text-text-3">{l.ville ?? l.reference}</span>
            <span className="tabular mt-1 block text-xs font-semibold text-[#f2643d]" suppressHydrationWarning>
              {reste > 0 ? `${formatDuree(reste)} pour répondre` : "Délai dépassé"}
              {aAccepter.length > 1 ? `, et ${aAccepter.length - 1} autre${aAccepter.length > 2 ? "s" : ""}` : ""}
            </span>
          </Link>
          {!donnees.apercu ? (
            <button
              type="button"
              disabled={pending || reste <= 0}
              onClick={() => start(async () => toast((await accepterLead(l.id)).message))}
              className="h-10 shrink-0 rounded-full bg-[#f2643d] px-4 text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50"
            >
              Accepter
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex flex-1 items-end justify-between gap-4">
          <span>
            <span className="block font-display text-3xl font-bold text-text">0</span>
            <span className="block text-sm text-text-3">lead à accepter. Vous serez prévenu par e-mail et SMS.</span>
          </span>
        </div>
      )}
    </Widget>
  );
}

/* ───────── Widget Messages : codes de la messagerie ───────── */
function WidgetMessages({ annonces }: { annonces: Annonce[] }) {
  const derniers = annonces.slice(0, 3).reverse();
  const nouveaux = annonces.filter((a) => Date.now() - new Date(a.debut).getTime() < 7 * JOUR).length;
  return (
    <Widget label="Messages" href="/news" className="wa col-span-2 row-span-2 p-0">
      <div className="flex items-center gap-3 bg-[var(--wa-barre)] px-5 py-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-nav">
          <SymboleEspacePro className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-semibold text-[var(--wa-texte)]">
            Picard Serrures
            <BadgeCheck aria-hidden className="size-4 fill-[var(--wa-vert)] text-[var(--wa-barre)]" />
          </span>
          <span className="block text-xs text-[var(--wa-texte-2)]">Chaîne officielle</span>
        </span>
        {nouveaux ? <span className="tabular flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--wa-vert)] px-2 text-xs font-bold text-white">{nouveaux}</span> : null}
      </div>
      <div className="wa-fond flex flex-1 flex-col justify-end gap-2 p-4">
        {derniers.length ? (
          derniers.map((a, i) => (
            <div key={a.id} className={cn("relative max-w-[88%] rounded-lg bg-[var(--wa-bulle)] px-3 py-2 shadow-[var(--wa-ombre)]", i === 0 && "rounded-tl-none")}>
              {i === 0 ? <span aria-hidden className="absolute -left-2 top-0 h-3 w-2 bg-[var(--wa-bulle)] [clip-path:polygon(0_0,100%_0,100%_100%)]" /> : null}
              <p className="line-clamp-2 text-sm text-[var(--wa-texte)]">
                {a.contenu.startsWith(a.titre) ? a.contenu : <><span className="font-semibold">{a.titre}</span> {a.contenu}</>}
              </p>
              <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-[var(--wa-texte-2)]" suppressHydrationWarning>
                {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(a.debut))}
                <CheckCheck aria-hidden className="size-4 text-[var(--wa-bleu)]" />
              </p>
            </div>
          ))
        ) : (
          <p className="mx-auto rounded-lg bg-[var(--wa-bulle)] px-3 py-1 text-xs text-[var(--wa-texte-2)]">Aucun message pour l’instant</p>
        )}
      </div>
    </Widget>
  );
}

/* ───────── Widget Calendrier : grande date et mini frise colorée ───────── */
function WidgetCalendrier({ agenda }: { agenda: ElementAgenda[] }) {
  const maintenant = new Date();
  const prochains = agenda
    .filter((e) => e.type !== "visite" && e.type !== "echeance" && new Date(e.fin ?? e.debut) >= maintenant)
    .sort((a, b) => a.debut.localeCompare(b.debut));
  const fenetre = 60;
  return (
    <Widget label="Calendrier" href="/calendrier" className="col-span-2 row-span-2">
      <div className="flex items-start justify-between gap-4">
        <span suppressHydrationWarning>
          <span className="block text-sm font-semibold capitalize text-[#f2643d]">{new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(maintenant)}</span>
          <span className="block font-display text-3xl font-normal leading-none text-text">{maintenant.getDate()}</span>
          <span className="mt-1 block text-sm capitalize text-text-3">{new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(maintenant)}</span>
        </span>
        <TitreWidget id="calendrier" />
      </div>

      {/* Mini frise des 60 prochains jours, avec le code couleur du calendrier */}
      <div className="relative mt-4 h-6" aria-hidden>
        <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <span className="absolute top-0 h-6 w-0.5 rounded-full bg-[#f2643d]" style={{ left: 0 }} />
        {prochains
          .filter((e) => new Date(e.debut).getTime() - maintenant.getTime() < fenetre * JOUR)
          .map((e) => {
            const debut = Math.max(0, (new Date(e.debut).getTime() - maintenant.getTime()) / JOUR);
            const fin = Math.min(fenetre, (new Date(e.fin ?? e.debut).getTime() - maintenant.getTime()) / JOUR + 1);
            return (
              <span
                key={e.id}
                className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
                style={{ left: `${(debut / fenetre) * 100}%`, width: `max(8px, ${((fin - debut) / fenetre) * 100}%)`, background: TYPES_AGENDA[e.type].couleur }}
              />
            );
          })}
      </div>

      <ol className="mt-4 flex flex-1 flex-col gap-3">
        {prochains.slice(0, 3).map((e) => {
          const d = new Date(e.debut);
          const j = Math.ceil((d.getTime() - maintenant.getTime()) / JOUR);
          return (
            <li key={e.id} className="flex items-center gap-3">
              <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: TYPES_AGENDA[e.type].couleur }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text">{e.titre}</span>
                <span className="block truncate text-xs text-text-3">
                  {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(d)}
                  {e.lieu ? `, ${e.lieu}` : ""}
                </span>
              </span>
              <span className="tabular shrink-0 text-xs font-semibold" style={{ color: TYPES_AGENDA[e.type].couleur }}>
                {j <= 0 ? "En cours" : `J-${j}`}
              </span>
            </li>
          );
        })}
        {!prochains.length ? <li className="text-sm text-text-3">Aucun événement à venir.</li> : null}
      </ol>
    </Widget>
  );
}

/* ───────── Widget Configurateur ───────── */
function WidgetConfigurateur() {
  return (
    <Widget label="Configurer une porte" href="/configurateur" className="group bg-nav text-white" style={{ background: "linear-gradient(160deg, #1f3b66, #0b2545)" }}>
      <svg viewBox="0 0 120 140" className="h-20 w-auto self-start text-white" aria-hidden>
        <path d="M30 130V14h60v116" fill="none" stroke="currentColor" strokeWidth={4} strokeLinejoin="round" />
        <rect x={34} y={18} width={52} height={112} rx={2} fill="var(--cta)" />
        <g className="porte-vantail">
          <rect x={34} y={18} width={52} height={112} rx={2} fill="#13315c" stroke="currentColor" strokeWidth={3} />
          <circle cx={78} cy={74} r={4} fill="var(--cta)" />
        </g>
      </svg>
      <span className="mt-auto block font-display text-lg font-semibold leading-tight">Configurer une porte</span>
      <span className="mt-1 block text-xs text-white/70">Devis en quelques minutes</span>
    </Widget>
  );
}

/* ───────── Widget Points : anneau d'activité ───────── */
function WidgetPoints({ points, palier }: { points: number; palier: number }) {
  const [pret, setPret] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPret(true), 200);
    return () => clearTimeout(t);
  }, []);
  const part = Math.min(1, points / Math.max(1, palier));
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <Widget label="Points fidélité" href="/boutique" className="items-center justify-center">
      <span className="relative flex size-24 items-center justify-center">
        <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx={40} cy={40} r={r} fill="none" stroke="color-mix(in srgb, #f59e0b 18%, transparent)" strokeWidth={9} />
          <circle
            cx={40}
            cy={40}
            r={r}
            fill="none"
            stroke="url(#anneau-points)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={pret ? c * (1 - part) : c}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
          />
          <defs>
            <linearGradient id="anneau-points" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fcd34d" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-center">
          <span className="block font-display tabular text-lg font-bold leading-none text-text">{formatNumber(points)}</span>
          <span className="block text-xs text-text-3">points</span>
        </span>
      </span>
      <span className="mt-2 text-xs text-text-3">Palier à {formatNumber(palier)}</span>
    </Widget>
  );
}

/* ───────── Widget Médiathèque : façon gestionnaire de fichiers ───────── */
const COULEUR_MEDIA: Record<Ressource["type"], string> = { photo: "#3b82f6", video: "#0ea5a0", doc_commerciale: "#f2643d", doc_technique: "#64748b" };
function FichierMedia({ r }: { r: Ressource }) {
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
      className="group flex min-w-0 flex-col items-center gap-2 text-center disabled:opacity-60"
    >
      <span className="relative flex h-16 w-12 items-center justify-center rounded-md border border-line bg-sunken shadow-sm transition-transform group-hover:-translate-y-0.5 [clip-path:polygon(0_0,72%_0,100%_22%,100%_100%,0_100%)]">
        <Icone aria-hidden className="size-5" style={{ color: COULEUR_MEDIA[r.type] }} />
        <span className="absolute inset-x-0 bottom-0 py-0.5 text-xs font-bold leading-none text-white" style={{ background: COULEUR_MEDIA[r.type] }}>
          {(r.format ?? TYPES_MEDIA[r.type].label).slice(0, 4)}
        </span>
      </span>
      <span className="line-clamp-2 w-full text-xs font-medium text-text">{r.titre}</span>
      <Download aria-hidden className="size-3 text-text-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
function WidgetMediatheque({ ressources }: { ressources: Ressource[] }) {
  return (
    <Widget label="Médiathèque" className="col-span-2">
      <div className="flex items-center justify-between">
        <TitreWidget id="mediatheque" couleur="#3b82f6">Récents</TitreWidget>
        <Link href="/mediatheque" className="text-xs font-semibold text-text-3 hover:text-text">
          Tout voir
        </Link>
      </div>
      {ressources.length ? (
        <div className="mt-3 grid flex-1 grid-cols-4 gap-3">
          {ressources.slice(0, 4).map((r) => (
            <FichierMedia key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-text-3">Aucun document pour l’instant.</p>
      )}
    </Widget>
  );
}

/* ───────── Widget SAV ───────── */
function WidgetSav({ sav }: { sav: DonneesClient["sav"] }) {
  const attente = sav.filter((s) => s.statut === "infos_demandees").length;
  return (
    <Widget label="SAV" href={sav[0] ? `/sav/${sav[0].id}` : "/sav/nouvelle"} className="col-span-2">
      <TitreWidget id="sav" couleur="#0ea5a0" />
      <span className="mt-auto block font-display text-3xl font-bold leading-none text-text">{sav.length}</span>
      <span className="mt-1 block text-xs text-text-3">{sav.length > 1 ? "demandes en cours" : "demande en cours"}</span>
      {attente ? (
        <span className="mt-2 self-start rounded-full bg-[#0ea5a0]/15 px-2 py-0.5 text-xs font-semibold text-[#0b7f7b]">{attente} réponse{attente > 1 ? "s" : ""} attendue{attente > 1 ? "s" : ""}</span>
      ) : sav[0] ? (
        <span className="mt-2 truncate text-xs text-text-3">{STATUTS_SAV[sav[0].statut]?.client}</span>
      ) : (
        <span className="mt-2 text-xs font-semibold text-[#0b7f7b]">Déclarer un problème</span>
      )}
    </Widget>
  );
}

/* ───────── Widget Animation ───────── */
function WidgetAnimation({ annonce }: { annonce: Annonce | null }) {
  return (
    <Widget label="Animation en cours" href={annonce?.lienUrl ?? "/animations"} className="col-span-2 text-white" style={{ background: "linear-gradient(150deg, #f472b6, #d9468f 55%, #9d2a6b)" }}>
      <TitreWidget id="animations" couleur="#ffffff">Animation</TitreWidget>
      <span className="mt-auto line-clamp-3 font-display text-base font-semibold leading-tight">{annonce?.titre ?? "Offres, remboursements et parrainage"}</span>
      <span className="mt-2 text-xs font-semibold text-white/80">{annonce?.lienLibelle ?? "Découvrir"}</span>
    </Widget>
  );
}

/* ───────── Widget Activité ───────── */
function WidgetActivite({ donnees }: { donnees: DonneesClient }) {
  const s = donnees.stats;
  const taux = s && s.recus ? Math.round((s.acceptes / s.recus) * 100) : null;
  const barres = [
    { label: "Reçus", valeur: s?.recus ?? 0, couleur: "#3b82f6" },
    { label: "Acceptés", valeur: s?.acceptes ?? 0, couleur: "#0ea5a0" },
  ];
  const max = Math.max(1, ...barres.map((b) => b.valeur));
  return (
    <Widget label="Mon activité" href="/leads" className="col-span-2">
      <div className="flex items-center justify-between">
        <TitreWidget id="pilotage" couleur="#6d28d9">Mon activité sur 12 mois</TitreWidget>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-3 items-end gap-4">
        <span>
          <span className="block font-display tabular text-2xl font-bold leading-none text-text">{taux === null ? "–" : `${taux} %`}</span>
          <span className="mt-1 block text-xs text-text-3">de leads acceptés</span>
        </span>
        <span>
          <span className="block font-display tabular text-2xl font-bold leading-none text-text">{s?.temps_reponse_min ? formatDuree(s.temps_reponse_min) : "–"}</span>
          <span className="mt-1 block text-xs text-text-3">pour répondre</span>
        </span>
        <span className="flex h-16 items-end gap-2">
          {barres.map((b) => (
            <span key={b.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="w-full rounded-t-md" style={{ height: `${Math.max(6, (b.valeur / max) * 48)}px`, background: b.couleur }} />
              <span className="text-xs text-text-3">{b.valeur}</span>
            </span>
          ))}
        </span>
      </div>
    </Widget>
  );
}

/** Accueil des clients, dans le style d'un écran de tablette. */
export function AccueilTablette({
  profil,
  donnees,
  recap,
  annonces,
  agenda,
  palier,
  modules,
}: {
  profil: ProfilReel | null;
  donnees: DonneesClient;
  recap: Recap;
  annonces: Annonce[];
  agenda: ElementAgenda[];
  palier: number;
  modules: ModuleId[];
}) {
  const [heure, setHeure] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setHeure(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const aAccepter = donnees.leads.filter((l) => l.statut === "attribue").length;
  const savAttente = donnees.sav.filter((s) => s.statut === "infos_demandees").length;
  const animation = annonces.find((a) => a.ton === "operation") ?? null;
  const badges: Partial<Record<ModuleId, number>> = useMemo(
    () => ({ leads: aAccepter || undefined, sav: savAttente || undefined, news: annonces.filter((a) => Date.now() - new Date(a.debut).getTime() < 7 * JOUR).length || undefined }),
    [aAccepter, savAttente, annonces],
  );
  const applis = modules.filter((m) => m !== "accueil" && APPLIS[m]);
  const dock = DOCK.filter((m) => applis.includes(m));
  const resume = [aAccepter ? `${aAccepter} lead${aAccepter > 1 ? "s" : ""} à accepter` : null, savAttente ? `${savAttente} réponse${savAttente > 1 ? "s" : ""} SAV attendue${savAttente > 1 ? "s" : ""}` : null]
    .filter(Boolean)
    .join(" et ");

  return (
    <div
      className="relative -mx-4 -my-8 min-h-[calc(100dvh-64px)] overflow-hidden px-4 pb-40 pt-8 sm:-mx-8 sm:-my-12 sm:px-8 sm:pt-12"
      style={{
        background:
          "radial-gradient(900px 520px at 8% -8%, rgba(227,165,47,0.38), transparent 60%), radial-gradient(800px 600px at 100% 10%, rgba(59,130,246,0.38), transparent 60%), radial-gradient(700px 500px at 50% 110%, rgba(217,70,143,0.25), transparent 60%), linear-gradient(160deg, #0b2545, #13315c 50%, #0b1d36)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Horloge et salutation, comme l'écran d'une tablette */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6 text-white">
          <div>
            <p className="font-display text-3xl font-semibold tabular leading-none sm:text-[64px]" suppressHydrationWarning>
              {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(heure)}
            </p>
            <p className="mt-2 text-base text-white/80" suppressHydrationWarning>
              {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(heure).replace(/^./, (c) => c.toLocaleUpperCase("fr-FR"))}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-semibold">{profil?.prenom ? `Bonjour ${profil.prenom}` : "Bonjour"}</p>
            <p className="mt-1 text-sm text-white/70">{resume ? `${resume.charAt(0).toUpperCase()}${resume.slice(1)}.` : "Tout est à jour."}</p>
            {donnees.compte?.niveau_iap ? (
              <p className="mt-2 flex items-center justify-end gap-2 text-sm text-white/80">
                <NiveauBadge type={donnees.compte.niveau_iap} />
                {donnees.compte.raison_sociale}
              </p>
            ) : donnees.apercu ? (
              <p className="mt-2 text-xs text-white/60">Aperçu administrateur, données réelles du réseau</p>
            ) : null}
          </div>
        </header>

        {/* Widgets */}
        <div className="grid auto-rows-[176px] grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {/* Rangées pleines : 2 + 2, puis deux grands widgets, puis 1 + 1 + 2, puis 2 + 2 */}
          <WidgetLeads donnees={donnees} large={!donnees.stats} />
          {donnees.stats ? <WidgetActivite donnees={donnees} /> : null}
          <WidgetMessages annonces={annonces} />
          <WidgetCalendrier agenda={agenda} />
          <WidgetConfigurateur />
          <WidgetPoints points={recap.points} palier={palier} />
          <WidgetMediatheque ressources={donnees.ressources} />
          <WidgetSav sav={donnees.sav} />
          <WidgetAnimation annonce={animation} />
        </div>

        {/* Toutes les applis */}
        <nav aria-label="Applis" className="mt-12 grid grid-cols-4 gap-x-4 gap-y-6 sm:grid-cols-6 lg:grid-cols-8">
          {applis.map((m) => (
            <IconeAppli key={m} id={m} badge={badges[m]} />
          ))}
        </nav>
      </div>

      {/* Dock */}
      {dock.length ? (
        <nav aria-label="Favoris" className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 lg:ml-[120px]">
          <div className="flex items-end gap-4 rounded-[32px] border border-white/20 bg-white/15 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {dock.map((m) => (
              <IconeAppli key={m} id={m} badge={badges[m]} taille="lg" libelle={false} />
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
