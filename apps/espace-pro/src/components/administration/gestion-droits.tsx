"use client";

import { useState, useTransition } from "react";
import { majDroit } from "@/app/(app)/administration/actions";
import { NAV_ICONS } from "@/components/shell/nav-icons";
import { Combobox } from "@/components/ui/combobox";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Droit } from "@/lib/data/administration";
import { MODULES, ROLE_LABEL, SECTIONS_MENU, type ModuleId, type RoleId } from "@/lib/roles";

const INTERNES: RoleId[] = ["codir", "chef_service", "chef_marche", "atc", "repartiteur", "sav", "bureau_etudes", "qualite"];
const CLIENTS: RoleId[] = ["client_gerant", "client_equipe"];
const PORTEES = [
  { value: "tous", label: "Tous les clients", niveaux: [] as string[] },
  { value: "iap", label: "IAP uniquement (tous niveaux)", niveaux: ["Elite", "Premium", "Officiel"] },
  { value: "premium", label: "IAP Elite et Premium", niveaux: ["Elite", "Premium"] },
  { value: "elite", label: "IAP Elite uniquement", niveaux: ["Elite"] },
];
const porteeDe = (n: string[]) => PORTEES.find((p) => p.niveaux.length === n.length && p.niveaux.every((x) => n.includes(x)))?.value ?? "tous";

export function GestionDroits({ droits }: { droits: Droit[] }) {
  const toast = useToast();
  const [, start] = useTransition();
  const [etat, setEtat] = useState(() => new Map(droits.map((d) => [`${d.module}:${d.role}`, d])));

  const lire = (m: ModuleId, r: RoleId): Droit => etat.get(`${m}:${r}`) ?? { module: m, role: r, autorise: false, niveaux: [] };

  const enregistrer = (m: ModuleId, r: RoleId, autorise: boolean, niveaux: string[]) => {
    const avant = lire(m, r);
    const apres = { ...avant, autorise, niveaux: niveaux as Droit["niveaux"] };
    setEtat((e) => new Map(e).set(`${m}:${r}`, apres));
    start(async () => {
      const res = await majDroit(m, r, autorise, niveaux);
      if (!res.ok) setEtat((e) => new Map(e).set(`${m}:${r}`, avant));
      toast(res.message);
    });
  };

  const modules = SECTIONS_MENU.flatMap((s) => s.modules.map((m) => ({ m, section: s.titre })));

  const Interrupteur = ({ m, r }: { m: ModuleId; r: RoleId }) => {
    const d = lire(m, r);
    return (
      <button
        type="button"
        role="switch"
        aria-checked={d.autorise}
        onClick={() => enregistrer(m, r, !d.autorise, d.niveaux)}
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
          d.autorise ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-surface text-text-3 hover:border-line-strong",
        )}
      >
        <span aria-hidden className={cn("size-2 rounded-full", d.autorise ? "bg-accent" : "bg-line-strong")} />
        {ROLE_LABEL[r]}
      </button>
    );
  };

  return (
    <>
      <PageHeader
        title="Rôles et droits"
        description="Choisissez qui accède à chaque rubrique. Le contenu d’une rubrique s’adapte ensuite au rôle : un commercial n’y voit que son portefeuille, un client que son entreprise. L’accueil est ouvert à tous, l’administration vous est réservée."
      />
      <Panel>
        <ul>
          {modules.map(({ m, section }, i) => {
            const clientsActifs = CLIENTS.some((r) => lire(m, r).autorise);
            const portee = porteeDe(lire(m, "client_gerant").niveaux);
            return (
              <li key={m} className={cn("grid gap-4 px-6 py-5 lg:grid-cols-[240px_minmax(0,1fr)]", i > 0 && "border-t border-line")}>
                <div className="flex items-start gap-3">
                  <Picto icon={NAV_ICONS[m]} size="sm" />
                  <div>
                    <p className="font-semibold text-text">{MODULES[m].label}</p>
                    <p className="text-xs text-text-3">{section}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-text-3">Équipes Picard</p>
                    <div className="flex flex-wrap gap-2">
                      {INTERNES.map((r) => (
                        <Interrupteur key={r} m={m} r={r} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-text-3">Clients</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {CLIENTS.map((r) => (
                        <Interrupteur key={r} m={m} r={r} />
                      ))}
                      {clientsActifs ? (
                        <Combobox
                          label={`Clients concernés par ${MODULES[m].label}`}
                          size="sm"
                          className="w-full sm:w-64"
                          value={portee}
                          onChange={(v) => {
                            const niveaux = PORTEES.find((p) => p.value === v)?.niveaux ?? [];
                            CLIENTS.forEach((r) => lire(m, r).autorise && enregistrer(m, r, true, niveaux));
                          }}
                          options={PORTEES.map((p) => ({ value: p.value, label: p.label }))}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
