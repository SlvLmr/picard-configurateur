"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CompteursMenu } from "@/lib/data/compteurs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { ProfilReel } from "@/lib/data/types";
import { MODULES, ROLE_LABEL, SECTIONS_MENU, type ModuleId } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { SignatureEspacePro } from "@/components/marque/logo-espace-pro";
import { LogoMarque } from "@/components/marque/logo-picard";
import { NAV_ICONS } from "./nav-icons";

export function Sidebar({ open, onNavigate, profil, modules, compteurs }: { open: boolean; onNavigate: () => void; profil: ProfilReel; modules: ModuleId[]; compteurs: CompteursMenu }) {
  const pathname = usePathname();
  const { brand } = useSession();
  // Le menu suit le rôle réel : l’administrateur voit tout, quel que soit l’aperçu choisi.
  const autorises = new Set(modules);
  // Nouveautés depuis la dernière visite de chaque rubrique (mémorisée dans le navigateur)
  const [vus, setVus] = useState<Record<string, number>>({});
  useEffect(() => {
    const lire = (m: string) => {
      try {
        const v = window.localStorage.getItem(`ep-vu-${m}`);
        return v ? Number(v) : Date.now() - 14 * 86400000;
      } catch {
        return Date.now();
      }
    };
    const actuel = (Object.keys(compteurs.dates) as ModuleId[]).find((m) => pathname === MODULES[m].href || pathname.startsWith(MODULES[m].href + "/"));
    if (actuel) {
      try {
        window.localStorage.setItem(`ep-vu-${actuel}`, String(Date.now()));
      } catch {
        /* navigation privée : pas de mémorisation */
      }
    }
    setVus(Object.fromEntries(Object.keys(compteurs.dates).map((m) => [m, m === actuel ? Date.now() : lire(m)])));
  }, [pathname, compteurs.dates]);
  const pastille = (id: ModuleId) => {
    const a = compteurs.actions[id] ?? 0;
    const dates = compteurs.dates[id];
    const n = dates && vus[id] !== undefined ? dates.filter((d) => new Date(d).getTime() > vus[id]).length : 0;
    return a + n;
  };
  const sections = SECTIONS_MENU.map((s) => ({ ...s, modules: s.modules.filter((m) => autorises.has(m)) })).filter((s) => s.modules.length);

  const Entree = ({ id }: { id: ModuleId }) => {
    const m = MODULES[id];
    const Icon = NAV_ICONS[id];
    const active = pathname === m.href || pathname.startsWith(m.href + "/");
    return (
      <li>
        <Link
          href={m.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-8 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
            active ? "bg-white/20 text-white shadow-sm" : "text-nav-text hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-nav-muted")} aria-hidden />
          <span className="min-w-0 flex-1 truncate">{m.label}</span>
          {pastille(id) > 0 ? (
            <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1 text-xs font-bold text-cta-text shadow-cta" aria-label={`${pastille(id)} nouveauté${pastille(id) > 1 ? "s" : ""}`}>
              {pastille(id) > 9 ? "9+" : pastille(id)}
            </span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-nav-gradient text-nav-text transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <Link href="/accueil" onClick={onNavigate} aria-label="Espace Pro, accueil" className="mx-3 mb-2 mt-3 flex flex-col items-center gap-3 rounded-md px-3 py-3">
        <LogoMarque marque={brand} className="h-8" />
        <SignatureEspacePro />
      </Link>

      <nav aria-label="Modules" className="scroll-nav flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-0.5">
          <Entree id="accueil" />
        </ul>
        {sections.map((s) => (
          <div key={s.titre}>
            <p className="px-3 pb-1 text-xs font-semibold text-nav-muted">{s.titre}</p>
            <ul className="flex flex-col gap-0.5">
              {s.modules.map((id) => (
                <Entree key={id} id={id} />
              ))}
            </ul>
          </div>
        ))}
        {autorises.has("administration") ? (
          <ul className="mt-auto flex flex-col gap-0.5 border-t border-white/10 pt-3">
            <Entree id="administration" />
          </ul>
        ) : null}
      </nav>

      <div className="border-t border-white/10 px-5 py-3">
        <p className="truncate text-sm font-medium text-white">
          {profil.prenom} {profil.nom}
        </p>
        <p className="text-xs text-nav-muted">Connecté, {ROLE_LABEL[profil.role].toLowerCase()}</p>
        <Link href="/design-system" onClick={onNavigate} className="mt-2 inline-block text-xs text-nav-muted underline-offset-4 hover:text-white hover:underline">
          Design system
        </Link>
      </div>
    </aside>
  );
}
