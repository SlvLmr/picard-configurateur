import { CircleCheck, ListChecks, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Cote } from "@/components/ui/cote";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import type { CampagneResume } from "@/lib/data/campagnes";
import { dateCourte, pourcentage, STATUTS_CAMPAGNE } from "./libelles";

export function ListeCampagnes({ campagnes, gestion }: { campagnes: CampagneResume[]; gestion: boolean }) {
  const actives = campagnes.filter((c) => c.statut === "active");
  const passees = campagnes.filter((c) => c.statut !== "active");
  const actions = actives.reduce((s, c) => s + c.actions, 0);
  const faites = actives.reduce((s, c) => s + c.faites, 0);
  const clients = actives.reduce((s, c) => s + c.clients, 0);
  const premiere = actives[0];

  return (
    <>
      <PageHeader
        title="Pilotage campagne"
        description={
          gestion
            ? "Lancez des campagnes d’actions auprès des clients et suivez l’avancement de chaque commercial, zone par zone."
            : "Les actions à mener chez vos clients pour chaque campagne : appels, e-mails, visites, relances. Cochez au fur et à mesure."
        }
        actions={
          gestion ? (
            <ButtonLink href="/campagnes/nouvelle" variant="primary" size="lg">
              <Plus aria-hidden />
              Nouvelle campagne
            </ButtonLink>
          ) : null
        }
      />

      <KpiBand
        items={[
          { label: "Campagnes actives", value: actives.length, icon: ListChecks, tone: "cta", href: premiere ? `/campagnes/${premiere.id}` : undefined },
          { label: gestion ? "Clients ciblés" : "Mes clients ciblés", value: clients, icon: Users, href: premiere ? `/campagnes/${premiere.id}` : undefined },
          { label: "Actions traitées", value: faites, icon: CircleCheck, tone: "success", note: `sur ${actions} prévues` },
          { label: "Avancement", value: pourcentage(faites, actions), unit: "%", icon: CircleCheck, tone: "accent" },
        ]}
      />

      <Panel className="mt-8">
        <PanelHeader title="Campagnes en cours" description={actives.length ? "Ouvrez une campagne pour voir vos clients et leurs étapes" : undefined} />
        {actives.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState title="Aucune campagne en cours">
              {gestion ? "Créez une campagne pour donner à chaque commercial la liste des actions à mener chez ses clients." : "Les campagnes lancées par la direction apparaîtront ici."}
            </EmptyState>
          </div>
        ) : (
          <ul>
            {actives.map((c) => (
              <LigneCampagne key={c.id} c={c} />
            ))}
          </ul>
        )}
      </Panel>

      {passees.length ? (
        <Panel className="mt-8">
          <PanelHeader title="Campagnes terminées et brouillons" />
          <ul>
            {passees.map((c) => (
              <LigneCampagne key={c.id} c={c} />
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}

function LigneCampagne({ c }: { c: CampagneResume }) {
  const pct = pourcentage(c.faites, c.actions);
  const s = STATUTS_CAMPAGNE[c.statut];
  return (
    <li className="border-t border-line">
      <Link
        href={`/campagnes/${c.id}`}
        className="grid gap-4 px-6 py-4 transition-colors hover:bg-sunken md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-center"
      >
        <span className="flex min-w-0 gap-3">
          <Picto icon={ListChecks} tone={c.statut === "active" ? "cta" : "neutral"} size="sm" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-text">{c.titre}</span>
              <Badge variant={s.variant}>{s.label}</Badge>
              {c.demo ? <Badge variant="warning">Démonstration</Badge> : null}
            </span>
            {c.objectif ? <span className="mt-0.5 block truncate text-sm text-text-2">{c.objectif}</span> : null}
            <span className="mt-0.5 block text-xs text-text-3">
              {c.fin ? `Du ${dateCourte(c.debut)} au ${dateCourte(c.fin)}` : `Depuis le ${dateCourte(c.debut)}`}, {c.clients} client{c.clients > 1 ? "s" : ""}, {c.etapes} étape
              {c.etapes > 1 ? "s" : ""}
            </span>
          </span>
        </span>
        <Cote
          label={`Avancement de ${c.titre}`}
          value={c.faites}
          max={Math.max(c.actions, 1)}
          tone={pct >= 80 ? "success" : "accent"}
          valueLabel={`${pct} %`}
          startLabel={`${c.faites} faites`}
          endLabel={`${c.actions} actions`}
        />
      </Link>
    </li>
  );
}
