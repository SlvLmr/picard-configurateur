import { cn } from "@/lib/cn";

/**
 * Symbole Espace Pro : une porte vue en élévation, sa serrure en laiton,
 * et la ligne de cote du plan technique (l'élément signature de l'interface).
 */
export function SymboleEspacePro({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="ep-laiton" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2cf7a" />
          <stop offset="0.55" stopColor="#e3a92b" />
          <stop offset="1" stopColor="#c98f17" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#ep-laiton)" />
      <rect x="1.5" y="1.5" width="37" height="37" rx="9.5" fill="none" stroke="#ffffff" strokeOpacity="0.35" />
      {/* Bâti et vantail */}
      <path d="M12.5 29V9.5h15V29" fill="none" stroke="#0b2545" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M16 29V13h8.5v16" fill="none" stroke="#0b2545" strokeWidth="1.4" strokeLinejoin="round" opacity="0.55" />
      {/* Serrure */}
      <circle cx="22.4" cy="20" r="1.9" fill="#0b2545" />
      <path d="M21.7 21.2h1.4l.5 3h-2.4z" fill="#0b2545" />
      {/* Ligne de cote */}
      <path d="M12.5 33.5h15M12.5 31.8v3.4M27.5 31.8v3.4" stroke="#0b2545" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Logotype complet : symbole et nom, pour le menu, la connexion et les documents. */
export function LogoEspacePro({ sousTitre, className, clair = true }: { sousTitre?: string; className?: string; clair?: boolean }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <SymboleEspacePro className="size-10" />
      <span className="min-w-0 leading-none">
        <span className={cn("font-display block text-lg font-bold tracking-tight", clair ? "text-white" : "text-text")} style={{ fontVariationSettings: '"wdth" 118' }}>
          Espace Pro
        </span>
        {sousTitre ? <span className={cn("mt-1 block truncate text-xs", clair ? "text-nav-muted" : "text-text-3")}>{sousTitre}</span> : null}
      </span>
    </span>
  );
}

/**
 * Signature de l'outil, centrée sous le logo de la marque : « Espace Pro » en laiton,
 * encadré de deux filets symétriques qui s'effacent vers l'extérieur.
 */
export function SignatureEspacePro({ taille = "sm", className }: { taille?: "sm" | "lg"; className?: string }) {
  const filet = (sens: "gauche" | "droite") => (
    <span
      aria-hidden
      className="h-px flex-1"
      style={{ background: `linear-gradient(${sens === "gauche" ? "270deg" : "90deg"}, var(--cta), transparent)`, opacity: 0.7 }}
    />
  );
  return (
    <span className={cn("flex w-full items-center", taille === "lg" ? "gap-4" : "gap-3", className)}>
      {filet("gauche")}
      <span
        className={cn("whitespace-nowrap font-semibold leading-none text-cta", taille === "lg" ? "text-sm" : "text-xs")}
        style={{ letterSpacing: "0.2em", fontVariationSettings: '"wdth" 112', paddingLeft: "0.2em" }}
      >
        ESPACE PRO
      </span>
      {filet("droite")}
    </span>
  );
}
