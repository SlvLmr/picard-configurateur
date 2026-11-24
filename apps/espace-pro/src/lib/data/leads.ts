import "server-only";
import { supabaseServeur } from "@/lib/supabase/server";
import type { Candidat, LeadReel, StatsLeads } from "./types";

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
