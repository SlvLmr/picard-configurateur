import Image from "next/image";
import { SignatureEspacePro, SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { Esquisses } from "./esquisses";

/** Cadre des pages publiques : esquisses animées à gauche, formulaire à droite. */
export function CadreAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="relative hidden flex-col overflow-hidden bg-nav-gradient px-12 py-10 lg:flex xl:px-16">
        <div className="flex w-64 flex-col items-center gap-3">
          <Image src="/logos/picard-serrures.svg" alt="Picard Serrures" width={151} height={48} priority className="h-10 w-auto" />
          <SignatureEspacePro />
        </div>
        <Esquisses />
        <p className="text-xs text-nav-muted">Picard Serrures et Eliot, la plateforme du réseau.</p>
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
