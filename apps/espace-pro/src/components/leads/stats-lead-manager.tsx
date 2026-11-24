import { NiveauBadge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Repartition } from "@/components/ui/repartition";
import type { Nps, StatsLeadManager } from "@/lib/data/types";
import { formatDuree } from "@/lib/format";

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const duree = (m: number | null) => (m === null || m === undefined ? "–" : formatDuree(m));

function Chiffre({ label, valeur, note }: { label: string; valeur: React.ReactNode; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-3">{label}</dt>
      <dd className="font-display tabular text-xl font-bold text-text">{valeur}</dd>
      {note ? <p className="text-xs text-text-3">{note}</p> : null}
    </div>
  );
}

function BlocNps({ titre, n }: { titre: string; n: Nps }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-semibold text-text">{titre}</p>
        <p className="tabular text-sm text-text-3">
          {n.reponses} réponse{n.reponses > 1 ? "s" : ""} sur {n.envoyees} envoyée{n.envoyees > 1 ? "s" : ""}
        </p>
      </div>
      <p className="font-display tabular text-3xl font-bold text-text">{n.score === null ? "–" : `${n.score > 0 ? "+" : ""}${n.score}`}</p>
      <Repartition
        label={`Répartition des réponses : ${titre}`}
        segments={[
          { label: "Promoteurs (9-10)", value: n.promoteurs, color: "var(--success)" },
          { label: "Passifs (7-8)", value: n.passifs, color: "var(--line-strong)" },
          { label: "Détracteurs (0-6)", value: n.detracteurs, color: "var(--danger)" },
        ]}
      />
    </div>
  );
}

function ListeMotifs({ motifs, vide }: { motifs: Record<string, number>; vide: string }) {
  const lignes = Object.entries(motifs).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...lignes.map(([, n]) => n));
  if (!lignes.length) return <p className="text-sm text-text-3">{vide}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {lignes.map(([m, n]) => (
        <li key={m}>
          <div className="flex justify-between gap-4 text-sm">
            <span className="min-w-0 truncate text-text-2">{m}</span>
            <span className="tabular font-semibold text-text">{n}</span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-sunken">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const TEMP = [
  { cle: "chaud", label: "Chauds", couleur: "var(--danger)" },
  { cle: "tiede", label: "Tièdes", couleur: "var(--warning)" },
  { cle: "froid", label: "Froids", couleur: "var(--bleu-400)" },
  { cle: "non_qualifie", label: "Non qualifiés", couleur: "var(--line-strong)" },
];

/** Tableau de bord du Lead Manager : son activité, la réactivité du réseau, la conversion et la satisfaction. */
export function StatsLeadManager({ s, jours }: { s: StatsLeadManager; jours: number }) {
  const activiteMax = Math.max(1, ...s.activite.map((a) => a.qualifies + a.attribues));
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Activité du Lead Manager" description={`${jours} derniers jours`} />
          <PanelBody className="flex flex-col gap-6">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Chiffre label="Leads reçus" valeur={s.recus} />
              <Chiffre label="Qualifiés" valeur={s.qualifies} note={`${pct(s.qualifies, s.recus)} % des reçus`} />
              <Chiffre label="Délai de qualification" valeur={duree(s.delai_qualification_min)} />
              <Chiffre label="Délai d’attribution" valeur={duree(s.delai_attribution_min)} />
            </dl>
            {s.activite.length ? (
              <div>
                <p className="mb-3 text-xs text-text-3">Qualifications et attributions par jour</p>
                <div className="flex h-24 items-end gap-1" role="img" aria-label="Activité quotidienne du Lead Manager">
                  {s.activite.map((a) => (
                    <div key={a.jour} className="flex min-w-0 flex-1 flex-col justify-end gap-px" title={`${a.jour} : ${a.qualifies} qualifiés, ${a.attribues} attribués`}>
                      <span className="rounded-t-sm bg-accent" style={{ height: `${(a.attribues / activiteMax) * 96}px` }} />
                      <span className="bg-cta" style={{ height: `${(a.qualifies / activiteMax) * 96}px` }} />
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex gap-6 text-xs text-text-2">
                  <span className="inline-flex items-center gap-2"><span aria-hidden className="size-3 rounded-sm bg-cta" />Qualifiés</span>
                  <span className="inline-flex items-center gap-2"><span aria-hidden className="size-3 rounded-sm bg-accent" />Attribués</span>
                </p>
              </div>
            ) : null}
            {s.par_auteur.length ? (
              <ul className="flex flex-col border-t border-line">
                {s.par_auteur.map((a) => (
                  <li key={a.nom} className="flex justify-between border-b border-line py-2 text-sm">
                    <span className="text-text">{a.nom}</span>
                    <span className="tabular text-text-2">{a.actions} actions</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Réactivité des installateurs" />
          <PanelBody>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Chiffre label="Délai d’acceptation" valeur={duree(s.delai_acceptation_min)} />
              <Chiffre label="Acceptés" valeur={`${pct(s.acceptes, s.attribues)} %`} note={`${s.acceptes} sur ${s.attribues} attribués`} />
              <Chiffre label="Réattribués" valeur={`${s.reattribues_pct ?? 0} %`} />
              <Chiffre label="Refus" valeur={s.refus} />
              <Chiffre label="Délais dépassés" valeur={s.expires} note={s.en_retard ? `${s.en_retard} en retard maintenant` : undefined} />
              <Chiffre label="Annulés, faute installateur" valeur={s.annules_installateur} />
            </dl>
            <p className="mb-3 mt-6 text-xs text-text-3">Motifs de refus</p>
            <ListeMotifs motifs={s.motifs_refus} vide="Aucun refus sur la période." />
          </PanelBody>
        </Panel>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Conversion par température" description="Signés ou posés sur le total de chaque catégorie" />
          <PanelBody className="flex flex-col gap-4">
            {TEMP.map((t) => {
              const v = s.par_temperature[t.cle] ?? { total: 0, signes: 0 };
              return (
                <div key={t.cle} className="grid grid-cols-[112px_minmax(0,1fr)_80px] items-center gap-4">
                  <span className="text-sm font-medium text-text">{t.label}</span>
                  <div className="h-3 rounded-full bg-sunken">
                    <div className="h-full rounded-full" style={{ width: `${pct(v.signes, v.total)}%`, background: t.couleur, minWidth: v.signes ? 8 : 0 }} />
                  </div>
                  <span className="tabular text-right text-sm text-text-2">
                    <span className="font-semibold text-text">{pct(v.signes, v.total)} %</span> sur {v.total}
                  </span>
                </div>
              );
            })}
            <p className="mb-1 mt-4 text-xs text-text-3">Motifs de perte</p>
            <ListeMotifs motifs={s.motifs_perte} vide="Aucun projet perdu sur la période." />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Satisfaction (NPS)" description="Note de recommandation de 0 à 10" />
          <PanelBody className="grid gap-8 sm:grid-cols-2">
            <BlocNps titre="Clients finaux" n={s.nps_client} />
            <BlocNps titre="Installateurs" n={s.nps_installateur} />
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Par installateur" description="Leads reçus, réactivité, ventes et satisfaction client" />
        {s.installateurs.length === 0 ? (
          <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun lead attribué sur la période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-t border-line text-left text-xs text-text-3">
                  <th className="px-6 py-3 font-medium">Installateur</th>
                  <th className="px-3 py-3 text-right font-medium">Reçus</th>
                  <th className="px-3 py-3 text-right font-medium">Acceptés</th>
                  <th className="px-3 py-3 text-right font-medium">Refus</th>
                  <th className="px-3 py-3 text-right font-medium">Délais dépassés</th>
                  <th className="px-3 py-3 text-right font-medium">Signés</th>
                  <th className="px-6 py-3 text-right font-medium">NPS client</th>
                </tr>
              </thead>
              <tbody>
                {s.installateurs.map((i) => (
                  <tr key={i.nom} className="border-t border-line">
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium text-text">{i.nom}</span>
                        {i.niveau ? <NiveauBadge type={i.niveau} /> : null}
                      </span>
                    </td>
                    <td className="tabular px-3 py-3 text-right">{i.recus}</td>
                    <td className="tabular px-3 py-3 text-right">{pct(i.acceptes, i.recus)} %</td>
                    <td className="tabular px-3 py-3 text-right">{i.refus}</td>
                    <td className={`tabular px-3 py-3 text-right ${i.expires ? "text-danger" : ""}`}>{i.expires}</td>
                    <td className="tabular px-3 py-3 text-right">{i.signes}</td>
                    <td className="tabular px-6 py-3 text-right">{i.nps ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
