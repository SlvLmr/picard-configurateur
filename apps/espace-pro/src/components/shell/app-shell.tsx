"use client";

import { useEffect, useState } from "react";
import { TextesProvider } from "@/components/ui/texte-editable";
import { ToastProvider } from "@/components/ui/toast";
import type { ProfilReel } from "@/lib/data/types";
import { useSession } from "@/lib/session";
import type { ModuleId } from "@/lib/roles";
import { CommandPalette } from "./command-palette";
import type { CompteursMenu } from "@/lib/data/compteurs";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BandeauApercu } from "./apercu";

const PERSONA_PAR_ROLE: Record<ProfilReel["role"], string> = {
  admin: "claire",
  repartiteur: "claire",
  atc: "julien",
  codir: "philippe",
  chef_service: "philippe",
  chef_marche: "philippe",
  client_gerant: "marc",
  client_equipe: "marc",
  sav: "philippe",
  bureau_etudes: "philippe",
  qualite: "philippe",
};

export function AppShell({ children, profil, modules, compteurs, textes }: { children: React.ReactNode; profil: ProfilReel; modules: ModuleId[]; compteurs: CompteursMenu; textes: Record<string, string> }) {
  const { persona, setPersona } = useSession();
  const [menu, setMenu] = useState(false);

  // Seul l'administrateur peut prévisualiser les écrans des autres profils.
  useEffect(() => {
    // Les écrans de démonstration suivent le rôle affiché (le rôle réel, ou celui de l'aperçu)
    if (persona.id !== PERSONA_PAR_ROLE[profil.role]) setPersona(PERSONA_PAR_ROLE[profil.role]);
  }, [profil.role, persona.id, setPersona]);
  const [search, setSearch] = useState(false);
  // Menu replié en barre de pictogrammes (grand écran), choix mémorisé dans le navigateur
  const [replie, setReplie] = useState(false);
  useEffect(() => {
    try {
      setReplie(window.localStorage.getItem("ep-menu-replie") === "1");
    } catch {
      /* navigation privée */
    }
  }, []);
  const basculerMenu = () =>
    setReplie((r) => {
      try {
        window.localStorage.setItem("ep-menu-replie", r ? "0" : "1");
      } catch {
        /* navigation privée */
      }
      return !r;
    });

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
      <div className={replie ? "lg:grid lg:grid-cols-[64px_1fr]" : "lg:grid lg:grid-cols-[240px_1fr]"}>
        <Sidebar open={menu} onNavigate={() => setMenu(false)} profil={profil} modules={modules} compteurs={compteurs} replie={replie} onBasculer={basculerMenu} />
        {menu ? <div className="fixed inset-0 z-30 bg-[#071a33]/40 lg:hidden" onClick={() => setMenu(false)} aria-hidden /> : null}
        <div className="min-w-0">
          <Topbar onMenu={() => setMenu(true)} onSearch={() => setSearch(true)} profil={profil} />
          {profil.apercu ? <BandeauApercu role={profil.role} /> : null}
          <main id="contenu" className="mx-auto w-full max-w-page px-4 py-8 sm:px-8 sm:py-12">
            <TextesProvider textes={textes} admin={profil.role === "admin"}>
              {children}
            </TextesProvider>
          </main>
        </div>
      </div>
      <CommandPalette open={search} onClose={() => setSearch(false)} modules={modules} />
    </ToastProvider>
  );
}
