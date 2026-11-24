"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { ProfilReel } from "@/lib/data/types";
import { MODULES, ROLE_LABEL, ROLE_MODULES, SECTIONS_MENU, type ModuleId } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { NAV_ICONS } from "./nav-icons";

export function Sidebar({ open, onNavigate, profil }: { open: boolean; onNavigate: () => void; profil: ProfilReel }) {
  const pathname = usePathname();
  const { brand } = useSession();
  // Le menu suit le rôle réel : l’administrateur voit tout, quel que soit l’aperçu choisi.
  const autorises = new Set(ROLE_MODULES[profil.role]);
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
            "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
            active ? "bg-white/20 text-white shadow-sm" : "text-nav-text hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-nav-muted")} aria-hidden />
          <span className="min-w-0 flex-1 truncate">{m.label}</span>
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
      <div className="px-6 pb-6 pt-6">
        <Link href="/accueil" onClick={onNavigate} className="block rounded-sm">
          <span className="font-display block text-lg font-semibold leading-6 text-white">Espace Pro</span>
          <span className="block text-xs text-nav-muted">{brand === "picard" ? "Picard Serrures" : "Eliot"}</span>
        </Link>
      </div>

      <nav aria-label="Modules" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-6">
        <ul className="flex flex-col gap-0.5">
          <Entree id="accueil" />
        </ul>
        {sections.map((s) => (
          <div key={s.titre}>
            <p className="px-3 pb-2 text-xs font-semibold text-nav-muted">{s.titre}</p>
            <ul className="flex flex-col gap-0.5">
              {s.modules.map((id) => (
                <Entree key={id} id={id} />
              ))}
            </ul>
          </div>
        ))}
        {autorises.has("administration") ? (
          <ul className="mt-auto flex flex-col gap-0.5 border-t border-white/10 pt-4">
            <Entree id="administration" />
          </ul>
        ) : null}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="truncate text-sm font-medium text-white">
          {profil.prenom} {profil.nom}
        </p>
        <p className="text-xs text-nav-muted">Connecté, {ROLE_LABEL[profil.role].toLowerCase()}</p>
        <Link href="/design-system" onClick={onNavigate} className="mt-3 inline-block text-xs text-nav-muted underline-offset-4 hover:text-white hover:underline">
          Design system
        </Link>
      </div>
    </aside>
  );
}
