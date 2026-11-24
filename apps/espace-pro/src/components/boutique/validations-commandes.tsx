"use client";

import { Check, ShoppingBag, X } from "lucide-react";
import { useState, useTransition } from "react";
import { validerCommande } from "@/app/(app)/boutique/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Cote } from "@/components/ui/cote";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { CommandeAValider } from "@/lib/data/boutique";
import { euros } from "./produit-visuel";

/** File de validation des commandes sur enveloppe de plus de 300 €. */
export function ValidationsCommandes({ commandes }: { commandes: CommandeAValider[] }) {
  const toast = useToast();
  const [traitees, setTraitees] = useState<string[]>([]);
  const [refus, setRefus] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const restantes = commandes.filter((c) => !traitees.includes(c.id));

  const decider = (c: CommandeAValider, valider: boolean) => {
    if (!valider && !motif.trim()) {
      toast("Indiquez le motif du refus : il sera visible par le commercial.");
      return;
    }
    setEnCours(c.id);
    startTransition(async () => {
      const r = await validerCommande(c.id, valider, valider ? "" : motif);
      setEnCours(null);
      toast(r.message);
      if (r.ok) {
        setTraitees((t) => [...t, c.id]);
        setRefus(null);
        setMotif("");
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Validation des commandes"
        description="Commandes passées par les commerciaux sur leur enveloppe, au-delà de 300 €. Un refus remet le stock et libère l’enveloppe."
        actions={
          <ButtonLink href="/boutique" variant="secondary">
            Retour à la boutique
          </ButtonLink>
        }
      />
      <Panel>
        <PanelHeader title="En attente" description={restantes.length ? `${restantes.length} commande${restantes.length > 1 ? "s" : ""}, de la plus ancienne à la plus récente` : undefined} />
        {restantes.length === 0 ? (
          <p className="border-t border-line px-6 py-10 text-sm text-text-2">Aucune commande à valider. Les prochaines demandes des commerciaux apparaîtront ici.</p>
        ) : (
          <ul>
            {restantes.map((c) => {
              const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(c.creeLe));
              const apres = c.enveloppe ? c.enveloppe.consomme : null;
              return (
                <li key={c.id} className={cn("border-t border-line px-6 py-5 transition-opacity", enCours === c.id && "opacity-60")}>
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-start">
                    <div className="flex min-w-0 gap-3">
                      <Picto icon={ShoppingBag} tone="cta" size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-text">{c.reference}</span>
                          <span className="tabular font-semibold text-text">{euros(c.totalEuros)}</span>
                          <span className="text-xs text-text-3">{date}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-text-2">
                          {c.commercial ?? "Commercial"}
                          {c.client ? ` pour ${c.client}` : ""}
                        </p>
                        <ul className="mt-2 text-sm text-text-2">
                          {c.lignes.map((l, i) => (
                            <li key={`${l.nom}-${i}`} className="tabular">
                              {l.quantite} × {l.nom}
                              {l.variante ? ` (${l.variante})` : ""}, {euros(l.prixEuros)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {c.enveloppe && apres !== null ? (
                      <Cote
                        label={`Enveloppe de ${c.commercial ?? "ce commercial"} consommée`}
                        value={Math.min(apres, c.enveloppe.montant)}
                        max={c.enveloppe.montant}
                        tone={apres / c.enveloppe.montant > 0.9 ? "warning" : "accent"}
                        valueLabel={`${euros(apres)} engagés`}
                        startLabel="Enveloppe annuelle"
                        endLabel={euros(c.enveloppe.montant)}
                      />
                    ) : (
                      <p className="text-sm text-text-3">Enveloppe non renseignée pour ce commercial.</p>
                    )}

                    <div className="flex flex-wrap gap-2 lg:justify-self-end">
                      <Button variant="primary" size="sm" disabled={enCours === c.id} onClick={() => decider(c, true)}>
                        <Check aria-hidden />
                        Valider
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={enCours === c.id}
                        onClick={() => {
                          setRefus(refus === c.id ? null : c.id);
                          setMotif("");
                        }}
                      >
                        <X aria-hidden />
                        Refuser
                      </Button>
                    </div>
                  </div>

                  {refus === c.id ? (
                    <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md bg-sunken p-4">
                      <Field label="Motif du refus" htmlFor={`motif-${c.id}`} hint="Visible par le commercial dans l’historique de ses commandes." className="min-w-64 flex-1">
                        <Input id={`motif-${c.id}`} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. budget du trimestre déjà engagé" autoFocus />
                      </Field>
                      <Button variant="danger" disabled={enCours === c.id} onClick={() => decider(c, false)}>
                        Confirmer le refus
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
