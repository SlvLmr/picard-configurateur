"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { creerLead, type NouveauLead } from "@/app/(app)/leads/actions";
import { PanneauEdition } from "@/components/administration/panneau-edition";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { SOURCES_LEAD } from "./statuts";

const VIDE: NouveauLead = { source: "Téléphone", contact: "", telephone: "", email: "", adresse: "", cp: "", ville: "", projet: "", message: "", contactPrefere: "" };

export const PROJETS = ["Porte blindée", "Bloc-porte", "Serrure multipoints", "Serrure électrique", "Reproduction de clés", "Dépannage"];

/**
 * Création d'un lead. Le Lead Manager choisit la source et le lead entre dans sa file ;
 * l'installateur crée un lead pour lui-même, déjà accepté et jamais facturé.
 */
export function BoutonNouveauLead({ pourInstallateur = false }: { pourInstallateur?: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ouvert, setOuvert] = useState(false);
  const [l, setL] = useState<NouveauLead>(VIDE);
  const champ = (k: keyof NouveauLead) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setL({ ...l, [k]: e.target.value });

  const valider = () =>
    start(async () => {
      const r = await creerLead(l);
      toast(r.message);
      if (r.ok) {
        setOuvert(false);
        setL(VIDE);
        if (!pourInstallateur && r.id) router.push(`/lead-management/${r.id}`);
      }
    });

  return (
    <>
      <Button variant="primary" onClick={() => setOuvert(true)}>
        <Plus aria-hidden />
        Nouveau lead
      </Button>
      {ouvert ? (
        <PanneauEdition
          titre="Nouveau lead"
          description={pourInstallateur ? "Un projet reçu en direct : il est suivi ici comme les autres, sans facturation." : "Demande reçue par téléphone, sur un salon ou par e-mail."}
          onFermer={() => setOuvert(false)}
          pied={
            <>
              <Button variant="ghost" onClick={() => setOuvert(false)}>
                Annuler
              </Button>
              <Button variant="primary" disabled={pending || !l.contact.trim() || !/^\d{5}$/.test(l.cp) || !l.projet} onClick={valider}>
                Créer le lead
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {!pourInstallateur ? (
              <Field label="Source" htmlFor="nl-source" className="sm:col-span-2">
                <Combobox id="nl-source" value={l.source} onChange={(v) => setL({ ...l, source: v })} options={SOURCES_LEAD.map((s) => ({ value: s, label: s }))} />
              </Field>
            ) : null}
            <Field label="Nom du client" htmlFor="nl-contact" className="sm:col-span-2">
              <Input id="nl-contact" value={l.contact} onChange={champ("contact")} required />
            </Field>
            <Field label="Téléphone" htmlFor="nl-tel">
              <Input id="nl-tel" type="tel" value={l.telephone} onChange={champ("telephone")} />
            </Field>
            <Field label="E-mail" htmlFor="nl-email">
              <Input id="nl-email" type="email" value={l.email} onChange={champ("email")} />
            </Field>
            <Field label="Contact préféré" htmlFor="nl-pref" className="sm:col-span-2">
              <Combobox
                id="nl-pref"
                value={l.contactPrefere}
                onChange={(v) => setL({ ...l, contactPrefere: v as NouveauLead["contactPrefere"] })}
                options={[
                  { value: "", label: "Indifférent" },
                  { value: "telephone", label: "Téléphone" },
                  { value: "email", label: "E-mail" },
                  { value: "sms", label: "SMS" },
                ]}
              />
            </Field>
            <Field label="Adresse" htmlFor="nl-adresse" className="sm:col-span-2">
              <Input id="nl-adresse" value={l.adresse} onChange={champ("adresse")} autoComplete="off" />
            </Field>
            <Field label="Code postal" htmlFor="nl-cp">
              <Input id="nl-cp" inputMode="numeric" pattern="[0-9]{5}" value={l.cp} onChange={champ("cp")} required />
            </Field>
            <Field label="Ville" htmlFor="nl-ville">
              <Input id="nl-ville" value={l.ville} onChange={champ("ville")} />
            </Field>
            <Field label="Projet" htmlFor="nl-projet" className="sm:col-span-2">
              <Combobox id="nl-projet" value={l.projet || null} onChange={(v) => setL({ ...l, projet: v })} placeholder="Choisir un produit" options={PROJETS.map((p) => ({ value: p, label: p }))} />
            </Field>
            <Field label="Message du client" htmlFor="nl-message" className="sm:col-span-2">
              <textarea
                id="nl-message"
                value={l.message}
                onChange={champ("message")}
                rows={4}
                className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
            </Field>
          </div>
        </PanneauEdition>
      ) : null}
    </>
  );
}
