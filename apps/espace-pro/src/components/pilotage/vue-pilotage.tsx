import { BadgeEuro, CalendarRange, Scale, Target, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import type { DetailPilotage, LigneCA, Signal, TableauPilotage } from "@/lib/data/pilotage";
import { ChoixMois } from "./choix-mois";
import { CourbeMensuelle } from "./courbe-mensuelle";
import { DetailDimension } from "./detail-dimension";
import { LiensSegmentes } from "./liens-segmentes";
import { MOIS_LONGS, NOMS_GAMMES, enMillions, evolution, montantCourt, ratio } from "./montants";
import { lienPilotage, type EtatVue } from "./navigation";
import { etatAvancement, nomPropre, nomZone } from "./seuils";
import { TableauDimension, type LigneTableau } from "./tableau-dimension";

const LIBELLES_VUE = { societe: "Société", zone: "Par zone", atc: "Par ATC", gamme: "Par gamme" } as const;

export function VuePilotage({
  t,
  etat,
  societe,
  detail,
  signaux,
}: {
  t: TableauPilotage;
  etat: EtatVue;
  societe: DetailPilotage | null;
  detail: DetailPilotage | null;
  signaux: Signal[];
}) {
  const mensuel = etat.periode === "mois";
  const moisAffiche = t.mois;
  const nomMois = MOIS_LONGS[Math.max(moisAffiche, 1) - 1];
  const chiffres = (l: LigneCA) =>
    mensuel
      ? { realise: l.mois_realise, reference: l.mois_budget_prorata, n1: l.mois_n1 }
      : { realise: l.realise_cumul, reference: l.budget_prorata, n1: l.n1_prorata };

  const s = chiffres(t.societe);
  const pct = ratio(s.realise, s.reference);
  const etatSociete = etatAvancement(pct, t.seuils);
  const ecart = s.realise - s.reference;
  const evol = evolution(s.realise, s.n1);
  const enCours = moisAffiche === t.dernier_mois && t.jours.ratio < 1;
  const tendance = (societe?.mois ?? []).filter((m) => m.realise !== null).slice(-7).map((m) => m.realise as number);

  const lignesZones: LigneTableau[] = t.zones.map((z) => ({
    cle: z.zone,
    titre: nomZone(z.zone),
    sousTitre: `${z.atc} ATC`,
    ...chiffres(z),
    href: lienPilotage(etat, { vue: "zone", cle: z.zone }),
    selectionne: etat.vue === "zone" && etat.cle === z.zone,
  }));
  const lignesAtc: LigneTableau[] = t.atc.map((a) => ({
    cle: a.id,
    titre: `${a.prenom} ${nomPropre(a.nom)}`,
    sousTitre: [nomZone(a.zone), a.fonction].filter(Boolean).join(", "),
    couleur: a.couleur,
    ...chiffres(a),
    href: lienPilotage(etat, { vue: "atc", cle: a.id }),
    selectionne: etat.vue === "atc" && etat.cle === a.id,
  }));
  const lignesGammes: LigneTableau[] = t.gammes.map((g) => ({
    cle: g.gamme,
    titre: NOMS_GAMMES[g.gamme] ?? nomPropre(g.gamme),
    ...chiffres(g),
    href: lienPilotage(etat, { vue: "gamme", cle: g.gamme }),
    selectionne: etat.vue === "gamme" && etat.cle === g.gamme,
  }));
  const lignes = etat.vue === "zone" ? lignesZones : etat.vue === "atc" ? lignesAtc : lignesGammes;
  const choisie = lignes.find((l) => l.selectionne) ?? null;

  const periodeTexte = mensuel
    ? `${nomMois.charAt(0).toUpperCase()}${nomMois.slice(1)} ${t.annee}`
    : `Cumul ${t.annee} à fin ${MOIS_LONGS[Math.max(t.dernier_mois, 1) - 1]}`;

  return (
    <>
      <PageHeader
        title="Pilotage commercial"
        meta={<Badge variant="success">Données Picard ATC</Badge>}
        description={
          enCours
            ? `${periodeTexte}. Mois en cours : ${t.jours.ecoules} jours ouvrés écoulés sur ${t.jours.ouvres}, le budget est compté au prorata.`
            : `${periodeTexte}, comparé au budget et à ${t.annee - 1} à la même date.`
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <LiensSegmentes
          label="Vue"
          options={(Object.keys(LIBELLES_VUE) as (keyof typeof LIBELLES_VUE)[]).map((v) => ({
            href: lienPilotage(etat, { vue: v, cle: null }),
            label: LIBELLES_VUE[v],
            actif: etat.vue === v,
            compte: v === "zone" ? t.zones.length : v === "atc" ? t.atc.length : v === "gamme" ? t.gammes.length : undefined,
          }))}
        />
        <LiensSegmentes
          label="Période"
          options={[
            { href: lienPilotage(etat, { periode: "cumul" }), label: "Cumul année", actif: !mensuel },
            { href: lienPilotage(etat, { periode: "mois" }), label: "Un mois", actif: mensuel },
          ]}
        />
        {mensuel ? <ChoixMois etat={etat} mois={moisAffiche} dernier={t.dernier_mois} annee={t.annee} /> : null}
      </div>

      <KpiBand
        items={[
          {
            label: mensuel ? `Réalisé en ${nomMois}` : "Réalisé à date",
            value: enMillions(s.realise),
            unit: "M€",
            icon: BadgeEuro,
            tone: "cta",
            trend: !mensuel && tendance.length > 1 ? tendance : undefined,
            href: lienPilotage(etat, { vue: "atc", cle: null }),
          },
          {
            label: "Avancement",
            value: pct ?? "–",
            unit: "%",
            icon: Target,
            tone: etatSociete.tone === "accent" ? "accent" : etatSociete.tone,
            note: `${etatSociete.label}, budget à date ${montantCourt(s.reference)}`,
            href: lienPilotage(etat, { vue: "zone", cle: null }),
          },
          {
            label: "Écart au budget à date",
            value: `${ecart >= 0 ? "+" : "−"}${montantCourt(Math.abs(ecart))}`,
            icon: Scale,
            tone: ecart >= 0 ? "success" : "danger",
            note: !mensuel ? `Budget annuel ${montantCourt(t.societe.budget_annuel)}` : undefined,
            href: lienPilotage(etat, { vue: "gamme", cle: null }),
          },
          {
            label: `Par rapport à ${t.annee - 1}`,
            value: evol === null ? "–" : `${evol > 0 ? "+" : evol < 0 ? "−" : ""}${Math.abs(evol)}`,
            unit: evol === null ? undefined : "%",
            icon: CalendarRange,
            tone: evol === null ? "neutral" : evol >= 0 ? "success" : "danger",
            note: `${montantCourt(s.n1)} à la même date`,
            href: lienPilotage(etat, { vue: "zone", cle: null }),
          },
        ]}
      />

      {etat.vue === "societe" ? (
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-8">
            <Panel>
              <PanelHeader title="Chiffre d’affaires mensuel" description="Survolez un mois pour le détail" />
              <PanelBody>{societe ? <CourbeMensuelle mois={societe.mois} annee={t.annee} /> : null}</PanelBody>
            </Panel>
            <Panel>
              <PanelHeader title="Par gamme" actions={<Link href={lienPilotage(etat, { vue: "gamme" })} className="text-sm font-medium text-accent hover:underline">Détail</Link>} />
              <TableauDimension lignes={lignesGammes} seuils={t.seuils} libelle="Gamme" />
            </Panel>
          </div>
          <div className="flex min-w-0 flex-col gap-8">
            <Panel>
              <PanelHeader title="Par zone" actions={<Link href={lienPilotage(etat, { vue: "zone" })} className="text-sm font-medium text-accent hover:underline">Détail</Link>} />
              <ul>
                {lignesZones.map((z) => {
                  const p = ratio(z.realise, z.reference);
                  const st = etatAvancement(p, t.seuils);
                  return (
                    <li key={z.cle} className="border-t border-line">
                      <Link href={z.href} scroll={false} className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-sunken">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-text">{z.titre}</span>
                          <span className="block text-xs text-text-3">{z.sousTitre}</span>
                        </span>
                        <span className="tabular text-sm text-text-2">{montantCourt(z.realise)}</span>
                        <Badge variant={st.tone}>{p !== null ? `${p} %` : "–"}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
            <Panel>
              <PanelHeader title="Signaux à surveiller" />
              {signaux.length === 0 ? (
                <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun signal particulier.</p>
              ) : (
                <ul>
                  {signaux.slice(0, 6).map((sg) => (
                    <li key={sg.titre + sg.detail} className="flex gap-3 border-t border-line px-6 py-4">
                      <Picto icon={TriangleAlert} tone={sg.niveau} size="sm" />
                      <span className="min-w-0">
                        <span className="block font-semibold text-text">{sg.titre}</span>
                        <span className="mt-0.5 block text-sm text-text-2">{sg.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel className="min-w-0">
            <PanelHeader
              title={etat.vue === "zone" ? "Zones" : etat.vue === "atc" ? "ATC" : "Gammes"}
              description="Classées par chiffre d’affaires. Choisissez une ligne pour le détail."
            />
            <TableauDimension lignes={lignes} seuils={t.seuils} libelle={etat.vue === "zone" ? "Zone" : etat.vue === "atc" ? "ATC" : "Gamme"} />
          </Panel>
          <div className="order-first min-w-0 xl:order-none">
            {choisie && detail ? (
              <DetailDimension
                detail={detail}
                titre={choisie.titre}
                sousTitre={choisie.sousTitre}
                realise={choisie.realise}
                reference={choisie.reference}
                n1={choisie.n1}
                seuils={t.seuils}
                etat={etat}
              />
            ) : (
              <Panel className="hidden xl:block">
                <PanelHeader title="Détail" />
                <p className="border-t border-line px-6 py-8 text-sm text-text-2">
                  Choisissez {etat.vue === "zone" ? "une zone" : etat.vue === "atc" ? "un ATC" : "une gamme"} dans la liste pour voir sa courbe mois par mois et sa ventilation.
                </p>
              </Panel>
            )}
          </div>
        </div>
      )}
    </>
  );
}
