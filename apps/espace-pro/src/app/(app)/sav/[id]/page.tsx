import type { Metadata } from "next";
import { FicheDemande } from "@/components/sav/fiche-demande";
import { ROLES_TRAITEMENT } from "@/components/sav/libelles";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { demandeSav, intervenantsSav } from "@/lib/data/sav";
import { profilCourant } from "@/lib/data/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Demande SAV" };

export default async function Page({ params }: { params: { id: string } }) {
  const profil = await profilCourant();
  if (!profil) return null;
  const [fiche, intervenants] = await Promise.all([
    /^[0-9a-f-]{36}$/.test(params.id) ? demandeSav(params.id, profil.id) : Promise.resolve(null),
    ROLES_TRAITEMENT.includes(profil.role) ? intervenantsSav() : Promise.resolve([]),
  ]);
  if (!fiche) {
    return (
      <EmptyState
        title="Demande introuvable"
        action={
          <ButtonLink href="/sav" variant="secondary">
            Revenir aux demandes
          </ButtonLink>
        }
      >
        Cette demande n’existe pas ou vous n’y avez pas accès.
      </EmptyState>
    );
  }
  return <FicheDemande {...fiche} intervenants={intervenants} role={profil.role} />;
}
