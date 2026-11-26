import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hors connexion" };

/** Affichée par l'application installée quand le réseau est indisponible. */
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-nav px-6 text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/picard-serrures.svg" alt="Picard Serrures" className="h-12 w-auto" />
      <h1 className="font-display text-xl font-semibold">Vous êtes hors connexion</h1>
      <p className="max-w-sm text-sm text-white/80">L’Espace Pro a besoin du réseau pour afficher vos informations à jour. Il se rechargera dès que la connexion reviendra.</p>
      <a href="/accueil" className="mt-2 inline-flex h-10 items-center rounded-full bg-cta px-5 text-sm font-semibold text-cta-text">
        Réessayer
      </a>
    </main>
  );
}
