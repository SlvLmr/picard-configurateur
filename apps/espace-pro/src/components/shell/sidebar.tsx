"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
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

export function Sidebar({
  open, onNavigate, profil, modules, compteurs, replie = false, onBasculer,
}: { open: boolean; onNavigate: () => void; profil: ProfilReel; modules: ModuleId[]; compteurs: CompteursMenu; replie?: boolean; onBasculer?: () => void }) {
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
    const correspond = (href: string) => pathname === href || pathname.startsWith(href + "/");
    const plusPrecis = modules.some((x) => x !== id && MODULES[x].href.length > m.href.length && MODULES[x].href.startsWith(m.href) && correspond(MODULES[x].href));
    const active = correspond(m.href) && !plusPrecis;
    return (
      <li>
        <Link
          href={m.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          title={replie ? m.label : undefined}
          className={cn(
            "relative",
            replie && "lg:justify-center lg:px-0 lg:py-2",
            "flex items-center gap-3 rounded-md px-3 py-0.5 text-[13px] font-medium leading-5 transition-colors",
            active ? "bg-white/20 text-white shadow-sm" : "text-nav-text hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-nav-muted")} aria-hidden />
          <span className={cn("min-w-0 flex-1 truncate", replie && "lg:sr-only")}>{m.label}</span>
          {pastille(id) > 0 ? (
            <span className={cn("tabular flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-xs font-bold leading-none text-cta-text shadow-cta", replie && "lg:absolute lg:right-2 lg:top-0.5 lg:h-2 lg:min-w-2 lg:p-0 lg:text-[0px]")} aria-label={`${pastille(id)} nouveauté${pastille(id) > 1 ? "s" : ""}`}>
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
        replie && "lg:w-16",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <Link href="/accueil" onClick={onNavigate} aria-label="Espace Pro, accueil" className={cn("mx-3 mb-1 mt-1 flex flex-col items-center gap-1 rounded-md px-3 py-2", replie && "lg:mx-2 lg:px-0 lg:py-3")}>
        {replie ? (
          <svg viewBox="5 23 43 43" className="hidden size-8 lg:block" aria-hidden>
            <path fill="#fff" d="M5.19 23.15H26.4v21.22H5.19zM32.09 23.15h15.53v15.53H32.09zM5.19 50.05h15.53v15.53H5.19zM26.4 44.36h21.21v21.22H26.4z" />
          </svg>
        ) : null}
        <span className={cn("contents", replie && "lg:hidden")}>
          <LogoMarque marque={brand} anime className="h-10" />
          <SignatureEspacePro taille="lg" />
        </span>
      </Link>

      <nav aria-label="Modules" className={cn("scroll-nav flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-2", replie && "lg:gap-3 lg:px-2")}>
        <ul className="flex flex-col">
          <Entree id="accueil" />
        </ul>
        {sections.map((s) => (
          <div key={s.titre}>
            {replie ? <span aria-hidden className="mx-auto mb-2 hidden h-px w-6 lg:block" style={{ background: "color-mix(in srgb, var(--cta) 60%, transparent)" }} /> : null}
            <p className={cn("truncate whitespace-nowrap px-3 pb-1 text-xs font-bold uppercase text-cta", replie && "lg:sr-only")} style={{ fontVariationSettings: '"wdth" 80' }}>
              {s.titre}
            </p>
            <ul className="flex flex-col">
              {s.modules.map((id) => (
                <Entree key={id} id={id} />
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-auto border-t border-white/10 pt-2">
          {autorises.has("administration") ? (
            <ul className="flex flex-col">
              <Entree id="administration" />
            </ul>
          ) : null}
          {onBasculer ? (
            <button
              type="button"
              onClick={onBasculer}
              title={replie ? "Déplier le menu" : "Replier le menu"}
              aria-label={replie ? "Déplier le menu" : "Replier le menu"}
              className={cn("hidden w-full items-center gap-3 rounded-md px-3 py-0.5 text-[13px] font-medium leading-5 text-nav-muted transition-colors hover:bg-white/10 hover:text-white lg:flex", replie && "lg:justify-center lg:px-0 lg:py-2")}
            >
              {replie ? <PanelLeftOpen aria-hidden className="size-4 shrink-0" /> : <PanelLeftClose aria-hidden className="size-4 shrink-0" />}
              <span className={cn(replie && "lg:sr-only")}>Replier le menu</span>
            </button>
          ) : null}
          <p className={cn("truncate px-3 pt-1 text-xs text-nav-muted", replie && "lg:hidden")}>
            {profil.prenom} {profil.nom}, {ROLE_LABEL[profil.role].toLowerCase()}
          </p>
        </div>
      </nav>

    </aside>
  );
}
