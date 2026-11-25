"use client";

import {
  CalendarClock,
  CalendarDays,
  MessageCircle,
  ChartLine,
  ClipboardCheck,
  Coins,
  FileText,
  Handshake,
  Hourglass,
  Inbox,
  LifeBuoy,
  MessageSquareWarning,
  Megaphone,
  Route,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { Briques, type Brique } from "@/components/accueil/briques";
import { Carte } from "@/components/accueil/carte";
import { CanalMessages } from "@/components/communication/canal-messages";
import { FriseCalendrier } from "@/components/communication/frise-calendrier";
import { LeadQueue } from "@/components/leads/lead-queue";
import { LeadQueueReel } from "@/components/leads/lead-queue-reel";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Jauge } from "@/components/ui/jauge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import type { Annonce, ElementAgenda, Recap } from "@/lib/data/accueil";
import type { JourneeCommercial } from "@/lib/data/crm";
import type { Signal } from "@/lib/data/pilotage";
import type { LeadReel, ProfilReel, StatsLeads } from "@/lib/data/types";
import { formatDate, formatNumber } from "@/lib/format";
import { LEADS } from "@/lib/mock/leads";
import { type RoleId } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { AccueilClient, type DonneesClient } from "@/components/accueil/accueil-client";

type Reel = { leads: LeadReel[]; stats: StatsLeads | null; peutAttribuer: boolean } | null;
type Vue = "repartition" | "commercial" | "client" | "sav" | "direction";


const vueDuRole = (r: RoleId): Vue =>
  r === "repartiteur" ? "repartition"
  : r === "atc" ? "commercial"
  : r === "client_gerant" || r === "client_equipe" ? "client"
  : r === "sav" || r === "bureau_etudes" || r === "qualite" ? "sav"
  : "direction";

const aujourdhui = () => {
  const s = formatDate(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export function AccueilParRole({
  profil,
  recap,
  annonces,
  agenda,
  reel,
  journee,
  signaux,
  palier,
  client,
}: {
  profil: ProfilReel | null;
  recap: Recap;
  annonces: Annonce[];
  agenda: ElementAgenda[];
  reel: Reel;
  journee: JourneeCommercial | null;
  signaux: Signal[];
  palier: number;
  client: DonneesClient | null;
}) {
  const { persona } = useSession();
  // L'administrateur prévisualise les autres rôles ; les autres voient leur propre accueil.
  const role: RoleId = profil && profil.role !== "admin" ? profil.role : persona.role;
  const vue = vueDuRole(role === "admin" ? "codir" : role);
  const r = recap;
  if (vue === "client" && client) {
    return <AccueilClient profil={profil} donnees={client} recap={recap} annonces={annonces} agenda={agenda} palier={palier} />;
  }

  const briques: Record<Vue, Brique[]> = {
    repartition: [
      { label: "Leads à valider", valeur: r.leads_a_valider, aide: "À attribuer à un professionnel", href: "/lead-management", icon: Inbox, ton: "cta", attention: r.leads_a_valider > 0 },
      { label: "En attente du professionnel", valeur: r.leads_a_accepter, aide: "Attribués, pas encore acceptés", href: "/lead-management", icon: Hourglass, ton: "warning" },
      { label: "En cours de suivi", valeur: r.leads_en_suivi, aide: "Acceptés, contactés ou en devis", href: "/lead-management", icon: Handshake, ton: "success" },
      { label: "Transformation", valeur: reel?.stats?.transformation_pct ?? "–", unite: "%", aide: "Leads signés sur 30 jours", href: "/lead-management", icon: ChartLine },
    ],
    commercial: [
      { label: "Visites aujourd’hui", valeur: r.visites_aujourdhui, aide: "Voir ma tournée", href: "/crm/tournee", icon: Route, ton: "accent" },
      { label: "Actions en retard", valeur: r.actions_en_retard, aide: "Échéance dépassée", href: "/crm/tournee", icon: CalendarClock, ton: "danger", attention: r.actions_en_retard > 0 },
      { label: "Leads en attente chez mes clients", valeur: r.leads_a_accepter, aide: "Un bon sujet de visite", href: "/leads", icon: Inbox, ton: "cta" },
      { label: "SAV ouverts", valeur: r.sav_ouverts, aide: "Dans mon portefeuille", href: "/sav", icon: LifeBuoy, ton: "warning" },
    ],
    client: [
      { label: "Leads à accepter", valeur: r.leads_a_accepter, aide: "Acceptez avant la fin du délai", href: "/leads", icon: Inbox, ton: "cta", attention: r.leads_a_accepter > 0 },
      { label: "Leads en cours", valeur: r.leads_en_suivi, aide: "Renseignez leur avancement", href: "/leads", icon: Handshake, ton: "success" },
      { label: "SAV : réponse attendue", valeur: r.sav_reponse_attendue, aide: `${pluriel(r.sav_ouverts, "demande")} en cours`, href: "/sav", icon: MessageSquareWarning, ton: "warning", attention: r.sav_reponse_attendue > 0 },
      { label: "Mes points", valeur: formatNumber(r.points), aide: "À dépenser dans la Boutique", href: "/boutique", icon: Coins, ton: "cta" },
    ],
    sav: [
      { label: "Nouvelles demandes", valeur: r.sav_nouveaux, aide: "À prendre en charge", href: "/sav", icon: LifeBuoy, ton: "cta", attention: r.sav_nouveaux > 0 },
      { label: "Demandes ouvertes", valeur: r.sav_ouverts, aide: "Tous statuts en cours", href: "/sav", icon: ClipboardCheck, ton: "accent" },
      { label: "En attente du client", valeur: r.sav_reponse_attendue, aide: "Informations demandées", href: "/sav", icon: MessageSquareWarning, ton: "warning" },
      { label: "Documentation technique", valeur: "Docs", aide: "Notices, PV, fiches", href: "/mediatheque", icon: FileText, ton: "neutral" },
    ],
    direction: [
      { label: "Leads à valider", valeur: r.leads_a_valider, aide: `${pluriel(r.leads_a_accepter, "lead")} en attente du pro`, href: "/lead-management", icon: Inbox, ton: "cta", attention: r.leads_a_valider > 0 },
      { label: "SAV nouveaux", valeur: r.sav_nouveaux, aide: `${pluriel(r.sav_ouverts, "demande")} ouvertes`, href: "/sav", icon: LifeBuoy, ton: "warning" },
      { label: "Commandes à valider", valeur: r.commandes_a_valider, aide: "Boutique, au-delà de 300 €", href: "/boutique/validations", icon: ClipboardCheck, ton: "accent", attention: r.commandes_a_valider > 0 },
      { label: "Actions commerciales en retard", valeur: r.actions_en_retard, aide: "Sur l’ensemble du réseau", href: "/crm/tournee", icon: CalendarClock, ton: "danger" },
    ],
  };

  const urgences = briques[vue].filter((b) => b.attention);
  const resume = urgences.length
    ? urgences.map((b) => `${b.valeur} ${b.label.toLowerCase()}`).join(", ") + "."
    : "Rien d’urgent pour le moment. Bonne journée.";

  const cta: Record<Vue, React.ReactNode> = {
    repartition: <ButtonLink href="/lead-management" variant="primary" size="lg"><Inbox aria-hidden />Traiter les leads</ButtonLink>,
    commercial: <ButtonLink href="/crm/tournee" variant="primary" size="lg"><Route aria-hidden />Préparer ma tournée</ButtonLink>,
    client: <ButtonLink href="/leads" variant="primary" size="lg"><Inbox aria-hidden />Voir mes leads</ButtonLink>,
    sav: <ButtonLink href="/sav" variant="primary" size="lg"><LifeBuoy aria-hidden />Ouvrir la file SAV</ButtonLink>,
    direction: <ButtonLink href="/pilotage" variant="primary" size="lg"><ChartLine aria-hidden />Ouvrir le pilotage</ButtonLink>,
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        className="pb-0"
        title={profil?.prenom ? `Bonjour ${profil.prenom}` : aujourdhui()}
        meta={profil?.role === "admin" && persona.role !== "admin" ? <Badge variant="accent">Aperçu : {persona.fonction}</Badge> : null}
        description={`${aujourdhui()}. ${resume}`}
        actions={
          <>
            {profil?.role === "admin" ? (
              <ButtonLink href="/administration/contenus" variant="secondary" size="lg">
                <Megaphone aria-hidden />
                Annonces et événements
              </ButtonLink>
            ) : null}
            {cta[vue]}
          </>
        }
      />

      <section aria-labelledby="priorites" className="flex flex-col gap-4">
        <h2 id="priorites" className="font-display text-lg font-semibold text-text">
          Vos priorités
        </h2>
        <Briques items={briques[vue]} />
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <BlocRole vue={vue} reel={reel} journee={journee} signaux={signaux} points={r.points} palier={palier} />
        <Carte id="messages" titre="Le fil Picard" icone={MessageCircle} ton="success" sousTitre="Chaîne officielle du réseau" className="scroll-mt-24">
          <CanalMessages annonces={annonces} admin={profil?.role === "admin"} />
        </Carte>
      </div>

      <Carte id="agenda" titre="Agenda du réseau" icone={CalendarDays} ton="warning" sousTitre="Salons, opérations, formations, webinaires et réunions" className="scroll-mt-24">
        <FriseCalendrier elements={agenda} />
      </Carte>
    </div>
  );
}

/** Le bloc propre à chaque métier, à côté du calendrier. */
function BlocRole({ vue, reel, journee, signaux, points, palier }: { vue: Vue; reel: Reel; journee: JourneeCommercial | null; signaux: Signal[]; points: number; palier: number }) {
  if (vue === "repartition") {
    return (
      <Panel className="self-start">
        <PanelHeader
          title="À valider en priorité"
          description="Les plus anciens d’abord"
          actions={<Link href="/lead-management" className="text-sm font-medium text-accent hover:underline">Toute la file</Link>}
        />
        {reel ? <LeadQueueReel leads={reel.leads} peutAttribuer={reel.peutAttribuer} compact /> : <LeadQueue leads={LEADS.slice(0, 3)} compact />}
      </Panel>
    );
  }

  if (vue === "commercial") {
    const visites = journee?.visitesDuJour ?? [];
    const actions = journee?.actionsEnRetard ?? [];
    const heure = (iso: string | null) => (iso ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso)) : "");
    return (
      <Panel className="self-start">
        <PanelHeader title="Ma journée" actions={<Link href="/crm/tournee" className="text-sm font-medium text-accent hover:underline">Ma tournée</Link>} />
        {visites.length === 0 && actions.length === 0 ? (
          <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucune visite ni action en retard aujourd’hui.</p>
        ) : (
          <ul>
            {visites.map((v) => (
              <LigneLien key={v.id} href={`/crm/${v.compteId}`} picto={<span className="tabular inline-flex h-8 items-center rounded-md bg-sunken px-2 text-sm font-semibold text-text">{heure(v.datePrevue)}</span>} titre={v.compteNom ?? "Visite"} detail={v.objet} />
            ))}
            {actions.slice(0, 4).map((a) => (
              <LigneLien key={a.id} href={`/crm/${a.compteId}`} picto={<Picto icon={CalendarClock} tone="danger" size="sm" />} titre={a.titre} detail={`${a.compteNom ?? ""}, en retard`} />
            ))}
          </ul>
        )}
      </Panel>
    );
  }

  if (vue === "client") {
    return (
      <Panel className="self-start">
        <PanelHeader title="Prochain palier" description={`Objectif : ${formatNumber(palier)} points`} />
        <PanelBody className="flex flex-col items-center gap-4">
          <Jauge value={Math.min(points, palier)} max={palier} label="Progression vers le prochain palier" valueLabel={`${formatNumber(points)} pts`} sousTitre={points >= palier ? "Palier atteint" : `Encore ${formatNumber(palier - points)} points`} tone="cta" size={220} />
          <ButtonLink href="/boutique" variant="secondary" className="w-full">
            <Coins aria-hidden />
            Dépenser mes points
          </ButtonLink>
        </PanelBody>
      </Panel>
    );
  }

  if (vue === "sav") {
    return (
      <Panel className="self-start">
        <PanelHeader title="Raccourcis" />
        <ul>
          <LigneLien href="/sav" picto={<Picto icon={LifeBuoy} tone="cta" size="sm" />} titre="File de traitement" detail="Toutes les demandes en cours" />
          <LigneLien href="/mediatheque" picto={<Picto icon={FileText} tone="accent" size="sm" />} titre="Notices et fiches techniques" detail="Dans la Médiathèque" />
        </ul>
      </Panel>
    );
  }

  return (
    <Panel className="self-start">
      <PanelHeader title="Signaux à surveiller" actions={<Link href="/pilotage" className="text-sm font-medium text-accent hover:underline">Pilotage</Link>} />
      {signaux.length === 0 ? (
        <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun signal particulier.</p>
      ) : (
        <ul>
          {signaux.slice(0, 5).map((s) => (
            <LigneLien key={s.titre + s.detail} href="/pilotage" picto={<Picto icon={TriangleAlert} tone={s.niveau} size="sm" />} titre={s.titre} detail={s.detail} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function LigneLien({ href, picto, titre, detail }: { href: string; picto: React.ReactNode; titre: string; detail?: string | null }) {
  return (
    <li className="border-t border-line">
      <Link href={href} className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-sunken">
        <span className="shrink-0">{picto}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-text">{titre}</span>
          {detail ? <span className="mt-0.5 block truncate text-sm text-text-2">{detail}</span> : null}
        </span>
      </Link>
    </li>
  );
}
