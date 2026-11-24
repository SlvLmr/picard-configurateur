import { ArrowLeft, CircleCheck, Coins, Handshake, Inbox, MapPin, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivitesCompte } from "@/components/crm/activites-compte";
import { LIBELLE_EVENEMENT, LIBELLE_STATUT, VARIANTE_STATUT, formatJour } from "@/components/crm/statuts";
import { Badge, NiveauBadge } from "@/components/ui/badge";
import { Cote } from "@/components/ui/cote";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { activitesCompte, commerciaux, ficheCompte, peutVoirCrm } from "@/lib/data/crm";
import { profilCourant } from "@/lib/data/session";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Fiche compte" };
// Données propres à l’utilisateur connecté : jamais de rendu statique.
export const dynamic = "force-dynamic";

/** Paliers de points affichés sur la fiche (en attendant le catalogue de la boutique). */
const PALIERS = [1000, 2500, 5000, 10000];

export default async function Page({ params }: { params: { id: string } }) {
  const profil = await profilCourant();
  if (!peutVoirCrm(profil)) {
    return (
      <>
        <PageHeader title="Fiche compte" />
        <EmptyState title="Accès réservé">Les fiches comptes sont réservées aux équipes commerciales de Picard Serrures.</EmptyState>
      </>
    );
  }

  const [fiche, noms] = await Promise.all([ficheCompte(params.id), commerciaux()]);
  if (!fiche) notFound();
  const suivi = await activitesCompte(params.id);
  const { compte: c, leads, evenements, points } = fiche;
  const commercial = noms.find((n) => n.id === c.commercialId);
  const traites = leads.filter((l) => !["a_valider", "attribue"].includes(l.statut)).length;
  const transformation = traites ? Math.round((c.signes / traites) * 100) : null;
  const palier = PALIERS.find((p) => p > c.points) ?? PALIERS[PALIERS.length - 1];

  return (
    <>
      <Link href="/crm" className="mb-4 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-text-2 hover:text-accent">
        <ArrowLeft className="size-4" aria-hidden />
        Portefeuille
      </Link>
      <PageHeader
        title={c.raisonSociale}
        meta={
          <>
            {c.niveau ? <NiveauBadge type={c.niveau} /> : <NiveauBadge type="Client" />}
            {!c.actif ? <Badge variant="danger">Inactif</Badge> : null}
          </>
        }
        description={[c.cp, c.ville].filter(Boolean).join(" ") || undefined}
      />

      <KpiBand
        items={[
          { label: "Leads reçus", value: formatNumber(c.leads), icon: Inbox, tone: "neutral", note: `${c.enCours} en cours` },
          { label: "Ventes signées", value: formatNumber(c.signes), icon: Handshake, tone: "success" },
          {
            label: "Taux de transformation",
            value: transformation ?? "–",
            unit: transformation !== null ? "%" : undefined,
            icon: CircleCheck,
            tone: "accent",
            note: transformation !== null ? `Sur ${traites} lead${traites > 1 ? "s" : ""} acceptés` : "Aucun lead traité pour l’instant",
          },
          { label: "Points", value: formatNumber(c.points), icon: Coins, tone: "cta", note: `${points.length} mouvements` },
        ]}
      />

      <div className="mt-8">
        <ActivitesCompte compteId={c.id} activites={suivi.activites} actions={suivi.actions} plans={suivi.plans} peutEcrire={suivi.peutEcrire} />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Leads" description={leads.length ? "Du plus récent au plus ancien" : undefined} />
          {leads.length ? (
            <ul>
              {leads.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text">{l.projet}</p>
                    <p className="text-xs text-text-3">
                      {l.reference}, {l.contact}, reçu le {formatJour(l.recuLe)} via {l.source}
                    </p>
                  </div>
                  <Badge variant={VARIANTE_STATUT[l.statut]}>{LIBELLE_STATUT[l.statut]}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-line px-6 py-8 text-sm text-text-2">Ce compte n’a encore reçu aucun lead.</p>
          )}
        </Panel>

        <div className="flex flex-col gap-8">
          <Panel>
            <PanelHeader title="Identité" />
            <dl className="border-t border-line">
              <Ligne icone={UserRound} terme="Commercial" valeur={commercial ? `${commercial.prenom} ${commercial.nom}, ${commercial.equipe}` : "Non affecté"} />
              <Ligne icone={MapPin} terme="Département" valeur={c.departement ?? "Non renseigné"} />
              <Ligne icone={Inbox} terme="Numéro client" valeur={c.numeroClient ?? "Non renseigné"} />
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Fidélité" description={c.points >= palier ? "Palier le plus haut atteint" : `Prochain palier à ${formatNumber(palier)} points`} />
            <PanelBody>
              <Cote
                label="Points par rapport au prochain palier"
                value={Math.min(c.points, palier)}
                max={palier}
                tone="success"
                valueLabel={`${formatNumber(c.points)} pts`}
                startLabel="0"
                endLabel={`${formatNumber(palier)} pts`}
              />
            </PanelBody>
            {points.length ? (
              <ul>
                {points.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 border-t border-line px-6 py-3 text-sm">
                    <span className="text-text-2">
                      {p.motif}
                      <span className="block text-xs text-text-3">{formatJour(p.creeLe)}</span>
                    </span>
                    <span className={`tabular font-semibold ${p.points >= 0 ? "text-success" : "text-danger"}`}>
                      {p.points >= 0 ? "+" : "−"}
                      {Math.abs(p.points)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>

          <Panel>
            <PanelHeader title="Historique des leads" description="Les derniers événements sur les leads de ce compte" />
            {evenements.length ? (
              <ol className="border-t border-line px-6 py-4">
                {evenements.slice(0, 12).map((e, i) => (
                  <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < Math.min(evenements.length, 12) - 1 ? <span aria-hidden className="absolute left-1 top-4 h-full w-px bg-line" /> : null}
                    <span aria-hidden className={`relative mt-1 size-2 shrink-0 rounded-full ${e.statut === "signe" ? "bg-success" : e.type === "refus" ? "bg-danger" : "bg-accent"}`} />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-text">
                        {LIBELLE_EVENEMENT[e.type] ?? e.type}
                        {e.type === "statut" && e.statut ? ` : ${LIBELLE_STATUT[e.statut].toLowerCase()}` : ""}
                      </p>
                      <p className="text-xs text-text-3">
                        {formatJour(e.creeLe)}
                        {e.reference ? `, ${e.reference}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex gap-3 border-t border-line px-6 py-4">
                <Picto icon={Inbox} tone="neutral" size="sm" />
                <p className="text-sm text-text-2">Aucun événement pour l’instant.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function Ligne({ icone: Icone, terme, valeur }: { icone: typeof UserRound; terme: string; valeur: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-6 py-3 last:border-b-0">
      <Icone className="mt-0.5 size-4 shrink-0 text-text-3" aria-hidden />
      <dt className="w-24 shrink-0 text-sm text-text-3">{terme}</dt>
      <dd className="min-w-0 text-sm font-medium text-text">{valeur}</dd>
    </div>
  );
}
