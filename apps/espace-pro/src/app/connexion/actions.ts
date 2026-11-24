"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServeur } from "@/lib/supabase/server";

export type EtatConnexion = { erreur?: string; info?: string };

export async function seConnecter(_: EtatConnexion, form: FormData): Promise<EtatConnexion> {
  const email = String(form.get("email") ?? "").trim();
  const motDePasse = String(form.get("mot_de_passe") ?? "");
  const mode = String(form.get("mode") ?? "mot_de_passe");
  if (!email) return { erreur: "Saisissez votre adresse e-mail." };

  const supabase = supabaseServeur();

  if (mode === "lien") {
    const origine = headers().get("origin") ?? "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${origine}/auth/callback` },
    });
    if (error) return { erreur: "Impossible d’envoyer le lien. Vérifiez l’adresse ou contactez l’administrateur." };
    return { info: `Lien de connexion envoyé à ${email}. Il est valable une heure.` };
  }

  if (!motDePasse) return { erreur: "Saisissez votre mot de passe, ou recevez un lien par e-mail." };
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) return { erreur: "Adresse e-mail ou mot de passe incorrect." };
  redirect("/accueil");
}

export async function seDeconnecter() {
  await supabaseServeur().auth.signOut();
  redirect("/connexion");
}
