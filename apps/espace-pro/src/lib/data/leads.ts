import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";
import type { Candidat, Entonnoir, EnqueteLead, FacturationLead, FicheLead, LeadGestion, LeadReel, Notification, StatsLeadManager, StatsLeads, StatsPro } from "./types";

type LigneLead = {
  id: string;
  reference: string;
  recu_le: string;
  source: string;
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
      `id, reference, recu_le, source, cp, ville, departement, projet, gros_projet, demo, statut, configuration_ma_porte,
       suggestion_commercial_id,
       suggestion_compte:ep_comptes!ep_leads_suggestion_compte_id_fkey (id, raison_sociale, niveau_iap, ville)`,
    )
    .eq("statut", "a_valider")
    .order("recu_le", { ascending: true })
    .limit(limite);
  if (error) throw new Error(`Lecture des leads impossible : ${error.message}`);
  const lignes = (data ?? []) as unknown as LigneLead[];
  const coords = await coordonnees(lignes.map((l) => l.id));

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
    contact: coords.get(l.id)?.contact ?? "Client",
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

type Coordonnees = { contact: string | null; telephone: string | null; email: string | null; adresse: string | null; masque: boolean };

/** Coordonnées des clients : masquées par la base tant que l'installateur n'a pas accepté le lead. */
async function coordonnees(ids: string[]): Promise<Map<string, Coordonnees>> {
  if (!ids.length) return new Map();
  const { data } = await supabaseServeur().rpc("ep_leads_coordonnees", { p_ids: ids });
  type C = { id: string; contact_nom: string | null; telephone: string | null; email: string | null; adresse: string | null; masque: boolean };
  return new Map(((data ?? []) as C[]).map((c) => [c.id, { contact: c.contact_nom, telephone: c.telephone, email: c.email, adresse: c.adresse, masque: c.masque }]));
}

/** Leads non acceptés dans le délai : retour automatique dans la file du Lead Manager. */
export async function expirerLeads() {
  await supabaseServeur().rpc("ep_expirer_leads");
}

export type LeadPro = {
  id: string;
  reference: string;
  recuLe: string;
  attribueLe: string | null;
  delaiMin: number;
  source: string;
  contact: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  masque: boolean;
  cp: string;
  ville: string | null;
  departement: string | null;
  projet: string;
  message: string | null;
  statut: LeadReel["statut"];
  motifPerte: string | null;
  referenceCommande: string | null;
  creeParPro: boolean;
  configurationMaPorte: Record<string, unknown> | null;
  compte: string | null;
};

/** Leads visibles par un installateur (son compte) ou un commercial (son portefeuille). Hors file du Lead Manager. */
export async function leadsProfessionnel(): Promise<LeadPro[]> {
  const supabase = supabaseServeur();
  const { data, error } = await supabase
    .from("ep_leads")
    .select(
      "id, reference, recu_le, attribue_le, delai_acceptation, source, cp, ville, departement, projet, message, statut, motif_perte, reference_commande, cree_par_pro, configuration_ma_porte, compte:ep_comptes!ep_leads_compte_id_fkey (raison_sociale)",
    )
    .neq("statut", "a_valider")
    .order("attribue_le", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw new Error(`Lecture des leads impossible : ${error.message}`);
  type L = {
    id: string; reference: string; recu_le: string; attribue_le: string | null; delai_acceptation: string; source: string;
    cp: string; ville: string | null; departement: string | null; projet: string; message: string | null; statut: LeadReel["statut"];
    motif_perte: string | null; reference_commande: string | null; cree_par_pro: boolean;
    configuration_ma_porte: Record<string, unknown> | null; compte: { raison_sociale: string } | null;
  };
  const lignes = (data ?? []) as unknown as L[];
  const coords = await coordonnees(lignes.map((l) => l.id));
  return lignes.map((l) => {
    const c = coords.get(l.id);
    return {
      id: l.id,
      reference: l.reference,
      recuLe: l.recu_le,
      attribueLe: l.attribue_le,
      delaiMin: intervalleEnMinutes(l.delai_acceptation),
      source: l.source,
      contact: c?.contact ?? null,
      telephone: c?.telephone ?? null,
      email: c?.email ?? null,
      adresse: c?.adresse ?? null,
      masque: c?.masque ?? true,
      cp: l.cp,
      ville: l.ville,
      departement: l.departement,
      projet: l.projet,
      message: l.message,
      statut: l.statut,
      motifPerte: l.motif_perte,
      referenceCommande: l.reference_commande,
      creeParPro: l.cree_par_pro,
      configurationMaPorte: l.configuration_ma_porte,
      compte: l.compte?.raison_sociale ?? null,
    };
  });
}

/** « 24:00:00 » ou « 1 day » → minutes */
function intervalleEnMinutes(v: string) {
  const jours = /(\d+)\s*day/.exec(v);
  const hms = /(\d+):(\d+):(\d+)/.exec(v);
  return (jours ? Number(jours[1]) * 1440 : 0) + (hms ? Number(hms[1]) * 60 + Number(hms[2]) : 0) || 1440;
}

/* ─────────────────────── Gestion des leads (Lead Manager) ─────────────────────── */

const COLONNES_GESTION = `id, reference, recu_le, attribue_le, accepte_le, delai_acceptation, source, cp, ville, departement,
  projet, gros_projet, demo, statut, configuration_ma_porte, suggestion_commercial_id, commercial_id,
  message, contact_prefere, temperature, nature_projet, echeance, budget, type_bien, qualifie_le, motif_perte,
  reference_commande, reference_validee_le, cree_par_pro,
  suggestion_compte:ep_comptes!ep_leads_suggestion_compte_id_fkey (raison_sociale, niveau_iap),
  compte:ep_comptes!ep_leads_compte_id_fkey (raison_sociale, niveau_iap)`;

type LigneGestion = {
  id: string; reference: string; recu_le: string; attribue_le: string | null; accepte_le: string | null; delai_acceptation: string;
  source: string; cp: string; ville: string | null; departement: string | null;
  projet: string; gros_projet: boolean; demo: boolean; statut: LeadReel["statut"]; configuration_ma_porte: Record<string, unknown> | null;
  suggestion_commercial_id: string | null; commercial_id: string | null;
  message: string | null; contact_prefere: LeadGestion["contactPrefere"]; temperature: LeadGestion["temperature"];
  nature_projet: string | null; echeance: string | null; budget: string | null; type_bien: string | null; qualifie_le: string | null;
  motif_perte: string | null; reference_commande: string | null; reference_validee_le: string | null; cree_par_pro: boolean;
  suggestion_compte: { raison_sociale: string; niveau_iap: Candidat["niveau"] } | null;
  compte: { raison_sociale: string; niveau_iap: Candidat["niveau"] } | null;
};

async function nomsCommerciaux() {
  const { data } = await supabaseServeur().rpc("ep_crm_commerciaux");
  return new Map(((data ?? []) as { id: string; prenom: string; nom: string }[]).map((c) => [c.id, `${c.prenom} ${capitaliser(c.nom)}`]));
}

function versLeadGestion(l: LigneGestion, noms: Map<string, string>, c: Coordonnees | undefined): LeadGestion {
  const nomCommercial = (id: string | null) => (id ? noms.get(id) ?? "Commercial du secteur" : null);
  return {
    id: l.id,
    reference: l.reference,
    recuLe: l.recu_le,
    attribueLe: l.attribue_le,
    accepteLe: l.accepte_le,
    delaiMin: intervalleEnMinutes(l.delai_acceptation),
    source: l.source,
    contact: c?.contact ?? "Client",
    telephone: c?.telephone ?? null,
    email: c?.email ?? null,
    adresse: c?.adresse ?? null,
    masque: c?.masque ?? false,
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
    message: l.message,
    contactPrefere: l.contact_prefere,
    temperature: l.temperature,
    natureProjet: l.nature_projet,
    echeance: l.echeance,
    budget: l.budget,
    typeBien: l.type_bien,
    qualifieLe: l.qualifie_le,
    motifPerte: l.motif_perte,
    referenceCommande: l.reference_commande,
    referenceValideeLe: l.reference_validee_le,
    creeParPro: l.cree_par_pro,
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
  const lignes = (data ?? []) as unknown as LigneGestion[];
  const coords = await coordonnees(lignes.map((l) => l.id));
  return lignes.map((l) => versLeadGestion(l, noms, coords.get(l.id)));
}

/** Entonnoir de conversion, calculé avec les droits de l'utilisateur. */
export async function entonnoirLeads(jours = 30, source: string | null = null): Promise<Entonnoir> {
  const { data } = await supabaseServeur().rpc("ep_leads_entonnoir", { p_jours: jours, ...(source ? { p_source: source } : {}) });
  return { recus: 0, attribues: 0, acceptes: 0, contactes: 0, rdv: 0, devis: 0, signes: 0, poses: 0, perdus: 0, ...((data ?? {}) as Partial<Entonnoir>) };
}

/** Fiche complète d'un lead : détail, chronologie, fil, candidats, enquêtes et facturation. */
export async function ficheLead(id: string, interne: boolean): Promise<FicheLead | null> {
  const supabase = supabaseServeur();
  const [{ data: lead }, noms, { data: evts }, { data: notes }, cand, coords, { data: enq }, { data: fact }] = await Promise.all([
    supabase.from("ep_leads").select(COLONNES_GESTION).eq("id", id).maybeSingle(),
    nomsCommerciaux(),
    supabase
      .from("ep_lead_evenements")
      .select("id, type, statut, details, cree_le, compte:ep_comptes!ep_lead_evenements_compte_id_fkey (raison_sociale)")
      .eq("lead_id", id)
      .order("cree_le", { ascending: false }),
    supabase.from("ep_lead_notes").select("id, auteur_nom, contenu, cree_le, interne").eq("lead_id", id).order("cree_le", { ascending: false }),
    interne ? supabase.rpc("ep_candidats_lead", { p_lead: id }) : Promise.resolve({ data: [] as unknown[] }),
    coordonnees([id]),
    interne ? supabase.from("ep_lead_enquetes").select("cible, envoyee_le, relances, repondue_le, note, commentaire").eq("lead_id", id) : Promise.resolve({ data: [] }),
    supabase.from("ep_lead_facturation").select("montant, prix, remise_pct, statut, motif, mois").eq("lead_id", id).maybeSingle(),
  ]);
  if (!lead) return null;
  type Evt = { id: number; type: string; statut: LeadReel["statut"] | null; details: Record<string, unknown> | null; cree_le: string; compte: { raison_sociale: string } | null };
  type Cand = { type: "compte" | "commercial"; id: string; nom: string; niveau: Candidat["niveau"]; ville: string | null; departement: string | null; leads_30j: number; ecart: number; groupe: string; suggere: boolean };
  type Enq = { cible: EnqueteLead["cible"]; envoyee_le: string; relances: number; repondue_le: string | null; note: number | null; commentaire: string | null };
  type Fact = { montant: number; prix: number; remise_pct: number; statut: FacturationLead["statut"]; motif: string | null; mois: string } | null;
  const f = fact as Fact;
  const idsComptes = ((cand.data ?? []) as Cand[]).filter((c) => c.type === "compte").map((c) => c.id);
  const { data: typesComptes } = idsComptes.length ? await supabase.from("ep_comptes").select("id, type").in("id", idsComptes) : { data: [] };
  const typeDe = new Map(((typesComptes ?? []) as { id: string; type: string }[]).map((t) => [t.id, t.type]));
  return {
    lead: versLeadGestion(lead as unknown as LigneGestion, noms, coords.get(id)),
    evenements: ((evts ?? []) as unknown as Evt[]).map((e) => ({
      id: e.id, type: e.type, statut: e.statut, compteNom: e.compte?.raison_sociale ?? null, details: e.details, creeLe: e.cree_le,
    })),
    notes: ((notes ?? []) as { id: number; auteur_nom: string | null; contenu: string; cree_le: string; interne: boolean }[]).map((n) => ({
      id: n.id, auteur: n.auteur_nom, contenu: n.contenu, creeLe: n.cree_le, interne: n.interne,
    })),
    candidats: ((cand.data ?? []) as Cand[]).map((c) => ({
      type: c.type, id: c.id, nom: c.nom, niveau: c.niveau, ville: c.ville, departement: c.departement,
      leads30j: c.leads_30j, ecart: c.ecart, groupe: c.groupe, suggere: c.suggere,
      famille: c.type === "commercial" ? "atc" : c.niveau || typeDe.get(c.id) === "IAP" ? "iap" : typeDe.get(c.id) === "Fenêtrier" ? "fenetrier" : "autre",
    })),
    enquetes: ((enq ?? []) as Enq[]).map((e) => ({
      cible: e.cible, envoyeeLe: e.envoyee_le, relances: e.relances, reponduLe: e.repondue_le, note: e.note, commentaire: e.commentaire,
    })),
    facturation: f ? { montant: Number(f.montant), prix: Number(f.prix), remisePct: Number(f.remise_pct), statut: f.statut, motif: f.motif, mois: f.mois } : null,
  };
}

/** Statistiques du Lead Manager (volumes, délais, motifs, NPS, facturation du mois). */
export async function statsLeadManager(jours = 30): Promise<StatsLeadManager | null> {
  const { data, error } = await supabaseServeur().rpc("ep_stats_lead_manager", { p_jours: jours });
  if (error) return null;
  return data as StatsLeadManager;
}

/** Indicateurs de l'installateur connecté. */
export async function statsPro(): Promise<StatsPro | null> {
  const { data } = await supabaseServeur().rpc("ep_stats_pro", { p_jours: 365 });
  return (data as StatsPro | null) ?? null;
}

export type LigneReleve = { mois: string; leads: number; factures: number; offerts: number; rembourses: number; montant: number };

/** Relevé mensuel des leads facturés (gérant du compte et équipes internes). */
export async function releveFacturation(): Promise<LigneReleve[]> {
  const { data } = await supabaseServeur().from("ep_lead_facturation").select("mois, montant, statut").order("mois", { ascending: false }).limit(1000);
  const parMois = new Map<string, LigneReleve>();
  for (const r of (data ?? []) as { mois: string; montant: number; statut: string }[]) {
    const m = parMois.get(r.mois) ?? { mois: r.mois, leads: 0, factures: 0, offerts: 0, rembourses: 0, montant: 0 };
    m.leads += 1;
    if (r.statut === "facture") {
      m.factures += 1;
      m.montant += Number(r.montant);
    } else if (r.statut === "offert") m.offerts += 1;
    else m.rembourses += 1;
    parMois.set(r.mois, m);
  }
  return Array.from(parMois.values());
}

/** Dernières notifications e-mail et SMS (équipes internes). */
export async function notificationsRecentes(limite = 60): Promise<Notification[]> {
  const { data } = await supabaseServeur()
    .from("ep_notifications")
    .select("id, canal, destinataire, destinataire_nom, sujet, motif, statut, erreur, cree_le, envoye_le, lead:ep_leads!ep_notifications_lead_id_fkey (reference)")
    .order("cree_le", { ascending: false })
    .limit(limite);
  type N = {
    id: number; canal: Notification["canal"]; destinataire: string; destinataire_nom: string | null; sujet: string | null; motif: string;
    statut: Notification["statut"]; erreur: string | null; cree_le: string; envoye_le: string | null; lead: { reference: string } | null;
  };
  return ((data ?? []) as unknown as N[]).map((n) => ({
    id: n.id, canal: n.canal, destinataire: n.destinataire, destinataireNom: n.destinataire_nom, sujet: n.sujet, motif: n.motif,
    statut: n.statut, erreur: n.erreur, creeLe: n.cree_le, envoyeLe: n.envoye_le, leadReference: n.lead?.reference ?? null,
  }));
}
