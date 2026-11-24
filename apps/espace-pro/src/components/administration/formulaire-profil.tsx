"use client";

import { Field, Input, Select } from "@/components/ui/field";
import type { Option } from "@/lib/data/administration";
import { ROLE_LABEL, type RoleId } from "@/lib/roles";

export type ValeursProfil = { role: RoleId; prenom: string; nom: string; compteId: string | null; commercialId: string | null };

const ROLES_PROPOSES: RoleId[] = [
  "admin", "codir", "chef_service", "chef_marche", "atc", "repartiteur", "sav", "bureau_etudes", "qualite", "client_gerant", "client_equipe",
];

const AIDE_ROLE: Partial<Record<RoleId, string>> = {
  admin: "Accès complet, gestion des utilisateurs.",
  codir: "Pilotage et toutes les données, en lecture.",
  atc: "Son portefeuille de clients. Rattachez sa fiche commerciale.",
  repartiteur: "Validation et attribution des leads.",
  client_gerant: "Accès complet à l’espace de son entreprise. Rattachez le compte client.",
  client_equipe: "Accès limité : leads, configurateur, SAV, médiathèque. Rattachez le compte client.",
  sav: "Traitement des demandes SAV.",
  bureau_etudes: "Avis techniques SAV, configurateur.",
  qualite: "Non-conformités et actions correctives.",
};

/** Champs communs à l'invitation et à la modification d'un profil. */
export function FormulaireProfil({
  id,
  valeurs,
  onChange,
  comptes,
  commerciaux,
}: {
  id: string;
  valeurs: ValeursProfil;
  onChange: (v: ValeursProfil) => void;
  comptes: Option[];
  commerciaux: Option[];
}) {
  const client = valeurs.role === "client_gerant" || valeurs.role === "client_equipe";
  const set = (patch: Partial<ValeursProfil>) => onChange({ ...valeurs, ...patch });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Prénom" htmlFor={`${id}-prenom`}>
        <Input id={`${id}-prenom`} value={valeurs.prenom} onChange={(e) => set({ prenom: e.target.value })} autoComplete="off" />
      </Field>
      <Field label="Nom" htmlFor={`${id}-nom`}>
        <Input id={`${id}-nom`} value={valeurs.nom} onChange={(e) => set({ nom: e.target.value })} autoComplete="off" />
      </Field>
      <Field label="Rôle" htmlFor={`${id}-role`} hint={AIDE_ROLE[valeurs.role]} className="sm:col-span-2">
        <Select id={`${id}-role`} value={valeurs.role} onChange={(e) => set({ role: e.target.value as RoleId })}>
          {ROLES_PROPOSES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
      </Field>
      {client ? (
        <Field label="Compte client" htmlFor={`${id}-compte`} className="sm:col-span-2">
          <Select id={`${id}-compte`} value={valeurs.compteId ?? ""} onChange={(e) => set({ compteId: e.target.value || null })} required>
            <option value="">Choisir l’entreprise</option>
            {comptes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
                {c.detail ? ` (${c.detail})` : ""}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      {valeurs.role === "atc" ? (
        <Field label="Fiche commerciale" htmlFor={`${id}-commercial`} className="sm:col-span-2">
          <Select id={`${id}-commercial`} value={valeurs.commercialId ?? ""} onChange={(e) => set({ commercialId: e.target.value || null })} required>
            <option value="">Choisir le commercial</option>
            {commerciaux.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
                {c.detail ? ` (${c.detail})` : ""}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </div>
  );
}
