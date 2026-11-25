"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABEL, type RoleId } from "@/lib/roles";

/** Rôles proposés dans l'aperçu « voir en tant que » de l'administrateur. */
export const ROLES_APERCU: { role: RoleId; label: string; detail: string }[] = [
  { role: "admin", label: "Administrateur", detail: "Mon propre affichage" },
  { role: "codir", label: "CODIR", detail: "Direction, en consultation" },
  { role: "chef_marche", label: "Chef de marché", detail: "Pilotage et encadrement" },
  { role: "atc", label: "ATC", detail: "Commercial terrain" },
  { role: "repartiteur", label: "Lead Manager", detail: "Validation et attribution des leads" },
  { role: "client_gerant", label: "Installateur IAP", detail: "Client, gérant" },
  { role: "sav", label: "Responsable SAV", detail: "Service après-vente" },
];

/** Active ou quitte l'aperçu : un cookie lu par le serveur, puis on recharge l'affichage. */
export function changerApercu(role: RoleId, refresh: () => void) {
  document.cookie = role === "admin" ? "ep-apercu=; path=/; max-age=0; samesite=lax" : `ep-apercu=${role}; path=/; max-age=28800; samesite=lax`;
  refresh();
}

/** Bandeau affiché pendant un aperçu : rappelle le rôle affiché et la lecture seule. */
export function BandeauApercu({ role }: { role: RoleId }) {
  const router = useRouter();
  const toast = useToast();
  // Les actions sont bloquées par le serveur pendant l'aperçu : on l'explique plutôt que d'afficher une erreur
  useEffect(() => {
    const refus = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      toast("Aperçu en lecture seule : rien n’est enregistré.");
    };
    window.addEventListener("unhandledrejection", refus);
    return () => window.removeEventListener("unhandledrejection", refus);
  }, [toast]);
  const label = ROLES_APERCU.find((r) => r.role === role)?.label ?? ROLE_LABEL[role];
  return (
    <div className="sticky top-16 z-20 border-b border-accent/30 bg-accent-soft">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-3 px-4 py-2 sm:px-8">
        <Eye aria-hidden className="size-4 text-accent-strong" />
        <p className="flex-1 text-sm text-accent-strong">
          <span className="font-semibold">Aperçu en tant que {label}.</span> Vous voyez ses rubriques et ses écrans, en lecture seule.
        </p>
        <button
          type="button"
          onClick={() => changerApercu("admin", () => router.refresh())}
          className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-accent-strong shadow-card transition-colors hover:bg-white"
        >
          Quitter l’aperçu
        </button>
      </div>
    </div>
  );
}
