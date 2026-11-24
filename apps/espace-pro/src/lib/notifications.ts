import "server-only";
import { headers } from "next/headers";
import { supabaseServeur } from "@/lib/supabase/server";

/**
 * Expédition des notifications en attente (e-mail et SMS) par Brevo.
 * La base remplit la file (ep_notifications) ; cette fonction l'écoule.
 * Sans clé BREVO_API_KEY, rien n'est envoyé : les messages restent en file
 * et partiront dès que la clé sera configurée.
 *
 * Variables d'environnement :
 *  - BREVO_API_KEY            clé d'API Brevo (secrète)
 *  - BREVO_EXPEDITEUR_EMAIL   adresse d'expédition vérifiée dans Brevo
 *  - BREVO_EXPEDITEUR_NOM     nom affiché (par défaut « Picard Serrures »)
 *  - BREVO_EXPEDITEUR_SMS     nom d'expéditeur SMS, 11 caractères max (par défaut « Picard »)
 */
export function envoiConfigure() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_EXPEDITEUR_EMAIL);
}

type EnAttente = { id: number; canal: "email" | "sms"; destinataire: string; destinataire_nom: string | null; sujet: string | null; contenu: string; lien: string | null };

function origine() {
  const h = headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return hote ? `${proto}://${hote}` : "https://espace-pro-picard.vercel.app";
}

/** Numéro français au format international attendu par Brevo (33612345678). */
function numeroInternational(tel: string) {
  const chiffres = tel.replace(/[^\d+]/g, "");
  if (chiffres.startsWith("+")) return chiffres.slice(1);
  if (chiffres.startsWith("00")) return chiffres.slice(2);
  if (chiffres.startsWith("0")) return `33${chiffres.slice(1)}`;
  return chiffres;
}

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function html(texte: string, lien: string | null) {
  const corps = echapper(texte).replace(/\n/g, "<br>");
  const bouton = lien
    ? `<p style="margin:24px 0"><a href="${echapper(lien)}" style="background:#e3a92b;color:#0b2545;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ouvrir l’Espace Pro</a></p>`
    : "";
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0b2545;max-width:560px">${corps}${bouton}<p style="color:#5f6f86;font-size:12px">Picard Serrures, Espace Pro</p></div>`;
}

async function envoyer(n: EnAttente, base: string): Promise<{ ok: boolean; erreur?: string }> {
  const cle = process.env.BREVO_API_KEY!;
  const lien = n.lien ? `${base}${n.lien}` : null;
  const texte = n.contenu.replace("{{lien}}", lien ?? base);
  const entetes = { "api-key": cle, "content-type": "application/json", accept: "application/json" };
  try {
    const r =
      n.canal === "email"
        ? await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: entetes,
            body: JSON.stringify({
              sender: { email: process.env.BREVO_EXPEDITEUR_EMAIL, name: process.env.BREVO_EXPEDITEUR_NOM ?? "Picard Serrures" },
              to: [{ email: n.destinataire, ...(n.destinataire_nom ? { name: n.destinataire_nom } : {}) }],
              subject: n.sujet ?? "Espace Pro Picard Serrures",
              htmlContent: html(texte, n.contenu.includes("{{lien}}") ? null : lien),
              textContent: texte,
            }),
          })
        : await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
            method: "POST",
            headers: entetes,
            body: JSON.stringify({
              sender: (process.env.BREVO_EXPEDITEUR_SMS ?? "Picard").slice(0, 11),
              recipient: numeroInternational(n.destinataire),
              content: texte.slice(0, 450),
              type: "transactional",
            }),
          });
    if (r.ok) return { ok: true };
    return { ok: false, erreur: `${r.status} ${(await r.text()).slice(0, 300)}` };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

/** Écoule la file d'envoi. Renvoie le nombre de messages envoyés, ou null si l'envoi n'est pas configuré. */
export async function envoyerNotifications(limite = 30): Promise<{ envoyes: number; echecs: number } | null> {
  if (!envoiConfigure()) return null;
  const supabase = supabaseServeur();
  const { data, error } = await supabase.rpc("ep_notifications_a_envoyer", { p_limite: limite });
  if (error || !data) return { envoyes: 0, echecs: 0 };
  const base = origine();
  let envoyes = 0;
  let echecs = 0;
  for (const n of data as EnAttente[]) {
    const r = await envoyer(n, base);
    await supabase.rpc("ep_notification_resultat", { p_id: n.id, p_ok: r.ok, p_erreur: r.erreur ?? null });
    if (r.ok) envoyes += 1;
    else echecs += 1;
  }
  return { envoyes, echecs };
}
