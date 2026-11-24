import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";
import type { Candidat, Entonnoir, FicheLead, LeadGestion, LeadReel, StatsLeads } from "./types";

type LigneLead = {
  id: string;
  reference: string;
  recu_le: string;
  source: string;
  contact_nom: string;
  cp: string;
  ville: string | null;
  departement: string | null;
  projet: string;
  gros_projet: boolean;
  demo: boolean;
  statut: LeadReel["statut"];
  configuration_ma_porte: Record<string, unknown> | null;
  suggestion_compte: { id: string; raison_sociale: string; niveau_iap: Candidat["niveau"]; ville: string | null } | null;
  suggestion_commercial_id: string | null;
};

const ORDRE_NIVEAU = { Elite: 1, Premium: 2, Officiel: 3 } as const;

/** File de validation : leads à attribuer, du plus ancien au plus récent. */
export async function leadsAValider(limite = 50): Promise<LeadReel[]> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase
    .from("ep_leads")
    .select(
      `id, reference, recu_le, source, contact_nom, cp, ville, departement, projet, gros_projet, demo, statut, configuration_ma_porte,
       suggestion_commercial_id,
       suggestion_compte:ep_comptes!ep_leads_suggestion_compte_id_fkey (id, raison_sociale, niveau_iap, ville)`,
    )
    .eq("statut", "a_valider")
    .order("recu_le", { ascending: true })
    .limit(limite);
  if (error) throw new Error(`Lecture des leads impossible : ${error.message}`);
  const lignes = (data ?? []) as unknown as LigneLead[];

  // Noms des commerciaux : la table commerciaux n'est pas lisible directement par tous les rôles
  const { data: comm } = await supabase.rpc("ep_crm_commerciaux");
  const commerciaux = new Map(((comm ?? []) as { id: string; prenom: string; nom: string }[]).map((c) => [c.id, c]));

  // Candidats alternatifs : comptes actifs des mêmes départements
  const deps = Array.from(new Set(lignes.map((l) => l.departement).filter(Boolean))) as string[];
  const { data: comptes } = deps.length
    ? await supabase.from("ep_comptes").select("id, raison_sociale, niveau_iap, ville, departement").eq("actif", true).in("departement", deps)
    : { data: [] };
  const parDep = new Map<string, Candidat[]>();
  for (const c of comptes ?? []) {
    const liste = parDep.get(c.departement) ?? [];
    liste.push({ id: c.id, nom: c.raison_sociale, niveau: c.niveau_iap, ville: c.ville });
    parDep.set(c.departement, liste);
  }
  parDep.forEach((liste) =>
    liste.sort((a, b) => (ORDRE_NIVEAU[a.niveau ?? "Officiel"] ?? 4) - (ORDRE_NIVEAU[b.niveau ?? "Officiel"] ?? 4) || a.nom.localeCompare(b.nom)),
  );

  return lignes.map((l) => ({
    id: l.id,
    reference: l.reference,
    recuLe: l.recu_le,
    source: l.source,
    contact: l.contact_nom,
    cp: l.cp,
    ville: l.ville,
    departement: l.departement,
    projet: l.projet,
    grosProjet: l.gros_projet,
    demo: l.demo,
    statut: l.statut,
    configurationMaPorte: l.configuration_ma_porte,
    suggestion: l.suggestion_compte
      ? { type: "compte", id: l.suggestion_compte.id, nom: l.suggestion_compte.raison_sociale, niveau: l.suggestion_compte.niveau_iap, ville: l.suggestion_compte.ville }
      : l.suggestion_commercial_id
        ? {
            type: "commercial",
            id: l.suggestion_commercial_id,
            nom: commerciaux.has(l.suggestion_commercial_id)
              ? `${commerciaux.get(l.suggestion_commercial_id)!.prenom} ${capitaliser(commerciaux.get(l.suggestion_commercial_id)!.nom)}`
              : "Commercial du secteur",
          }
        : null,
    candidats: (parDep.get(l.departement ?? "") ?? []).filter((c) => c.id !== l.suggestion_compte?.id).slice(0, 6),
  }));
}

export async function statsLeads(jours = 30): Promise<StatsLeads | null> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase.rpc("ep_stats_leads", { p_jours: jours });
  if (error) return null;
  return data as StatsLeads;
}

const capitaliser = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export type LeadPro = {
  id: string;
  reference: string;
  recuLe: string;
  attribueLe: string | null;
  delaiMin: number;
  source: string;
  contact: string;
  telephone: string | null;
  email: string | null;
  ville: string | null;
  departement: string | null;
  projet: string;
  statut: LeadReel["statut"];
  configurationMaPorte: Record<string, unknown> | null;
  compte: string | null;
};

/** Leads visibles par un installateur (son compte) ou un commercial (son portefeuille). Hors file de validation. */
export async function leadsProfessionnel(): Promise<LeadPro[]> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase
    .from("ep_leads")
    .select("id, reference, recu_le, attribue_le, delai_acceptation, source, contact_nom, telephone, email, ville, departement, projet, statut, configuration_ma_porte, compte:ep_comptes!ep_leads_compte_id_fkey (raison_sociale)")
    .neq("statut", "a_valider")
    .order("attribue_le", { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) throw new Error(`Lecture des leads impossible : ${error.message}`);
  type L = {
    id: string; reference: string; recu_le: string; attribue_le: string | null; delai_acceptation: string; source: string;
    contact_nom: string; telephone: string | null; email: string | null; ville: string | null; departement: string | null;
    projet: string; statut: LeadReel["statut"]; configuration_ma_porte: Record<string, unknown> | null; compte: { raison_sociale: string } | null;
  };
  return ((data ?? []) as unknown as L[]).map((l) => ({
    id: l.id,
    reference: l.reference,
    recuLe: l.recu_le,
    attribueLe: l.attribue_le,
    delaiMin: intervalleEnMinutes(l.delai_acceptation),
    source: l.source,
    contact: l.contact_nom,
    telephone: l.telephone,
    email: l.email,
    ville: l.ville,
    departement: l.departement,
    projet: l.projet,
    statut: l.statut,
    configurationMaPorte: l.configuration_ma_porte,
    compte: l.compte?.raison_sociale ?? null,
  }));
}

/** « 24:00:00 » ou « 1 day » → minutes */
function intervalleEnMinutes(v: string) {
  const jours = /(\d+)\s*day/.exec(v);
  const hms = /(\d+):(\d+):(\d+)/.exec(v);
  return (jours ? Number(jours[1]) * 1440 : 0) + (hms ? Number(hms[1]) * 60 + Number(hms[2]) : 0) || 1440;
}

/* ─────────────────────── Gestion des leads (lead manager) ─────────────────────── */

const COLONNES_GESTION = `id, reference, recu_le, attribue_le, accepte_le, delai_acceptation, source, contact_nom, telephone, email, cp, ville, departement,
  projet, gros_projet, demo, statut, configuration_ma_porte, suggestion_commercial_id, commercial_id,
  suggestion_compte:ep_comptes!ep_leads_suggestion_compte_id_fkey (raison_sociale, niveau_iap),
  compte:ep_comptes!ep_leads_compte_id_fkey (raison_sociale, niveau_iap)`;

type LigneGestion = {
  id: string; reference: string; recu_le: string; attribue_le: string | null; accepte_le: string | null; delai_acceptation: string;
  source: string; contact_nom: string; telephone: string | null; email: string | null; cp: string; ville: string | null; departement: string | null;
  projet: string; gros_projet: boolean; demo: boolean; statut: LeadReel["statut"]; configuration_ma_porte: Record<string, unknown> | null;
  suggestion_commercial_id: string | null; commercial_id: string | null;
  suggestion_compte: { raison_sociale: string; niveau_iap: Candidat["niveau"] } | null;
  compte: { raison_sociale: string; niveau_iap: Candidat["niveau"] } | null;
};

async function nomsCommerciaux() {
  const { data } = await supabaseServeur().rpc("ep_crm_commerciaux");
  return new Map(((data ?? []) as { id: string; prenom: string; nom: string }[]).map((c) => [c.id, `${c.prenom} ${capitaliser(c.nom)}`]));
}

function versLeadGestion(l: LigneGestion, noms: Map<string, string>): LeadGestion {
  const nomCommercial = (id: string | null) => (id ? noms.get(id) ?? "Commercial du secteur" : null);
  return {
    id: l.id,
    reference: l.reference,
    recuLe: l.recu_le,
    attribueLe: l.attribue_le,
    accepteLe: l.accepte_le,
    delaiMin: intervalleEnMinutes(l.delai_acceptation),
    source: l.source,
    contact: l.contact_nom,
    telephone: l.telephone,
    email: l.email,
    cp: l.cp,
    ville: l.ville,
    departement: l.departement,
    projet: l.projet,
    grosProjet: l.gros_projet,
    demo: l.demo,
    statut: l.statut,
    configurationMaPorte: l.configuration_ma_porte,
    suggestion: l.suggestion_compte
      ? { type: "compte", nom: l.suggestion_compte.raison_sociale, niveau: l.suggestion_compte.niveau_iap }
      : l.suggestion_commercial_id
        ? { type: "commercial", nom: nomCommercial(l.suggestion_commercial_id) ?? "Commercial du secteur", niveau: null }
        : null,
    attribueA: l.compte
      ? { type: "compte", nom: l.compte.raison_sociale, niveau: l.compte.niveau_iap }
      : l.commercial_id && l.statut !== "a_valider"
        ? { type: "commercial", nom: nomCommercial(l.commercial_id) ?? "Commercial du secteur", niveau: null }
        : null,
    commercialNom: nomCommercial(l.commercial_id),
  };
}

/** Tous les leads du périmètre de l'utilisateur sur une période (500 au plus, les plus récents d'abord). */
export async function leadsGestion(jours = 365): Promise<LeadGestion[]> {
  const supabase = supabaseServeur();
  const depuis = new Date(Date.now() - jours * 86400000).toISOString();
  const [{ data, error }, noms] = await Promise.all([
    supabase.from("ep_leads").select(COLONNES_GESTION).gte("recu_le", depuis).order("recu_le", { ascending: false }).limit(500),
    nomsCommerciaux(),
  ]);
  if (error) throw new Error(`Lecture des leads impossible : ${error.message}`);
  return ((data ?? []) as unknown as LigneGestion[]).map((l) => versLeadGestion(l, noms));
}

/** Entonnoir de conversion, calculé avec les droits de l'utilisateur. */
export async function entonnoirLeads(jours = 30, source: string | null = null): Promise<Entonnoir> {
  const { data } = await supabaseServeur().rpc("ep_leads_entonnoir", { p_jours: jours, ...(source ? { p_source: source } : {}) });
  return { recus: 0, attribues: 0, acceptes: 0, contactes: 0, devis: 0, signes: 0, perdus: 0, ...((data ?? {}) as Partial<Entonnoir>) };
}

/** Fiche complète d'un lead : détail, chronologie, notes et candidats de la zone. */
export async function ficheLead(id: string, avecCandidats: boolean): Promise<FicheLead | null> {
  const supabase = supabaseServeur();
  const [{ data: lead }, noms, { data: evts }, { data: notes }, cand] = await Promise.all([
    supabase.from("ep_leads").select(COLONNES_GESTION).eq("id", id).maybeSingle(),
    nomsCommerciaux(),
    supabase
      .from("ep_lead_evenements")
      .select("id, type, statut, details, cree_le, compte:ep_comptes!ep_lead_evenements_compte_id_fkey (raison_sociale)")
      .eq("lead_id", id)
      .order("cree_le", { ascending: false }),
    supabase.from("ep_lead_notes").select("id, auteur_nom, contenu, cree_le").eq("lead_id", id).order("cree_le", { ascending: false }),
    avecCandidats ? supabase.rpc("ep_candidats_lead", { p_lead: id }) : Promise.resolve({ data: [] as unknown[] }),
  ]);
  if (!lead) return null;
  type Evt = { id: number; type: string; statut: LeadReel["statut"] | null; details: Record<string, unknown> | null; cree_le: string; compte: { raison_sociale: string } | null };
  type Cand = { type: "compte" | "commercial"; id: string; nom: string; niveau: Candidat["niveau"]; ville: string | null; departement: string | null; leads_30j: number; ecart: number; groupe: string; suggere: boolean };
  return {
    lead: versLeadGestion(lead as unknown as LigneGestion, noms),
    evenements: ((evts ?? []) as unknown as Evt[]).map((e) => ({
      id: e.id, type: e.type, statut: e.statut, compteNom: e.compte?.raison_sociale ?? null, details: e.details, creeLe: e.cree_le,
    })),
    notes: ((notes ?? []) as { id: number; auteur_nom: string | null; contenu: string; cree_le: string }[]).map((n) => ({
      id: n.id, auteur: n.auteur_nom, contenu: n.contenu, creeLe: n.cree_le,
    })),
    candidats: ((cand.data ?? []) as Cand[]).map((c) => ({
      type: c.type, id: c.id, nom: c.nom, niveau: c.niveau, ville: c.ville, departement: c.departement,
      leads30j: c.leads_30j, ecart: c.ecart, groupe: c.groupe, suggere: c.suggere,
    })),
  };
}
