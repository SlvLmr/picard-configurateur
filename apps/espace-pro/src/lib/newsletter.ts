/**
 * Newsletters : blocs de contenu et rendu en e-mail (HTML en tableaux, styles en ligne,
 * pour un affichage fidèle dans les messageries). Utilisé par l'éditeur (aperçu) et à l'envoi.
 */
export type Bloc =
  | { type: "titre"; texte: string }
  | { type: "texte"; texte: string }
  | { type: "image"; url: string; legende: string }
  | { type: "bouton"; libelle: string; url: string }
  | { type: "separateur" }
  | { type: "actualite"; titre: string; contenu: string; lien: string }
  | { type: "evenement"; titre: string; date: string; lieu: string }
  | { type: "animation"; titre: string; accroche: string; lien: string };

export const SITE = "https://espace-pro-picard.vercel.app";

const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const paragraphe = (s: string) => e(s).replace(/\n/g, "<br>");
const absolu = (url: string) => (url.startsWith("/") ? `${SITE}${url}` : url);

const NUIT = "#0b2545";
const OR = "#e3a92b";
const GRIS = "#5f6f86";
const FOND = "#f6f1e9";

function rendreBloc(b: Bloc): string {
  switch (b.type) {
    case "titre":
      return `<tr><td style="padding:24px 32px 4px;font-family:Arial,sans-serif;font-size:22px;line-height:28px;font-weight:bold;color:${NUIT}">${e(b.texte)}</td></tr>`;
    case "texte":
      return `<tr><td style="padding:8px 32px;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#2a3b52">${paragraphe(b.texte)}</td></tr>`;
    case "image":
      return b.url
        ? `<tr><td style="padding:12px 32px"><img src="${e(absolu(b.url))}" alt="${e(b.legende)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;border:0">${b.legende ? `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:12px;color:${GRIS}">${e(b.legende)}</p>` : ""}</td></tr>`
        : "";
    case "bouton":
      return `<tr><td style="padding:16px 32px"><a href="${e(absolu(b.url || "/accueil"))}" style="display:inline-block;background:${OR};color:${NUIT};font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:999px">${e(b.libelle || "Découvrir")}</a></td></tr>`;
    case "separateur":
      return `<tr><td style="padding:16px 32px"><div style="border-top:1px solid #e7dfd2;line-height:0;font-size:0">&nbsp;</div></td></tr>`;
    case "actualite":
      return `<tr><td style="padding:8px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FOND};border-radius:8px"><tr><td style="padding:16px 20px;font-family:Arial,sans-serif"><p style="margin:0;font-size:12px;font-weight:bold;color:#008069">Actualité</p><p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:${NUIT}">${e(b.titre)}</p><p style="margin:6px 0 0;font-size:14px;line-height:22px;color:#2a3b52">${paragraphe(b.contenu)}</p>${b.lien ? `<p style="margin:10px 0 0"><a href="${e(absolu(b.lien))}" style="font-size:14px;font-weight:bold;color:${NUIT}">En savoir plus</a></p>` : ""}</td></tr></table></td></tr>`;
    case "evenement":
      return `<tr><td style="padding:8px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e7dfd2;border-radius:8px"><tr><td style="padding:14px 20px;font-family:Arial,sans-serif"><p style="margin:0;font-size:12px;font-weight:bold;color:${OR}">${e(b.date)}</p><p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:${NUIT}">${e(b.titre)}</p>${b.lieu ? `<p style="margin:4px 0 0;font-size:13px;color:${GRIS}">${e(b.lieu)}</p>` : ""}</td></tr></table></td></tr>`;
    case "animation":
      return `<tr><td style="padding:8px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NUIT};border-radius:8px"><tr><td style="padding:18px 20px;font-family:Arial,sans-serif"><p style="margin:0;font-size:12px;font-weight:bold;color:${OR}">Animation du réseau</p><p style="margin:4px 0 0;font-size:17px;font-weight:bold;color:#ffffff">${e(b.titre)}</p>${b.accroche ? `<p style="margin:6px 0 0;font-size:14px;line-height:22px;color:#cfd8e6">${e(b.accroche)}</p>` : ""}<p style="margin:12px 0 0"><a href="${e(absolu(b.lien || "/animations"))}" style="display:inline-block;background:${OR};color:${NUIT};font-size:14px;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:999px">J’en profite</a></p></td></tr></table></td></tr>`;
  }
}

/** E-mail complet de la newsletter. */
export function htmlNewsletter(objet: string, preheader: string, blocs: Bloc[]): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(objet)}</title></head>
<body style="margin:0;padding:0;background:${FOND}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FOND}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:${NUIT};padding:20px 32px;font-family:Arial,sans-serif"><span style="font-size:18px;font-weight:bold;color:#ffffff">Picard Serrures</span><span style="font-size:12px;color:${OR};padding-left:8px">Espace Pro</span></td></tr>
${blocs.map(rendreBloc).join("\n")}
<tr><td style="padding:24px 32px 8px"><div style="border-top:1px solid #e7dfd2;line-height:0;font-size:0">&nbsp;</div></td></tr>
<tr><td style="padding:8px 32px 28px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:${GRIS}">Vous recevez cet e-mail en tant que membre du réseau Picard Serrures.<br><a href="${SITE}/accueil" style="color:${NUIT}">Ouvrir l’Espace Pro</a></td></tr>
</table></td></tr></table></body></html>`;
}
