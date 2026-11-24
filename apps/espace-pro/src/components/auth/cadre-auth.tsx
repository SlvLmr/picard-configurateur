import Image from "next/image";
import { SignatureEspacePro, SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { Esquisses } from "./esquisses";

/** Cadre des pages publiques : esquisses animées sous verre à gauche, formulaire sur verre clair à droite. */
export function CadreAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="relative isolate hidden flex-col overflow-hidden bg-nav-gradient px-12 py-10 lg:flex xl:px-16">
        <span aria-hidden className="halo -z-10 size-80" style={{ left: "-10%", top: "18%", background: "rgba(227, 169, 43, 0.28)" }} />
        <span aria-hidden className="halo -z-10 size-80" style={{ right: "-6%", top: "4%", background: "rgba(96, 156, 255, 0.35)", animationDelay: "-6s" }} />
        <span aria-hidden className="halo -z-10 size-80" style={{ left: "30%", bottom: "-12%", background: "rgba(56, 120, 230, 0.4)", animationDelay: "-12s" }} />
        <div className="flex w-64 flex-col items-center gap-3">
          <Image src="/logos/picard-serrures.svg" alt="Picard Serrures" width={151} height={48} priority className="h-10 w-auto" />
          <SignatureEspacePro />
        </div>
        <Esquisses />
        <p className="text-xs text-nav-muted">Picard Serrures et Eliot, la plateforme du réseau.</p>
      </section>
      <section className="relative isolate flex items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
        <span aria-hidden className="halo -z-10 size-80 opacity-60" style={{ right: "-10%", top: "6%", background: "rgba(227, 169, 43, 0.3)" }} />
        <span aria-hidden className="halo -z-10 size-80 opacity-60" style={{ left: "-12%", bottom: "4%", background: "rgba(80, 140, 240, 0.28)", animationDelay: "-9s" }} />
        <div className="verre-clair w-full max-w-md rounded-lg p-6 sm:p-10">
          <SymboleEspacePro className="mb-8 size-12 lg:hidden" />
          {children}
        </div>
      </section>
    </main>
  );
}
