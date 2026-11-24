import { ArrowLeft, CalendarClock, CalendarDays, ListTodo, MapPin, UserRoundX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { formatHeure, formatJourCourt, formatNomJour, typeActivite } from "@/components/crm/libelles-activites";
import { ListeActions } from "@/components/crm/liste-actions";
import { NiveauBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { cn } from "@/lib/cn";
import { jourParis, peutVoirCrm, tournee } from "@/lib/data/crm";
import { profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Tournée" };
// Données propres à l’utilisateur connecté : jamais de rendu statique.
export const dynamic = "force-dynamic";

const VUE_COMPLETE = ["admin", "codir", "chef_service", "chef_marche"];

export default async function Page() {
  const profil = await profilCourant();
  const autorise = peutVoirCrm(profil) && (profil?.role === "atc" || VUE_COMPLETE.includes(profil?.role ?? ""));
  if (!autorise) {
    return (
      <>
        <PageHeader title="Tournée" />
        <EmptyState title="Accès réservé">La tournée est réservée aux commerciaux et à leur encadrement.</EmptyState>
      </>
    );
  }

  const atc = profil?.role === "atc";
  const t = await tournee();
  const auj = jourParis();
  const totalSemaine = t.semaine.reduce((s, j) => s + j.activites.length, 0);
  const joursAffiches = t.semaine.filter((j, i) => i < 5 || j.activites.length > 0);

  return (
    <>
      <Link href="/crm" className="mb-4 inline-flex items-center gap-2 rounded-sm text-sm font-medium text-text-2 hover:text-accent">
        <ArrowLeft className="size-4" aria-hidden />
        Portefeuille
      </Link>
      <PageHeader
        title={atc ? "Ma tournée" : "Tournées et actions"}
        description={
          atc
            ? "Vos rendez-vous de la semaine, les actions en retard et les comptes à revoir."
            : "Les rendez-vous de la semaine, les actions en retard et les comptes non visités, pour tout le réseau."
        }
      />
      <KpiBand
        items={[
          { label: "Rendez-vous aujourd’hui", value: t.aujourdhui.length, icon: MapPin, tone: "cta" },
          { label: "Rendez-vous cette semaine", value: totalSemaine, icon: CalendarDays, tone: "accent" },
          { label: "Actions en retard", value: t.actionsEnRetard.length, icon: ListTodo, tone: t.actionsEnRetard.length ? "danger" : "success" },
          { label: "Comptes à revoir", value: t.comptesARevoir.length, icon: UserRoundX, tone: "warning", note: "Aucune visite depuis 90 jours" },
        ]}
      />

      <Panel className="mt-8">
        <PanelHeader title="Semaine en cours" description="Du lundi au vendredi, et le week-end s’il y a un rendez-vous" />
        <div className="grid border-t border-line md:grid-cols-5">
          {joursAffiches.map((j, i) => {
            const estAuj = j.jour === auj;
            return (
              <section key={j.jour} aria-label={formatNomJour(j.jour)} className={cn("border-line px-4 py-4", i > 0 && "border-t md:border-l md:border-t-0", i >= 5 && "md:border-t")}>
                <h3 className={cn("text-sm font-semibold", estAuj ? "text-accent" : "text-text")}>
                  {formatNomJour(j.jour)}
                  {estAuj ? <span className="sr-only">, aujourd’hui</span> : null}
                </h3>
                {estAuj ? <span aria-hidden className="mt-1 block h-0.5 w-8 rounded-full bg-accent" /> : null}
                {j.activites.length ? (
                  <ul className="mt-3 flex flex-col gap-2">
                    {j.activites.map((a) => (
                      <li key={a.id}>
                        <Link href={`/crm/${a.compteId}`} className="block rounded-md border border-line bg-surface px-3 py-2 transition-colors hover:border-accent">
                          <span className="tabular block text-xs font-semibold text-text">{a.datePrevue ? formatHeure(a.datePrevue) : ""}</span>
                          <span className="block truncate text-sm font-medium text-text">{a.compteNom}</span>
                          <span className="block truncate text-xs text-text-3">
                            {typeActivite(a.type).label}, {a.objet}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-text-3">Aucun rendez-vous</p>
                )}
              </section>
            );
          })}
        </div>
      </Panel>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Aujourd’hui" description={t.aujourdhui.length ? "Ouvrez la fiche pour préparer le rendez-vous" : undefined} />
          {t.aujourdhui.length ? (
            <ol>
              {t.aujourdhui.map((a) => {
                const ty = typeActivite(a.type);
                return (
                  <li key={a.id} className="border-t border-line">
                    <Link href={`/crm/${a.compteId}`} className="group flex gap-4 px-6 py-4 transition-colors hover:bg-sunken">
                      <span className="tabular inline-flex h-8 shrink-0 items-center rounded-md bg-sunken px-3 text-sm font-semibold text-text group-hover:bg-surface">
                        {a.datePrevue ? formatHeure(a.datePrevue) : ""}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-text group-hover:text-accent">{a.compteNom}</span>
                        <span className="mt-0.5 block text-sm text-text-2">
                          {ty.label}, {a.objet}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="flex gap-3 border-t border-line px-6 py-6">
              <Picto icon={CalendarClock} tone="neutral" size="sm" />
              <p className="text-sm text-text-2">Aucun rendez-vous aujourd’hui. Planifiez une visite depuis la fiche d’un compte.</p>
            </div>
          )}
        </Panel>

        <Panel className="self-start">
          <PanelHeader title="Actions en retard" description={t.actionsEnRetard.length ? "Cochez une action dès qu’elle est faite" : undefined} />
          <ListeActions actions={t.actionsEnRetard} peutEcrire afficherCompte vide="Aucune action en retard. Bravo." />
        </Panel>
      </div>

      <Panel className="mt-8">
        <PanelHeader title="Comptes à revoir" description="Aucune visite ni appel enregistré depuis 90 jours, les Elite en premier" />
        {t.comptesARevoir.length ? (
          <ul>
            {t.comptesARevoir.slice(0, 20).map((c) => (
              <li key={c.id} className="border-t border-line">
                <Link href={`/crm/${c.id}`} className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 transition-colors hover:bg-sunken">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text group-hover:text-accent">{c.raisonSociale}</span>
                    <span className="block text-xs text-text-3">
                      {c.ville ?? "Ville non renseignée"}, {c.derniereVisite ? `dernière activité le ${formatJourCourt(c.derniereVisite)}` : "jamais visité"}
                    </span>
                  </span>
                  <NiveauBadge type={c.niveau ?? "Client"} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-line px-6 py-6 text-sm text-text-2">Tous les comptes ont été vus ces 90 derniers jours.</p>
        )}
        {t.comptesARevoir.length > 20 ? (
          <p className="border-t border-line px-6 py-3 text-xs text-text-3">Et {t.comptesARevoir.length - 20} autres comptes, visibles dans le portefeuille.</p>
        ) : null}
      </Panel>
    </>
  );
}
