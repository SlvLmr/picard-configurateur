"use client";

import { LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { seDeconnecter } from "@/app/connexion/actions";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import type { ProfilReel } from "@/lib/data/types";
import { PERSONAS, ROLE_LABEL } from "@/lib/roles";
import { useSession } from "@/lib/session";

export function Topbar({ onMenu, onSearch, profil }: { onMenu: () => void; onSearch: () => void; profil: ProfilReel }) {
  const { persona, setPersona, brand, setBrand, theme, setTheme } = useSession();

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
          {profil.role === "admin" ? (
          <>
          <label className="sr-only" htmlFor="persona">
            Aperçu en tant que
          </label>
          <select
            id="persona"
            value={persona.id}
            onChange={(e) => setPersona(e.target.value)}
            title="Aperçu des écrans selon le profil (données de démonstration)"
            className="h-10 min-w-0 flex-1 cursor-pointer appearance-none truncate rounded-md border border-line-strong bg-surface pl-3 pr-8 text-sm font-medium text-text sm:flex-none"
            style={{ backgroundImage: "var(--chevron)", backgroundRepeat: "no-repeat" }}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                Aperçu : {p.prenom}, {p.societe ?? p.fonction}
              </option>
            ))}
          </select>
          </>
          ) : null}
          <div className="hidden xl:block">
            <Segmented
              label="Marque"
              value={brand}
              onChange={setBrand}
              options={[
                { value: "picard", label: "Picard" },
                { value: "eliot", label: "Eliot" },
              ]}
            />
          </div>
          <Button
            variant="ghost"
            iconOnly
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <form action={seDeconnecter}>
            <Button type="submit" variant="ghost" iconOnly aria-label={`Se déconnecter (${profil.prenom ?? ""}, ${ROLE_LABEL[profil.role]})`} title="Se déconnecter">
              <LogOut />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
