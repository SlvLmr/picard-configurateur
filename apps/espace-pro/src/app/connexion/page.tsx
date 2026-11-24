import type { Metadata } from "next";
import Image from "next/image";
import { SignatureEspacePro, SymboleEspacePro } from "@/components/marque/logo-espace-pro";
import { FormulaireConnexion } from "./formulaire";

export const metadata: Metadata = { title: "Connexion" };

export default function Page() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-nav p-12 text-nav-text lg:flex lg:flex-col">
        <span className="flex w-80 flex-col gap-4"><Image src="/logos/picard-serrures.svg" alt="Picard Serrures" width={151} height={48} priority className="h-12 w-auto self-start" /><SignatureEspacePro taille="lg" /></span>
        <div className="mt-auto max-w-md">
          <p className="font-display text-2xl font-semibold text-white">Les leads, les clients et les outils du réseau, au même endroit.</p>
        </div>
        <PlanDecor />
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <SymboleEspacePro className="mb-6 size-12 lg:hidden" />
          <h1 className="font-display text-xl font-semibold text-text">Connexion</h1>
          <p className="mt-2 text-sm text-text-2">Utilisez l’adresse e-mail communiquée par Picard Serrures.</p>
          <FormulaireConnexion />
          <p className="mt-8 text-xs text-text-3">Pas encore d’accès, ou mot de passe oublié ? Contactez votre commercial Picard Serrures.</p>
        </div>
      </section>
    </main>
  );
}

/** Tracé de cotes en filigrane : la porte vue en plan. */
function PlanDecor() {
  return (
    <svg aria-hidden viewBox="0 0 400 520" className="pointer-events-none absolute -right-16 top-12 h-[70%] text-white/10" fill="none" stroke="currentColor">
      <rect x="80" y="40" width="220" height="440" strokeWidth="2" />
      <rect x="96" y="56" width="188" height="424" strokeWidth="1" />
      <circle cx="262" cy="270" r="6" strokeWidth="1.5" />
      <path d="M80 500h220M80 492v16M300 492v16M50 40v440M42 40h16M42 480h16" strokeWidth="1" />
      <path d="M96 480a188 188 0 0 1 188-188" strokeDasharray="4 6" strokeWidth="1" />
    </svg>
  );
}
