import type { Metadata } from "next";
import { Declaration } from "@/components/sav/declaration";
import { ROLES_DECLARATION } from "@/components/sav/libelles";
import { EmptyState } from "@/components/ui/empty-state";
import { comptesDeclarables } from "@/lib/data/sav";
import { profilCourant } from "@/lib/data/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Déclarer un problème" };

export default async function Page() {
  const profil = await profilCourant();
  if (!profil) return null;
  if (!ROLES_DECLARATION.includes(profil.role)) {
    return (
      <EmptyState title="Déclaration réservée">
        Les demandes SAV sont déclarées par les clients, leurs commerciaux et le service SAV.
      </EmptyState>
    );
  }
  const client = profil.role === "client_gerant" || profil.role === "client_equipe";
  const comptes = client ? [] : await comptesDeclarables();
  return <Declaration comptes={comptes} choisirCompte={!client} />;
}
