"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export const RUBRIQUES_ADMIN = [
  { href: "/administration", label: "Vue d’ensemble" },
  { href: "/administration/utilisateurs", label: "Utilisateurs" },
  { href: "/administration/commerciaux", label: "Commerciaux et zones" },
  { href: "/administration/clients", label: "Clients" },
  { href: "/administration/contenus", label: "Actualités et calendrier" },
  { href: "/administration/droits", label: "Rôles et droits" },
  { href: "/administration/parametres", label: "Paramètres" },
];

/** Onglets communs à toutes les rubriques de l'administration. */
export function OngletsAdmin() {
  const pathname = usePathname();
  return (
    <nav aria-label="Rubriques de l’administration" className="-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {RUBRIQUES_ADMIN.map((r) => {
          const actif = r.href === "/administration" ? pathname === r.href : pathname.startsWith(r.href);
          return (
            <li key={r.href}>
              <Link
                href={r.href}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-10 items-center border-b-2 px-3 text-sm font-medium transition-colors",
                  actif ? "border-cta text-text" : "border-transparent text-text-2 hover:text-text",
                )}
              >
                {r.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
