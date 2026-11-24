import { LogOut } from "lucide-react";
import { seDeconnecter } from "@/app/connexion/actions";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { profilCourant } from "@/lib/data/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profil = await profilCourant();
  if (!profil) return <AccesNonConfigure />;
  return <AppShell profil={profil}>{children}</AppShell>;
}

/** Connecté, mais aucun profil Espace Pro actif n'est rattaché au compte. */
function AccesNonConfigure() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8 shadow-card">
        <h1 className="font-display text-xl font-semibold text-text">Accès en cours de préparation</h1>
        <p className="mt-2 text-sm text-text-2">
          Votre compte existe, mais aucun profil Espace Pro ne lui est encore attribué. Contactez l’administrateur pour qu’il vous donne un rôle.
        </p>
        <form action={seDeconnecter} className="mt-6">
          <Button type="submit">
            <LogOut aria-hidden />
            Se déconnecter
          </Button>
        </form>
      </div>
    </main>
  );
}
