"use server";

import { redirect } from "next/navigation";
import { supabaseServeur } from "@/lib/supabase/server";

export type EtatConnexion = { erreur?: string };

export async function seConnecter(_: EtatConnexion, form: FormData): Promise<EtatConnexion> {
  const email = String(form.get("email") ?? "").trim();
  const motDePasse = String(form.get("mot_de_passe") ?? "");
  if (!email || !motDePasse) return { erreur: "Saisissez votre adresse e-mail et votre mot de passe." };

  const { error } = await supabaseServeur().auth.signInWithPassword({ email, password: motDePasse });
  if (error) return { erreur: "Adresse e-mail ou mot de passe incorrect." };
  redirect("/accueil");
}

export async function seDeconnecter() {
  await supabaseServeur().auth.signOut();
  redirect("/connexion");
}
