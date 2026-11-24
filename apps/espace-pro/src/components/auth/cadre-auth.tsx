import { SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { Esquisses } from "./esquisses";
import { LogoAnime } from "./logo-anime";

/** Cadre des pages publiques : grand plan animé à gauche, formulaire à droite. */
export function CadreAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <section className="relative isolate hidden h-screen flex-col overflow-hidden bg-nav-gradient lg:sticky lg:top-0 lg:flex">
        <div className="relative flex justify-center px-12 pt-12 xl:px-16">
          <LogoAnime />
        </div>
        <Esquisses />
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <SymboleEspacePro className="mb-8 size-12 lg:hidden" />
          {children}
        </div>
      </section>
    </main>
  );
}
