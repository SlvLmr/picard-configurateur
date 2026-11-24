import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogoMarque } from "@/components/marque/logo-picard";
import { supabaseServeur } from "@/lib/supabase/server";
import { FormulaireEnquete } from "./formulaire";

export const metadata: Metadata = { title: "Votre avis", robots: { index: false } };
export const dynamic = "force-dynamic";

type Enquete = { cible: "client" | "installateur"; reference: string; projet: string; ville: string | null; installateur: string | null; repondue: boolean };

/** Enquête de satisfaction, ouverte sans connexion depuis le lien reçu par e-mail ou SMS. */
export default async function Page({ params }: { params: { jeton: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.jeton)) notFound();
  const { data } = await supabaseServeur().rpc("ep_enquete_publique", { p_jeton: params.jeton });
  const e = data as Enquete | null;
  if (!e) notFound();
  const question =
    e.cible === "client"
      ? `Recommanderiez-vous ${e.installateur ?? "votre installateur"} et Picard Serrures à un proche ?`
      : "Recommanderiez-vous le service Leads de Picard Serrures à un confrère ?";
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <header className="flex justify-center bg-nav-gradient px-4 py-8">
        <LogoMarque marque="picard" className="h-10" />
      </header>
      <section className="mx-auto w-full max-w-xl px-4 py-12">
        <p className="text-sm text-text-3">
          {e.cible === "client" ? `Votre projet : ${e.projet}${e.ville ? ` à ${e.ville}` : ""}` : `Lead ${e.reference} : ${e.projet}`}
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold text-text">{question}</h1>
        {e.repondue ? (
          <p className="mt-8 rounded-md bg-success-soft px-4 py-3 text-sm text-success">Vous avez déjà répondu. Merci pour votre avis !</p>
        ) : (
          <FormulaireEnquete jeton={params.jeton} cible={e.cible} />
        )}
      </section>
    </main>
  );
}
