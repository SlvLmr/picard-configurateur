import "server-only";
import type { ModuleId } from "@/lib/roles";
import { supabaseServeur } from "@/lib/supabase/server";
import { recapAccueil } from "./accueil";
import type { ProfilReel } from "./types";

/**
 * Pastilles du menu :
 *  - « actions » : ce qui attend l'utilisateur (leads à traiter, SAV en attente…), calculé par la base ;
 *  - « dates » : dates de publication récentes ; le navigateur compte celles postérieures à la dernière visite de la rubrique.
 */
export type CompteursMenu = { actions: Partial<Record<ModuleId, number>>; dates: Partial<Record<ModuleId, string[]>> };

export async function compteursMenu(profil: ProfilReel): Promise<CompteursMenu> {
  const supabase = supabaseServeur();
  const depuis = new Date(Date.now() - 45 * 86400000).toISOString();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const [recap, { data: annonces }, { data: ressources }, { data: evenements }, { data: animations }] = await Promise.all([
    recapAccueil(),
    supabase.from("ep_annonces").select("debut").eq("archivee", false).lte("debut", aujourdhui).gte("debut", depuis.slice(0, 10)).limit(100),
    supabase.from("ep_ressources").select("mis_a_jour_le").gte("mis_a_jour_le", depuis).limit(200),
    supabase.from("ep_evenements").select("cree_le").gte("cree_le", depuis).limit(100),
    supabase.from("ep_animations").select("cree_le").eq("publie", true).gte("cree_le", depuis).limit(50),
  ]);
  const r = profil.role;
  const actions: CompteursMenu["actions"] = {};
  if (r === "admin" || r === "repartiteur") actions.leads = recap.leads_a_valider;
  else if (r === "client_gerant" || r === "client_equipe" || r === "atc") actions.leads = recap.leads_a_accepter;
  actions.sav = recap.sav_reponse_attendue + (r === "sav" || r === "admin" ? recap.sav_nouveaux : 0);
  if (r === "admin") actions.boutique = recap.commandes_a_valider;
  return {
    actions,
    dates: {
      news: ((annonces ?? []) as { debut: string }[]).map((a) => a.debut),
      mediatheque: ((ressources ?? []) as { mis_a_jour_le: string }[]).map((x) => x.mis_a_jour_le),
      calendrier: ((evenements ?? []) as { cree_le: string }[]).map((x) => x.cree_le),
      animations: ((animations ?? []) as { cree_le: string }[]).map((x) => x.cree_le),
    },
  };
}
