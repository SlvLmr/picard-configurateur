"use client";

import { LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { seDeconnecter } from "@/app/connexion/actions";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import type { ProfilReel } from "@/lib/data/types";
import { ROLE_LABEL, type RoleId } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { ROLES_APERCU, changerApercu } from "./apercu";
import { useSession } from "@/lib/session";

export function Topbar({ onMenu, onSearch, profil }: { onMenu: () => void; onSearch: () => void; profil: ProfilReel }) {
  const { theme, setTheme } = useSession();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
        <Button variant="ghost" iconOnly className="lg:hidden" onClick={onMenu} aria-label="Ouvrir le menu">
          <Menu />
        </Button>

        <button
          type="button"
          onClick={onSearch}
          aria-label="Rechercher"
          className="flex size-10 shrink-0 items-center justify-center gap-3 rounded-md border border-line-strong bg-surface text-sm text-text-3 transition-colors hover:border-text-3 sm:h-10 sm:w-auto sm:max-w-sm sm:flex-1 sm:justify-start sm:px-3"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="hidden truncate sm:inline">Rechercher</span>
          <kbd className="ml-auto hidden rounded-sm border border-line px-2 font-sans text-xs text-text-3 sm:inline">Ctrl K</kbd>
        </button>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
          {profil.roleReel === "admin" ? (
            <Combobox
              id="apercu"
              label="Voir en tant que"
              size="md"
              className="min-w-0 flex-1 sm:w-64 sm:flex-none"
              value={profil.role}
              onChange={(v) => changerApercu(v as RoleId, () => router.refresh())}
              options={ROLES_APERCU.map((r) => ({ value: r.role, label: r.role === "admin" ? "Mon affichage" : `Voir en tant que ${r.label}`, detail: r.detail }))}
            />
          ) : null}
          <Button
            variant="ghost"
            iconOnly
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <form action={seDeconnecter} onSubmit={() => { document.cookie = "ep-apercu=; path=/; max-age=0; samesite=lax"; }}>
            <Button type="submit" variant="ghost" iconOnly aria-label={`Se déconnecter (${profil.prenom ?? ""}, ${ROLE_LABEL[profil.roleReel]})`} title="Se déconnecter">
              <LogOut />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
