import { X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Cote } from "@/components/ui/cote";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import type { DetailPilotage, Seuils } from "@/lib/data/pilotage";
import { CourbeMensuelle } from "./courbe-mensuelle";
import { NOMS_GAMMES, evolution, montantCourt, ratio } from "./montants";
import { lienPilotage, type EtatVue } from "./navigation";
import { etatAvancement, nomPropre, nomZone } from "./seuils";

/** Détail d'une zone, d'un ATC ou d'une gamme : chiffres clés, courbe mensuelle, ventilations. */
export function DetailDimension({
  detail,
  titre,
  sousTitre,
  realise,
  reference,
  n1,
  seuils,
  etat,
}: {
  detail: DetailPilotage;
  titre: string;
  sousTitre?: string;
  realise: number;
  reference: number;
  n1: number;
  seuils: Seuils;
  etat: EtatVue;
}) {
  const pct = ratio(realise, reference);
  const statut = etatAvancement(pct, seuils);
  const evol = evolution(realise, n1);
  const fermer = lienPilotage(etat, { cle: null });

  return (
    <Panel>
      <PanelHeader
        title={titre}
        description={sousTitre}
        actions={
          <Link href={fermer} scroll={false} aria-label="Fermer le détail" className="inline-grid size-8 place-items-center rounded-md text-text-2 transition-colors hover:bg-sunken hover:text-text">
            <X aria-hidden className="size-4" />
          </Link>
        }
      />
      <PanelBody className="flex flex-col gap-8">
        <dl className="grid grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-text-3">Réalisé à date</dt>
            <dd className="font-display tabular mt-1 text-lg font-bold text-text">{montantCourt(realise)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-3">Avancement</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-display tabular text-lg font-bold text-text">{pct !== null ? `${pct} %` : "–"}</span>
              <Badge variant={statut.tone}>{statut.label}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-3">Sur un an</dt>
            <dd className={`font-display tabular mt-1 text-lg font-bold ${evol === null ? "text-text-3" : evol >= 0 ? "text-success" : "text-danger"}`}>
              {evol === null ? "–" : `${evol > 0 ? "+" : evol < 0 ? "−" : ""}${Math.abs(evol)} %`}
            </dd>
          </div>
        </dl>

        <section aria-label="Évolution mensuelle">
          <h3 className="mb-3 text-sm font-semibold text-text">Mois par mois</h3>
          <CourbeMensuelle mois={detail.mois} annee={detail.annee} />
        </section>

        {detail.gammes && detail.gammes.length ? (
          <section aria-label="Par gamme">
            <h3 className="mb-3 text-sm font-semibold text-text">Par gamme</h3>
            <ul className="flex flex-col gap-4">
              {detail.gammes.map((g) => {
                const p = ratio(g.realise_cumul, g.budget_prorata);
                return (
                  <li key={g.gamme}>
                    <Cote
                      label={`Gamme ${g.gamme}`}
                      value={Math.min(p ?? 0, 130)}
                      max={130}
                      target={100}
                      tone={etatAvancement(p, seuils).tone}
                      valueLabel={p !== null ? `${p} %` : "–"}
                      startLabel={<span className="text-sm font-medium text-text">{NOMS_GAMMES[g.gamme] ?? nomPropre(g.gamme)}</span>}
                      endLabel={`${montantCourt(g.realise_cumul)} sur ${montantCourt(g.budget_prorata)}`}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {detail.atc && detail.atc.length ? (
          <section aria-label="Par ATC">
            <h3 className="mb-1 text-sm font-semibold text-text">Par ATC</h3>
            <ul>
              {detail.atc.map((a) => {
                const p = ratio(a.realise_cumul, a.budget_prorata);
                const st = etatAvancement(p, seuils);
                return (
                  <li key={a.id} className="border-t border-line first:border-t-0">
                    <Link href={lienPilotage(etat, { vue: "atc", cle: a.id })} scroll={false} className="flex items-center gap-3 py-3 transition-colors hover:text-accent">
                      <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: a.couleur ?? "var(--line-strong)" }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text">
                          {a.prenom} {nomPropre(a.nom)}
                        </span>
                        <span className="block text-xs text-text-3">{nomZone(a.zone)}</span>
                      </span>
                      <span className="tabular text-sm text-text-2">{montantCourt(a.realise_cumul)}</span>
                      <Badge variant={st.tone}>{p !== null ? `${p} %` : "–"}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {detail.iap.objectif > 0 ? (
          <section aria-label="Recrutement IAP">
            <h3 className="mb-3 text-sm font-semibold text-text">Recrutement IAP</h3>
            <Cote
              label="IAP recrutés par rapport à l’objectif"
              value={Math.min(detail.iap.nouveaux, detail.iap.objectif)}
              max={detail.iap.objectif}
              tone={detail.iap.nouveaux >= detail.iap.objectif ? "success" : "accent"}
              valueLabel={`${detail.iap.nouveaux} recrutés`}
              startLabel="Nouveaux IAP"
              endLabel={`Objectif ${detail.iap.objectif}`}
            />
          </section>
        ) : null}
      </PanelBody>
    </Panel>
  );
}
