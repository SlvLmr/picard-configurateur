"use client";

import { Mail, MessageSquareText, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { relancerEnvois } from "@/app/(app)/leads/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import type { Notification } from "@/lib/data/types";

const MOTIFS: Record<string, string> = {
  attribution: "Nouveau lead",
  attribution_atc: "Lead d’un client",
  relance: "Relance",
  enquete_client: "Enquête client",
  enquete_installateur: "Enquête installateur",
};

const dateHeure = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** Journal des e-mails et SMS envoyés à l'attribution, aux relances et pour les enquêtes. */
export function Envois({ notifications, configure }: { notifications: Notification[]; configure: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const enAttente = notifications.filter((n) => n.statut !== "envoye").length;
  return (
    <Panel>
      <PanelHeader
        title="E-mails et SMS"
        description="Envoyés à l’installateur et à son commercial à chaque attribution, aux relances et pour les enquêtes"
        actions={
          <Button size="sm" variant="secondary" disabled={pending || !enAttente} onClick={() => start(async () => toast((await relancerEnvois()).message))}>
            <RefreshCw aria-hidden />
            Envoyer les messages en attente
          </Button>
        }
      />
      {!configure ? (
        <p className="mx-6 mb-4 rounded-md bg-warning-soft px-4 py-3 text-sm text-warning">
          L’envoi n’est pas encore branché : les messages sont préparés et partiront dès que la clé Brevo sera ajoutée à la configuration.
        </p>
      ) : null}
      {notifications.length === 0 ? (
        <p className="border-t border-line px-6 py-8 text-sm text-text-2">Aucun message pour l’instant.</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.id} className="grid gap-2 border-t border-line px-6 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="flex min-w-0 items-start gap-3">
                {n.canal === "email" ? <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-text-3" /> : <MessageSquareText aria-hidden className="mt-0.5 size-4 shrink-0 text-text-3" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {n.destinataireNom ?? n.destinataire}
                    <span className="font-normal text-text-3"> {n.destinataire}</span>
                  </p>
                  <p className="text-xs text-text-3">
                    {MOTIFS[n.motif] ?? n.motif}
                    {n.leadReference ? `, ${n.leadReference}` : ""}, {dateHeure(n.creeLe)}
                    {n.erreur ? `, ${n.erreur}` : ""}
                  </p>
                </div>
              </div>
              <Badge variant={n.statut === "envoye" ? "success" : n.statut === "echec" ? "danger" : "warning"}>
                {n.statut === "envoye" ? "Envoyé" : n.statut === "echec" ? "Échec" : "En attente"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
