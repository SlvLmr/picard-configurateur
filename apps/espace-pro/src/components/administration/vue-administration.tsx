"use client";

import { MailPlus, UserCheck, UserRoundX, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { annulerInvitation, definirProfil, inviter } from "@/app/(app)/administration/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { KpiBand } from "@/components/ui/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Invitation, Option, Utilisateur } from "@/lib/data/administration";
import { ROLE_LABEL } from "@/lib/roles";
import { FormulaireProfil, type ValeursProfil } from "./formulaire-profil";

type Filtre = "tous" | "actifs" | "sans_profil" | "desactives";

const dateCourte = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "Jamais";

export function VueAdministration({
  utilisateurs,
  invitations,
  commerciaux,
  comptes,
  moiId,
}: {
  utilisateurs: Utilisateur[];
  invitations: Invitation[];
  commerciaux: Option[];
  comptes: Option[];
  moiId: string;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [selection, setSelection] = useState<string | null>(null);
  const [edition, setEdition] = useState<ValeursProfil & { actif: boolean }>({ role: "client_gerant", prenom: "", nom: "", compteId: null, commercialId: null, actif: true });
  const [email, setEmail] = useState("");
  const [invite, setInvite] = useState<ValeursProfil>({ role: "client_gerant", prenom: "", nom: "", compteId: null, commercialId: null });

  const actifs = utilisateurs.filter((u) => u.role && u.actif);
  const sansProfil = utilisateurs.filter((u) => !u.role);
  const desactives = utilisateurs.filter((u) => u.role && !u.actif);
  const liste = filtre === "actifs" ? actifs : filtre === "sans_profil" ? sansProfil : filtre === "desactives" ? desactives : utilisateurs;
  const choisi = utilisateurs.find((u) => u.id === selection) ?? null;

  const ouvrir = (u: Utilisateur) => {
    setSelection(u.id);
    setEdition({ role: u.role ?? "client_gerant", prenom: u.prenom ?? "", nom: u.nom ?? "", compteId: u.compteId, commercialId: u.commercialId, actif: u.actif ?? true });
  };

  const executer = (f: () => Promise<{ ok: boolean; message: string }>, apres?: () => void) =>
    start(async () => {
      const r = await f();
      toast(r.message);
      if (r.ok) apres?.();
    });

  return (
    <>
      <PageHeader title="Administration" description="Donnez un rôle à chaque utilisateur, rattachez les clients à leur entreprise et les commerciaux à leur fiche, et préparez les invitations." />
      <KpiBand
        items={[
          { label: "Utilisateurs actifs", value: actifs.length, icon: UserCheck, tone: "success" },
          { label: "Comptes sans rôle", value: sansProfil.length, icon: UserRoundX, tone: sansProfil.length ? "warning" : "neutral", note: "Connectés, mais sans accès" },
          { label: "Invitations en attente", value: invitations.length, icon: MailPlus, tone: "cta" },
          { label: "Accès désactivés", value: desactives.length, icon: UserX, tone: "neutral" },
        ]}
      />

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Utilisateurs" description="Choisissez un utilisateur pour modifier son accès" />
          <div className="px-6 pb-4">
            <Segmented
              label="Filtrer les utilisateurs"
              value={filtre}
              onChange={setFiltre}
              options={[
                { value: "tous", label: "Tous", count: utilisateurs.length },
                { value: "actifs", label: "Actifs", count: actifs.length },
                { value: "sans_profil", label: "Sans rôle", count: sansProfil.length },
                { value: "desactives", label: "Désactivés", count: desactives.length },
              ]}
            />
          </div>
          {liste.length === 0 ? (
            <p className="border-t border-line px-6 py-10 text-sm text-text-2">Aucun utilisateur dans cette vue.</p>
          ) : (
            <ul>
              {liste.map((u) => {
                const nom = [u.prenom, u.nom].filter(Boolean).join(" ") || u.email;
                return (
                  <li key={u.id} className="border-t border-line">
                    <button
                      type="button"
                      onClick={() => ouvrir(u)}
                      aria-pressed={selection === u.id}
                      className={cn("flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-sunken", selection === u.id && "bg-sunken")}
                    >
                      <Avatar name={nom} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-text">{nom}</span>
                          {u.id === moiId ? <Badge variant="accent">Vous</Badge> : null}
                        </span>
                        <span className="block truncate text-sm text-text-2">{u.compteNom ?? u.commercialNom ?? u.email}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        {u.role ? <Badge variant={u.actif ? "neutral" : "danger"}>{u.actif ? ROLE_LABEL[u.role] : "Désactivé"}</Badge> : <Badge variant="warning">Sans rôle</Badge>}
                        <span className="text-xs text-text-3">Connexion : {dateCourte(u.derniereConnexion)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-8">
          {choisi ? (
            <Panel>
              <PanelHeader title={choisi.role ? "Modifier l’accès" : "Donner un rôle"} description={choisi.email} />
              <PanelBody className="flex flex-col gap-6">
                <FormulaireProfil id="edition" valeurs={edition} onChange={(v) => setEdition({ ...edition, ...v })} comptes={comptes} commerciaux={commerciaux} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" disabled={pending} onClick={() => executer(() => definirProfil(choisi.id, { ...edition, actif: true }))}>
                    Enregistrer
                  </Button>
                  {choisi.role && choisi.actif && choisi.id !== moiId ? (
                    <Button variant="danger" disabled={pending} onClick={() => executer(() => definirProfil(choisi.id, { ...edition, actif: false }))}>
                      Désactiver l’accès
                    </Button>
                  ) : null}
                  <Button variant="ghost" onClick={() => setSelection(null)}>
                    Fermer
                  </Button>
                </div>
              </PanelBody>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Inviter un utilisateur" description="Son rôle sera appliqué dès la création de son compte" />
            <PanelBody className="flex flex-col gap-6">
              <Field label="Adresse e-mail" htmlFor="invite-email">
                <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
              </Field>
              <FormulaireProfil id="invite" valeurs={invite} onChange={setInvite} comptes={comptes} commerciaux={commerciaux} />
              <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
                La création des comptes est encore fermée sur votre projet Supabase. L’invitation est enregistrée et s’appliquera automatiquement dès l’ouverture des inscriptions aux personnes invitées.
              </p>
              <Button
                variant="primary"
                disabled={pending || !email.includes("@")}
                onClick={() =>
                  executer(
                    () => inviter(email, invite),
                    () => {
                      setEmail("");
                      setInvite({ role: invite.role, prenom: "", nom: "", compteId: null, commercialId: null });
                    },
                  )
                }
                className="self-start"
              >
                <MailPlus aria-hidden />
                Enregistrer l’invitation
              </Button>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Invitations en attente" />
            {invitations.length === 0 ? (
              <p className="border-t border-line px-6 py-6 text-sm text-text-2">Aucune invitation en attente.</p>
            ) : (
              <ul>
                {invitations.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 border-t border-line px-6 py-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-text">{[i.prenom, i.nom].filter(Boolean).join(" ") || i.email}</span>
                      <span className="block truncate text-sm text-text-2">
                        {i.email}, {ROLE_LABEL[i.role].toLowerCase()}
                      </span>
                    </span>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => executer(() => annulerInvitation(i.id))}>
                      Annuler
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
