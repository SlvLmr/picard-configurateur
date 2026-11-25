import type { Metadata } from "next";
import { PageNewsletters } from "@/components/newsletters/page-newsletters";
import { agenda, annoncesActives } from "@/lib/data/accueil";
import { donneesAnimations } from "@/lib/data/animations";
import { listeNewsletters } from "@/lib/data/newsletters";
import { profilCourant } from "@/lib/data/session";
import { envoiConfigure } from "@/lib/notifications";

export const metadata: Metadata = { title: "Newsletters" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const profil = await profilCourant();
  const maintenant = new Date();
  const [newsletters, annonces, evenements, anim] = await Promise.all([
    listeNewsletters(),
    annoncesActives().catch(() => []),
    agenda(maintenant, new Date(maintenant.getFullYear() + 2, 0, 1)).catch(() => []),
    donneesAnimations(false).catch(() => null),
  ]);
  return (
    <PageNewsletters
      newsletters={newsletters}
      modifiable={profil?.role === "admin"}
      envoiConfigure={envoiConfigure()}
      sources={{
        actualites: annonces.map((a) => ({ titre: a.titre, contenu: a.contenu, lien: a.lienUrl ?? "/accueil#messages" })),
        evenements: evenements
          .filter((e) => e.type !== "visite" && e.type !== "echeance")
          .slice(0, 20)
          .map((e) => ({ titre: e.titre, date: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(e.debut)), lieu: e.lieu ?? "" })),
        animations: (anim?.animations ?? []).filter((a) => a.publie && (!a.fin || a.fin >= maintenant.toISOString().slice(0, 10))).map((a) => ({ titre: a.titre, accroche: a.accroche ?? "", lien: "/animations" })),
      }}
    />
  );
}
