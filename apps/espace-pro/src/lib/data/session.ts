import "server-only";
import { cache } from "react";
import { supabaseConfigure } from "@/lib/supabase/config";
import { supabaseServeur } from "@/lib/supabase/server";
import { MODULES, ROLE_MODULES, type ModuleId } from "@/lib/roles";
import type { ProfilReel } from "./types";

/** Profil Espace Pro de l'utilisateur connecté, ou null (non connecté, ou sans profil). */
export const profilCourant = cache(async (): Promise<ProfilReel | null> => {
  if (!supabaseConfigure) return null;
  const supabase = supabaseServeur();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("ep_profils")
    .select("id, role, prenom, nom, compte_id, commercial_id")
    .eq("id", auth.user.id)
    .eq("actif", true)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    role: data.role,
    prenom: data.prenom,
    nom: data.nom,
    email: auth.user.email ?? null,
    compteId: data.compte_id,
    commercialId: data.commercial_id,
  };
});

export const ROLES_INTERNES = ["admin", "codir", "chef_service", "chef_marche", "repartiteur"] as const;
export const estInterne = (p: ProfilReel | null) => !!p && (ROLES_INTERNES as readonly string[]).includes(p.role);
export const peutAttribuer = (p: ProfilReel | null) => !!p && (p.role === "admin" || p.role === "repartiteur");

/** Rubriques autorisées pour l'utilisateur connecté (paramétrables dans Administration, Rôles et droits). */
export const modulesAutorises = cache(async (profil: ProfilReel): Promise<ModuleId[]> => {
  const { data, error } = await supabaseServeur().rpc("ep_modules_autorises");
  if (error || !Array.isArray(data)) return ROLE_MODULES[profil.role];
  // Une rubrique ajoutée en base avant la version de l'application qui la connaît est ignorée
  return (data as string[]).filter((m): m is ModuleId => m in MODULES);
});
