"use client";

import { useEffect, useState } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
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
        <Sidebar open={menu} onNavigate={() => setMenu(false)} />
        {menu ? <div className="fixed inset-0 z-30 bg-[#071a33]/40 lg:hidden" onClick={() => setMenu(false)} aria-hidden /> : null}
        <div className="min-w-0">
          <Topbar onMenu={() => setMenu(true)} onSearch={() => setSearch(true)} />
          <main id="contenu" className="mx-auto w-full max-w-page px-4 py-8 sm:px-8 sm:py-12">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette open={search} onClose={() => setSearch(false)} />
    </ToastProvider>
  );
}
