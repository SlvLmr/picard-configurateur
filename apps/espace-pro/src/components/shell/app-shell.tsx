"use client";

import { useEffect, useState } from "react";
import { ToastProvider } from "@/components/ui/toast";
import type { ProfilReel } from "@/lib/data/types";
import { useSession } from "@/lib/session";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const PERSONA_PAR_ROLE: Record<ProfilReel["role"], string> = {
  admin: "claire",
  repartiteur: "claire",
  atc: "julien",
  codir: "philippe",
  chef_service: "philippe",
  chef_marche: "philippe",
  client_gerant: "marc",
  client_equipe: "marc",
};

export function AppShell({ children, profil }: { children: React.ReactNode; profil: ProfilReel }) {
  const { persona, setPersona } = useSession();
  const [menu, setMenu] = useState(false);

  // Seul l'administrateur peut prévisualiser les écrans des autres profils.
  useEffect(() => {
    if (profil.role !== "admin" && persona.id !== PERSONA_PAR_ROLE[profil.role]) setPersona(PERSONA_PAR_ROLE[profil.role]);
  }, [profil.role, persona.id, setPersona]);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastProvider>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2">
        Aller au contenu
      </a>
      <div className="lg:grid lg:grid-cols-[240px_1fr]">
        <Sidebar open={menu} onNavigate={() => setMenu(false)} profil={profil} />
        {menu ? <div className="fixed inset-0 z-30 bg-[#071a33]/40 lg:hidden" onClick={() => setMenu(false)} aria-hidden /> : null}
        <div className="min-w-0">
          <Topbar onMenu={() => setMenu(true)} onSearch={() => setSearch(true)} profil={profil} />
          <main id="contenu" className="mx-auto w-full max-w-page px-4 py-8 sm:px-8 sm:py-12">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette open={search} onClose={() => setSearch(false)} role={profil.role} />
    </ToastProvider>
  );
}
