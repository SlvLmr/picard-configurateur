"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { MODULES, ROLE_MODULES, type RoleId } from "@/lib/roles";
import { LEADS } from "@/lib/mock/leads";
import { NAV_ICONS } from "./nav-icons";

type Item = { id: string; label: string; hint: string; href: string };

export function CommandPalette({ open, onClose, role }: { open: boolean; onClose: () => void; role: RoleId }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const mods = ROLE_MODULES[role].map((id) => ({ id, label: MODULES[id].label, hint: "Module", href: MODULES[id].href }));
    const leads = ROLE_MODULES[role].includes("leads")
      ? LEADS.map((l) => ({ id: l.id, label: `${l.contact}, ${l.ville}`, hint: `Lead ${l.id}`, href: "/leads" }))
      : [];
    const all = [...mods, ...leads];
    const n = q.trim().toLowerCase();
    return n ? all.filter((i) => (i.label + " " + i.hint).toLowerCase().includes(n)) : all;
  }, [role, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const go = (i: Item) => {
    onClose();
    router.push(i.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#071a33]/50 px-4 pt-24" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recherche"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-text-3" aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter" && items[active]) go(items[active]);
            }}
            placeholder="Client, lead, module…"
            className="h-12 flex-1 bg-transparent text-base text-text placeholder:text-text-3 focus:outline-none"
            aria-label="Rechercher"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-sm text-text-3">Aucun résultat pour « {q} ».</li>
          ) : (
            items.map((i, idx) => {
              const Icon = i.hint === "Module" ? NAV_ICONS[i.id as keyof typeof NAV_ICONS] : null;
              return (
                <li key={i.id} role="option" aria-selected={idx === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
                      idx === active ? "bg-sunken" : "",
                    )}
                  >
                    {Icon ? <Icon className="size-4 text-text-3" aria-hidden /> : <span className="size-4" />}
                    <span className="flex-1 font-medium text-text">{i.label}</span>
                    <span className="text-xs text-text-3">{i.hint}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
