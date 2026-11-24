"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServeur } from "@/lib/supabase/server";

export type Etat = { erreur?: string; info?: string };

export async function seConnecter(_: Etat, form: FormData): Promise<Etat> {
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

export async function demanderReinitialisation(_: Etat, form: FormData): Promise<Etat> {
  const email = String(form.get("email") ?? "").trim();
  if (!email.includes("@")) return { erreur: "Saisissez votre adresse e-mail." };
  const origine = headers().get("origin") ?? "";
  await supabaseServeur().auth.resetPasswordForEmail(email, { redirectTo: `${origine}/auth/confirmer?suite=/reinitialiser` });
  // Réponse identique que le compte existe ou non, pour ne rien révéler.
  return { info: `Si un compte existe pour ${email}, un e-mail vient de vous être envoyé. Le lien est valable une heure.` };
}

export async function definirMotDePasse(_: Etat, form: FormData): Promise<Etat> {
  const mdp = String(form.get("mot_de_passe") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (mdp.length < 10) return { erreur: "Choisissez un mot de passe d’au moins 10 caractères." };
  if (mdp !== confirmation) return { erreur: "Les deux mots de passe ne sont pas identiques." };
  const supabase = supabaseServeur();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { erreur: "Le lien a expiré. Demandez un nouvel e-mail de réinitialisation." };
  const { error } = await supabase.auth.updateUser({ password: mdp });
  if (error) return { erreur: "Impossible d’enregistrer ce mot de passe. Essayez-en un autre." };
  redirect("/accueil");
}

export async function demanderAcces(_: Etat, form: FormData): Promise<Etat> {
  const v = (k: string) => String(form.get(k) ?? "").trim();
  const { error } = await supabaseServeur().rpc("ep_demander_acces", {
    p_prenom: v("prenom"), p_nom: v("nom"), p_email: v("email"), p_telephone: v("telephone"),
    p_entreprise: v("entreprise"), p_profil: v("profil"), p_message: v("message"),
  });
  if (error) return { erreur: error.message };
  return { info: "Merci. Votre demande est transmise à Picard Serrures : vous recevrez vos accès par e-mail dès qu’elle sera validée." };
}
