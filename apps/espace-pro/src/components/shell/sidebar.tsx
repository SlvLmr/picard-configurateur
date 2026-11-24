"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MODULES, ROLE_LABEL, ROLE_MODULES, isClient } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { STATS_LEADS, LEADS_CLIENT } from "@/lib/mock/leads";
import { NAV_ICONS } from "./nav-icons";
import type { ProfilReel } from "@/lib/data/types";

export function Sidebar({ open, onNavigate, profil }: { open: boolean; onNavigate: () => void; profil: ProfilReel }) {
  const pathname = usePathname();
  const { persona, brand } = useSession();
  const modules = ROLE_MODULES[persona.role];
  const leadCount = persona.role === "repartiteur" ? STATS_LEADS.aValider : isClient(persona.role) ? LEADS_CLIENT.length : undefined;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-nav text-nav-text transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="px-6 pb-8 pt-6">
        <Link href="/accueil" onClick={onNavigate} className="block rounded-sm">
          <span className="font-display block text-lg font-semibold leading-6 text-white">Espace Pro</span>
          <span className="block text-xs text-nav-muted">{brand === "picard" ? "Picard Serrures" : "Eliot"}</span>
        </Link>
      </div>

      <nav aria-label="Modules" className="flex-1 overflow-y-auto px-3">
        <ul className="flex flex-col gap-0.5">
          {modules.map((id) => {
            const m = MODULES[id];
            const Icon = NAV_ICONS[id];
            const active = pathname === m.href || pathname.startsWith(m.href + "/");
            return (
              <li key={id}>
                <Link
                  href={m.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    active ? "bg-nav-active text-white" : "text-nav-text hover:bg-nav-hover",
                  )}
                >
                  <Icon className={cn("size-4", active ? "text-white" : "text-nav-muted")} aria-hidden />
                  <span className="flex-1">{m.label}</span>
                  {id === "leads" && leadCount ? (
                    <span className="tabular rounded-sm bg-white px-2 text-xs font-semibold leading-5 text-nav">
                      {leadCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
                    <p className="text-sm font-medium text-white">
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
