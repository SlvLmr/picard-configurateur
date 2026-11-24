import { Globe, MapPin, Phone, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { CLIENT_DEMO, type Apercu } from "@/lib/mock/marketing";

type Client = typeof CLIENT_DEMO;

function Etoiles({ note }: { note: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text">
      <Star className="size-3 fill-current text-cta" aria-hidden />
      {note}
    </span>
  );
}

/** Aperçu personnalisé d'un support, au nom du client. Maquette indicative, le BAT fait foi. */
export function ApercuSupport({ type, client = CLIENT_DEMO, className }: { type: Apercu; client?: Client; className?: string }) {
  const cadre = "overflow-hidden rounded-md border border-line bg-surface shadow-card";

  if (type === "flyer")
    return (
      <div className={cn(cadre, "mx-auto w-full max-w-64", className)} style={{ aspectRatio: "148 / 210" }}>
        <div className="flex h-1/2 flex-col justify-end bg-nav p-5 text-white">
          <p className="text-xs text-nav-muted">Mois de la sécurité</p>
          <p className="font-display mt-1 text-lg font-semibold leading-6">Protégez votre logement avec une porte certifiée A2P</p>
        </div>
        <div className="flex h-1/2 flex-col justify-between p-5">
          <div>
            <p className="font-semibold text-text">{client.raison}</p>
            <p className="mt-1 text-xs text-text-2">{client.adresse}</p>
            <p className="tabular text-xs text-text-2">{client.telephone}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="rounded-sm bg-text px-2 text-xs font-medium leading-5 text-surface">IAP {client.niveau}</span>
            <Etoiles note={`${client.note}, ${client.avis} avis`} />
          </div>
        </div>
      </div>
    );

  if (type === "carte")
    return (
      <div className={cn(cadre, "mx-auto flex w-full max-w-80 flex-col justify-between p-5", className)} style={{ aspectRatio: "85 / 55" }}>
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-base font-semibold text-text">{client.raison}</p>
          <span className="rounded-sm bg-text px-2 text-xs font-medium leading-5 text-surface">IAP {client.niveau}</span>
        </div>
        <div className="text-xs text-text-2">
          <p>{client.adresse}</p>
          <p className="tabular">{client.telephone}</p>
          <p className="text-accent">{client.site}</p>
        </div>
      </div>
    );

  if (type === "banniere")
    return (
      <div className={cn(cadre, "mx-auto flex w-full max-w-80 items-stretch", className)} style={{ aspectRatio: "16 / 6" }}>
        <div className="flex w-1/3 items-center justify-center bg-cta p-3">
          <span className="font-display text-sm font-bold text-cta-text">Picard Serrures</span>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1 bg-nav p-4 text-white">
          <p className="font-semibold">{client.raison}</p>
          <p className="tabular text-xs text-nav-muted">{client.telephone}</p>
          <p className="text-xs text-nav-muted">Installateur agréé {client.niveau}</p>
        </div>
      </div>
    );

  if (type === "post")
    return (
      <div className={cn(cadre, "mx-auto flex w-full max-w-64 flex-col", className)} style={{ aspectRatio: "1 / 1" }}>
        <div className="flex flex-1 flex-col justify-center bg-nav p-6 text-white">
          <p className="font-display text-xl font-semibold">Mars, le mois de la sécurité</p>
          <p className="mt-2 text-xs text-nav-muted">Diagnostic de votre porte offert</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-semibold text-text">{client.raison}</span>
          <span className="text-xs text-text-3">Nantes</span>
        </div>
      </div>
    );

  if (type === "google")
    return (
      <div className={cn(cadre, "mx-auto w-full max-w-80 p-5", className)}>
        <p className="font-semibold text-text">{client.raison}</p>
        <div className="mt-1 flex items-center gap-2">
          <Etoiles note={client.note} />
          <span className="text-xs text-text-3">({client.avis} avis), serrurier</span>
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-text-2">
          <MapPin className="size-3" aria-hidden />
          {client.adresse}
        </p>
        <p className="mt-1 text-xs font-medium text-success">Ouvert, ferme à 18 h 30</p>
        <div className="mt-4 flex gap-2">
          {[
            [Phone, "Appeler"],
            [MapPin, "Itinéraire"],
            [Globe, "Site web"],
          ].map(([Icon, l]) => {
            const I = Icon as typeof Phone;
            return (
              <span key={l as string} className="inline-flex h-8 items-center gap-1 rounded-full border border-line-strong px-3 text-xs font-medium text-accent">
                <I className="size-3" aria-hidden />
                {l as string}
              </span>
            );
          })}
        </div>
      </div>
    );

  if (type === "annonce")
    return (
      <div className={cn(cadre, "mx-auto w-full max-w-80", className)}>
        <div className="flex items-center gap-2 px-4 pt-4">
          <span className="inline-grid size-8 place-items-center rounded-full bg-nav text-xs font-bold text-white">SL</span>
          <div>
            <p className="text-sm font-semibold text-text">{client.raison}</p>
            <p className="text-xs text-text-3">Sponsorisé</p>
          </div>
        </div>
        <p className="px-4 pt-3 text-sm text-text-2">Votre porte d’entrée est-elle vraiment sûre ? Diagnostic gratuit à Nantes et alentours.</p>
        <div className="mt-3 flex h-24 items-end bg-nav p-4">
          <p className="font-display text-base font-semibold text-white">Porte blindée certifiée A2P</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-text-3">{client.site}</span>
          <span className="rounded-md bg-sunken px-3 text-xs font-semibold leading-8 text-text">Demander un devis</span>
        </div>
      </div>
    );

  return (
    <div className={cn(cadre, "mx-auto w-full max-w-80", className)}>
      <div className="flex items-center gap-2 border-b border-line bg-sunken px-3 py-2">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="ml-2 flex-1 truncate rounded-sm bg-surface px-2 text-xs leading-5 text-text-3">{client.site}</span>
      </div>
      <div className="bg-nav p-5 text-white">
        <p className="font-display text-lg font-semibold">{client.raison}</p>
        <p className="mt-1 text-xs text-nav-muted">Serrurier installateur agréé {client.niveau} à Nantes</p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        {["Réalisations", "Avis", "Devis"].map((l) => (
          <span key={l} className="rounded-sm bg-sunken py-2 text-center text-xs font-medium text-text-2">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
