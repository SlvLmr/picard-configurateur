"use client";

import { Download, X } from "lucide-react";
import { useTransition } from "react";
import { lienTelechargement } from "@/app/(app)/mediatheque/actions";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Picto } from "@/components/ui/picto";
import { useToast } from "@/components/ui/toast";
import type { Ressource } from "@/lib/data/mediatheque";
import { formatJour, formatTaille, MARQUES, publicLibelle, TYPES } from "./libelles";

export function DetailRessource({ r, onClose }: { r: Ressource; onClose: () => void }) {
  const toast = useToast();
  const [enCours, start] = useTransition();
  const t = TYPES[r.type];

  const telecharger = () =>
    start(async () => {
      const res = await lienTelechargement(r.id);
      toast(res.message);
      if (res.ok && res.donnee) window.location.assign(res.donnee);
    });

  const infos: [string, string | null][] = [
    ["Nature", t.label],
    ["Gamme", r.gamme],
    ["Marque", MARQUES[r.marque]],
    ["Format", [r.format, formatTaille(r.tailleOctets)].filter(Boolean).join(", ") || null],
    ["Version", `${r.version}, mise à jour le ${formatJour(r.misAJourLe)}`],
    ["Accessible à", publicLibelle(r.rolesAutorises, r.niveauxAutorises)],
    ["Téléchargements", `${r.telechargements} sur 30 jours`],
  ];

  return (
    <Panel aria-label={`Détail : ${r.titre}`}>
      <PanelHeader
        title={r.titre}
        description={r.kit ? `Kit ${r.kit}` : undefined}
        actions={
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Fermer le détail">
            <X />
          </Button>
        }
      />
      <PanelBody className="flex flex-col gap-6">
        <div className="flex gap-3">
          <Picto icon={t.icon} tone={t.tone} />
          <p className="text-sm text-text-2">{r.description ?? "Pas de description."}</p>
        </div>
        <dl className="text-sm">
          {infos.map(([k, v]) =>
            v ? (
              <div key={k} className="flex justify-between gap-4 border-t border-line py-2">
                <dt className="text-text-3">{k}</dt>
                <dd className="text-right font-medium text-text">{v}</dd>
              </div>
            ) : null,
          )}
        </dl>
        <div>
          <Button variant="primary" className="w-full" onClick={telecharger} disabled={!r.fichierChemin || enCours}>
            <Download aria-hidden />
            {enCours ? "Préparation…" : "Télécharger"}
          </Button>
          {!r.fichierChemin ? (
            <p className="mt-2 text-xs text-text-3">
              {r.demo
                ? "Ressource de démonstration : le fichier sera déposé par l’équipe marketing."
                : "Le fichier n’a pas encore été déposé."}
            </p>
          ) : (
            <p className="mt-2 text-xs text-text-3">Lien personnel valable 2 minutes.</p>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}
