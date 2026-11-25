import type { Metadata } from "next";
import { PageQuestionnaires } from "@/components/questionnaires/page-questionnaires";
import { donneesQuestionnaires } from "@/lib/data/questionnaires";
import { estInterne, profilCourant } from "@/lib/data/session";

export const metadata: Metadata = { title: "Questionnaires" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [profil, { questionnaires, reponses }] = await Promise.all([profilCourant(), donneesQuestionnaires()]);
  return (
    <PageQuestionnaires
      questionnaires={questionnaires}
      reponses={reponses}
      profilId={profil?.id ?? ""}
      admin={profil?.role === "admin"}
      interne={estInterne(profil)}
    />
  );
}
