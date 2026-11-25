"use server";

import { revalidatePath } from "next/cache";
import { CIBLES, type Cible } from "@/lib/cibles";
import { htmlNewsletter, type Bloc } from "@/lib/newsletter";
import { envoyerNotifications } from "@/lib/notifications";
import { supabaseServeur } from "@/lib/supabase/server";

export type Resultat = { ok: boolean; message: string; id?: string; nombre?: number };

export async function enregistrerNewsletter(f: { id: string | null; objet: string; preheader: string; blocs: Bloc[]; cible: Cible }): Promise<Resultat> {
  const c = CIBLES[f.cible];
  const { data, error } = await supabaseServeur().rpc("ep_admin_enregistrer_newsletter", {
    p_id: f.id, p_objet: f.objet, p_preheader: f.preheader, p_blocs: f.blocs, p_html: htmlNewsletter(f.objet, f.preheader, f.blocs),
    p_cible: f.cible, p_roles: c.roles, p_niveaux: c.niveaux,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/newsletters");
  return { ok: true, message: "Brouillon enregistré", id: data as string };
}

export async function compterDestinataires(cible: Cible): Promise<number | null> {
  const c = CIBLES[cible];
  const { data, error } = await supabaseServeur().rpc("ep_admin_compter_destinataires", { p_roles: c.roles, p_niveaux: c.niveaux });
  return error ? null : (data as number);
}

/** Envoi (ou envoi de test à l'administrateur) : les e-mails rejoignent la file, puis la file est écoulée. */
export async function envoyerNewsletter(id: string, test: boolean): Promise<Resultat> {
  const { data, error } = await supabaseServeur().rpc("ep_admin_envoyer_newsletter", { p_id: id, p_test: test });
  if (error) return { ok: false, message: error.message };
  const envoi = await envoyerNotifications(50).catch(() => null);
  revalidatePath("/newsletters");
  const n = data as number;
  const suite = envoi === null ? " Les e-mails partiront dès que l’envoi Brevo sera configuré." : "";
  return { ok: true, nombre: n, message: test ? `E-mail de test envoyé à votre adresse.${suite}` : `Newsletter envoyée à ${n} destinataire${n > 1 ? "s" : ""}.${suite}` };
}

export async function supprimerNewsletter(id: string): Promise<Resultat> {
  const { error } = await supabaseServeur().rpc("ep_admin_supprimer_newsletter", { p_id: id });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/newsletters");
  return { ok: true, message: "Brouillon supprimé" };
}
