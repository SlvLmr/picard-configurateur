"use client";

import { CircleCheck, ClipboardCheck, Hourglass, Inbox, MessageSquare, Microscope, Plus, Search, Timer, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Repartition } from "@/components/ui/repartition";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import type { DemandeSav, Intervenant, StatsSav } from "@/lib/data/sav";
import type { RoleId } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { StatutBadge, TypePicto, ageJours, dateCourte } from "./elements";
import { ROLES_DECLARATION, ROLES_TRAITEMENT, TYPES, type SavType } from "./libelles";

type Filtre = "a_traiter" | "attente_client" | "avis" | "resolues" | "toutes";

const COULEURS = ["var(--accent)", "var(--bleu-400)", "var(--warning)", "var(--danger)", "var(--success)", "var(--bleu-300)", "var(--text-3)"];

/** Rôle d'affichage : l'administrateur peut prévisualiser les autres profils. */
export function useRoleVue(role: RoleId): { roleVue: RoleId; apercu: boolean } {
  const { persona } = useSession();
  if (role !== "admin") return { roleVue: role, apercu: false };
  const map: Partial<Record<RoleId, RoleId>> = { atc: "atc", codir: "codir", client_gerant: "client_gerant" };
  const r = map[persona.role];
  return r ? { roleVue: r, apercu: true } : { roleVue: "admin", apercu: false };
}

export function VueSav({ demandes, stats, intervenants, role }: { demandes: DemandeSav[]; stats: StatsSav | null; intervenants: Intervenant[]; role: RoleId }) {
  const { roleVue, apercu } = useRoleVue(role);

  // Aperçu client : on simule un seul compte avec les demandes de démonstration.
  const visibles = useMemo(() => {
    if (apercu && roleVue === "client_gerant") {
      const compte = demandes.find((d) => d.demo)?.compteId;
      return demandes.filter((d) => d.compteId === compte);
    }
    return demandes;
  }, [apercu, roleVue, demandes]);

  if (roleVue === "client_gerant" || roleVue === "client_equipe" || roleVue === "atc") {
    return <VueDemandeur demandes={visibles} commercial={roleVue === "atc"} apercu={apercu} />;
  }
  if (roleVue === "bureau_etudes") return <VueBureauEtudes demandes={visibles} />;
  return <VueTraitement demandes={visibles} stats={stats} intervenants={intervenants} role={roleVue} />;
}

/* ─────────────────────────── Ligne de demande ─────────────────────────── */
function LigneDemande({ d, montrerCompte, attenteVous }: { d: DemandeSav; montrerCompte: boolean; attenteVous?: boolean }) {
  const age = ageJours(d.creeLe);
  return (
    <li className="border-t border-line">
      <Link
        href={`/sav/${d.id}`}
        className="grid gap-3 px-6 py-4 transition-colors hover:bg-sunken md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] md:items-center"
      >
        <div className="flex min-w-0 gap-3">
          <TypePicto type={d.type} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-text">{d.reference}</span>
              <span className="text-sm text-text-2">{TYPES[d.type].label}</span>
              {d.demo ? <Badge>Démo</Badge> : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-text-2">{d.description}</p>
            <p className="mt-0.5 text-xs text-text-3" suppressHydrationWarning>
              {montrerCompte && d.compteNom ? `${d.compteNom}, ` : ""}déposée le {dateCourte(d.creeLe)}
              {d.numeroCommande ? `, commande ${d.numeroCommande}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatutBadge statut={d.statut} />
          {attenteVous ? (
            <Badge variant="warning">
              <MessageSquare aria-hidden />
              Réponse attendue
            </Badge>
          ) : null}
        </div>
        <span className={cn("tabular text-xs md:text-right", age > 10 && !["resolue", "cloturee"].includes(d.statut) ? "font-semibold text-danger" : "text-text-3")} suppressHydrationWarning>
          {["resolue", "cloturee"].includes(d.statut) ? "Terminée" : age === 0 ? "Aujourd’hui" : `${age} j`}
        </span>
      </Link>
    </li>
  );
}

/* ─────────────────────────── Client et commercial ─────────────────────────── */
function VueDemandeur({ demandes, commercial, apercu }: { demandes: DemandeSav[]; commercial: boolean; apercu: boolean }) {
  const [vue, setVue] = useState<"en_cours" | "terminees">("en_cours");
  const enCours = demandes.filter((d) => !["resolue", "cloturee"].includes(d.statut));
  const terminees = demandes.filter((d) => ["resolue", "cloturee"].includes(d.statut));
  const aRepondre = demandes.filter((d) => d.statut === "infos_demandees");
  const liste = vue === "en_cours" ? enCours : terminees;

  return (
    <>
      <PageHeader
        title={commercial ? "SAV de mes clients" : "Service après-vente"}
        meta={apercu ? <Badge variant="warning">Aperçu avec des données de démonstration</Badge> : null}
        description={
          commercial
            ? "Les demandes de votre portefeuille. Une demande ouverte est un bon sujet de visite."
            : "Déclarez un problème sur un produit, suivez son traitement et échangez avec le service SAV."
        }
        actions={
          <ButtonLink href="/sav/nouvelle" variant="primary" size="lg">
            <Plus aria-hidden />
            Déclarer un problème
          </ButtonLink>
        }
      />

      {aRepondre.length ? (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-line bg-warning-soft px-6 py-4">
          <MessageSquare className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-semibold text-text">
              {aRepondre.length === 1 ? "Le service SAV attend votre réponse sur une demande" : `Le service SAV attend votre réponse sur ${aRepondre.length} demandes`}
            </p>
            <p className="mt-0.5 text-sm text-text-2">Répondez dans le fil d’échanges de la demande pour relancer son analyse.</p>
          </div>
        </div>
      ) : null}

      <Panel>
        <PanelHeader
          title={commercial ? "Demandes du portefeuille" : "Mes demandes"}
          actions={
            <Segmented
              label="Afficher"
              size="sm"
              value={vue}
              onChange={setVue}
              options={[
                { value: "en_cours", label: "En cours", count: enCours.length },
                { value: "terminees", label: "Terminées", count: terminees.length },
              ]}
            />
          }
        />
        {liste.length ? (
          <ul>
            {liste.map((d) => (
              <LigneDemande key={d.id} d={d} montrerCompte={commercial} attenteVous={!commercial && d.statut === "infos_demandees"} />
            ))}
          </ul>
        ) : (
          <PanelBody>
            <EmptyState title={vue === "en_cours" ? "Aucune demande en cours" : "Aucune demande terminée"}>
              {vue === "en_cours" ? "Un produit pose problème ? Déclarez-le avec quelques photos et votre numéro de commande." : null}
            </EmptyState>
          </PanelBody>
        )}
      </Panel>
    </>
  );
}

/* ─────────────────────────── Bureau d'études ─────────────────────────── */
function VueBureauEtudes({ demandes }: { demandes: DemandeSav[] }) {
  const enAttente = demandes.filter((d) => d.statut === "avis_technique");
  const autres = demandes.filter((d) => d.statut !== "avis_technique");
  return (
    <>
      <PageHeader title="Avis techniques" description="Les demandes pour lesquelles le service SAV attend l’avis du bureau d’études." />
      <Panel>
        <PanelHeader title="À étudier" description={`${enAttente.length} demande${enAttente.length > 1 ? "s" : ""}`} />
        {enAttente.length ? (
          <ul>
            {enAttente.map((d) => (
              <LigneDemande key={d.id} d={d} montrerCompte />
            ))}
          </ul>
        ) : (
          <PanelBody>
            <p className="text-sm text-text-2">Aucun avis technique en attente.</p>
          </PanelBody>
        )}
      </Panel>
      {autres.length ? (
        <Panel className="mt-8">
          <PanelHeader title="Demandes qui vous sont affectées" />
          <ul>
            {autres.map((d) => (
              <LigneDemande key={d.id} d={d} montrerCompte />
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}

/* ─────────────────────────── Service SAV, qualité, direction ─────────────────────────── */
function VueTraitement({ demandes, stats, intervenants, role }: { demandes: DemandeSav[]; stats: StatsSav | null; intervenants: Intervenant[]; role: RoleId }) {
  const peutTraiter = ROLES_TRAITEMENT.includes(role);
  const peutDeclarer = ROLES_DECLARATION.includes(role);
  const [onglet, setOnglet] = useState<"file" | "qualite">(role === "qualite" ? "qualite" : "file");
  const [filtre, setFiltre] = useState<Filtre>("a_traiter");
  const [type, setType] = useState<SavType | "">("");
  const [affecte, setAffecte] = useState<string>("");
  const [q, setQ] = useState("");

  const compte = (f: Filtre) =>
    demandes.filter((d) =>
      f === "a_traiter"
        ? ["nouvelle", "en_analyse", "decision", "en_resolution"].includes(d.statut)
        : f === "attente_client"
          ? d.statut === "infos_demandees"
          : f === "avis"
            ? d.statut === "avis_technique"
            : f === "resolues"
              ? ["resolue", "cloturee"].includes(d.statut)
              : true,
    );

  const liste = useMemo(() => {
    const n = q.trim().toLowerCase();
    return compte(filtre)
      .filter((d) => (type ? d.type === type : true))
      .filter((d) => (affecte === "aucun" ? !d.affecteA : affecte ? d.affecteA === affecte : true))
      .filter((d) => (n ? [d.reference, d.compteNom, d.description, d.numeroCommande, d.produit].join(" ").toLowerCase().includes(n) : true))
      .sort((a, b) => (filtre === "resolues" ? b.misAJourLe.localeCompare(a.misAJourLe) : a.creeLe.localeCompare(b.creeLe)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandes, filtre, type, affecte, q]);

  const nonConformes = demandes.filter((d) => d.nonConformite);

  return (
    <>
      <PageHeader
        title="Service après-vente"
        description="Toutes les demandes des clients et des commerciaux, de la déclaration à la résolution."
        actions={
          peutDeclarer ? (
            <ButtonLink href="/sav/nouvelle" variant={peutTraiter ? "secondary" : "primary"}>
              <Plus aria-hidden />
              Saisir une demande
            </ButtonLink>
          ) : null
        }
      />
      {stats ? (
        <KpiBand
          items={[
            { label: "Demandes ouvertes", value: stats.ouvertes, icon: Inbox, tone: "cta", note: `${stats.non_affectees} sans responsable` },
            { label: "Nouvelles à prendre en charge", value: stats.nouvelles, icon: TriangleAlert, tone: stats.nouvelles ? "warning" : "success" },
            { label: "En attente du client ou du BE", value: stats.infos_demandees + stats.avis_technique, icon: Hourglass, note: `${stats.avis_technique} en avis technique` },
            {
              label: "Délai moyen de résolution",
              value: stats.delai_resolution_jours ?? "–",
              unit: stats.delai_resolution_jours !== null ? "j" : undefined,
              icon: Timer,
              tone: "success",
              note: stats.taux_garantie_pct !== null ? `${stats.taux_garantie_pct} % prises sous garantie` : undefined,
            },
          ]}
        />
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Segmented
          label="Vue"
          value={onglet}
          onChange={setOnglet}
          options={[
            { value: "file", label: "File de traitement" },
            { value: "qualite", label: "Qualité", count: nonConformes.length },
          ]}
        />
      </div>

      {onglet === "file" ? (
        <Panel className="mt-4">
          <div className="flex flex-col gap-4 px-6 pb-4 pt-5">
            <Segmented
              label="Statut"
              value={filtre}
              onChange={setFiltre}
              options={[
                { value: "a_traiter", label: "À traiter", count: compte("a_traiter").length },
                { value: "attente_client", label: "Attente client", count: compte("attente_client").length },
                { value: "avis", label: "Avis technique", count: compte("avis").length },
                { value: "resolues", label: "Résolues", count: compte("resolues").length },
                { value: "toutes", label: "Toutes", count: demandes.length },
              ]}
            />
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <label className="relative block">
                <span className="sr-only">Rechercher une demande</span>
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-text-3" aria-hidden />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Référence, client, commande, produit" className="pl-10" />
              </label>
              <label>
                <span className="sr-only">Type de demande</span>
                <Select value={type} onChange={(e) => setType(e.target.value as SavType | "")}>
                  <option value="">Tous les types</option>
                  {(Object.keys(TYPES) as SavType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPES[t].label}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                <span className="sr-only">Responsable</span>
                <Select value={affecte} onChange={(e) => setAffecte(e.target.value)}>
                  <option value="">Tous les responsables</option>
                  <option value="aucun">Sans responsable</option>
                  {intervenants.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nom || "Sans nom"}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </div>
          {liste.length ? (
            <ul>
              {liste.map((d) => (
                <LigneDemande key={d.id} d={d} montrerCompte />
              ))}
            </ul>
          ) : (
            <p className="border-t border-line px-6 py-10 text-sm text-text-2">Aucune demande dans cette vue.</p>
          )}
        </Panel>
      ) : (
        <VueQualite demandes={nonConformes} stats={stats} />
      )}
    </>
  );
}

function VueQualite({ demandes, stats }: { demandes: DemandeSav[]; stats: StatsSav | null }) {
  const segments = (obj: Record<string, number> | undefined) =>
    Object.entries(obj ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: COULEURS[i % COULEURS.length] }));

  return (
    <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col gap-8">
        <Panel>
          <PanelHeader title="Non-conformités par gamme" description={`${stats?.non_conformites ?? demandes.length} non-conformités qualifiées`} />
          <PanelBody>
            {demandes.length ? <Repartition label="Non-conformités par gamme" segments={segments(stats?.nc_par_gamme)} /> : <p className="text-sm text-text-2">Aucune non-conformité qualifiée.</p>}
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader title="Par cause" />
          <PanelBody>
            {demandes.length ? <Repartition label="Non-conformités par cause" segments={segments(stats?.nc_par_cause)} /> : <p className="text-sm text-text-2">Aucune cause renseignée.</p>}
          </PanelBody>
        </Panel>
      </div>
      <Panel className="self-start">
        <PanelHeader title="Actions correctives" description="Une ligne par non-conformité qualifiée" />
        {demandes.length ? (
          <ul>
            {demandes.map((d) => (
              <li key={d.id} className="border-t border-line">
                <Link href={`/sav/${d.id}`} className="flex gap-3 px-6 py-4 transition-colors hover:bg-sunken">
                  {d.actionCorrective ? (
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                  ) : (
                    <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                  )}
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-text">{d.reference}</span>
                      <span className="text-sm text-text-2">{d.gamme ?? "Gamme non précisée"}</span>
                      <Badge>{d.cause ?? "Cause à préciser"}</Badge>
                    </span>
                    <span className="mt-0.5 block text-sm text-text-2">{d.actionCorrective ?? "Action corrective à définir"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <PanelBody>
            <p className="flex items-center gap-2 text-sm text-text-2">
              <Microscope className="size-4" aria-hidden />
              Les demandes qualifiées en non-conformité apparaîtront ici.
            </p>
          </PanelBody>
        )}
      </Panel>
    </div>
  );
}

