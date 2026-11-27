"use client";

import { CalendarPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { creerEvenement } from "@/app/(app)/administration/contenus/actions";
import { TYPES_AGENDA } from "@/components/accueil/calendrier";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { CIBLES, type Cible } from "@/lib/cibles";

const TYPES = (["salon", "campagne", "digital", "ressource", "pos", "reseau"] as const).map((t) => ({
  value: t,
  label: TYPES_AGENDA[t].label,
  prefixe: <span aria-hidden className="block size-2 rounded-full" style={{ background: TYPES_AGENDA[t].couleur }} />,
}));
const PUBLICS = (Object.keys(CIBLES) as Cible[]).map((k) => ({ value: k, label: CIBLES[k].label }));
const VIDE = { titre: "", type: "salon", debut: "", fin: "", lieu: "", description: "", lienUrl: "", cible: "tous" as Cible };
const zoneTexte =
  "min-h-24 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none";

/** Bouton et fenêtre d'ajout d'un événement à l'agenda du réseau (administrateur), sans quitter l'accueil. */
export function AjoutEvenement() {
  const toast = useToast();
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [e, setE] = useState(VIDE);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!ouvert) return;
    const touche = (ev: KeyboardEvent) => ev.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [ouvert]);

  const enregistrer = () =>
    start(async () => {
      const res = await creerEvenement(e);
      toast(res.message);
      if (res.ok) {
        setE(VIDE);
        setOuvert(false);
        router.refresh();
      }
    });

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOuvert(true)}>
        <CalendarPlus aria-hidden />
        Ajouter un événement
      </Button>
      {ouvert
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a33]/40 p-4" onMouseDown={() => setOuvert(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Ajouter un événement"
                onMouseDown={(ev) => ev.stopPropagation()}
                className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-surface shadow-2xl"
              >
                <header className="flex items-start gap-4 border-b border-line px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold text-text">Ajouter un événement</h2>
                    <p className="mt-0.5 text-sm text-text-3">Il apparaît aussitôt dans l’agenda du réseau, pour le public choisi.</p>
                  </div>
                  <Button variant="ghost" size="sm" iconOnly aria-label="Fermer" onClick={() => setOuvert(false)}>
                    <X />
                  </Button>
                </header>
                <div className="flex flex-col gap-4 overflow-y-auto px-6 py-6">
                  <Field label="Titre" htmlFor="ev-titre">
                    <Input id="ev-titre" autoFocus value={e.titre} onChange={(x) => setE({ ...e, titre: x.target.value })} placeholder="Salon Equip’Baie" />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Type" htmlFor="ev-type">
                      <Combobox id="ev-type" options={TYPES} value={e.type} onChange={(v) => setE({ ...e, type: v })} />
                    </Field>
                    <Field label="Public" htmlFor="ev-cible">
                      <Combobox id="ev-cible" options={PUBLICS} value={e.cible} onChange={(v) => setE({ ...e, cible: v as Cible })} />
                    </Field>
                    <Field label="Début" htmlFor="ev-debut">
                      <Input id="ev-debut" type="datetime-local" value={e.debut} onChange={(x) => setE({ ...e, debut: x.target.value })} />
                    </Field>
                    <Field label="Fin" htmlFor="ev-fin" hint="Facultatif">
                      <Input id="ev-fin" type="datetime-local" value={e.fin} onChange={(x) => setE({ ...e, fin: x.target.value })} />
                    </Field>
                    <Field label="Lieu" htmlFor="ev-lieu">
                      <Input id="ev-lieu" value={e.lieu} onChange={(x) => setE({ ...e, lieu: x.target.value })} placeholder="Paris Expo, ou En ligne" />
                    </Field>
                    <Field label="Lien d’inscription" htmlFor="ev-lien" hint="Facultatif">
                      <Input id="ev-lien" value={e.lienUrl} onChange={(x) => setE({ ...e, lienUrl: x.target.value })} />
                    </Field>
                  </div>
                  <Field label="Description" htmlFor="ev-desc" hint="Facultatif">
                    <textarea id="ev-desc" className={zoneTexte} value={e.description} onChange={(x) => setE({ ...e, description: x.target.value })} />
                  </Field>
                </div>
                <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
                  <Button variant="ghost" onClick={() => setOuvert(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" disabled={pending || !e.titre.trim() || !e.debut} onClick={enregistrer}>
                    Ajouter à l’agenda
                  </Button>
                </footer>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
