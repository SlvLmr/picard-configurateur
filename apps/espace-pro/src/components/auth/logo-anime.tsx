import Image from "next/image";

/** Logo Picard Serrures et signature Espace Pro, avec une entrée animée puis un reflet qui court sur les filets. */
export function LogoAnime() {
  return (
    <div className="logo-anime flex w-80 flex-col items-center gap-4">
      <div className="logo-revele relative">
        <Image src="/logos/picard-serrures.svg" alt="Picard Serrures" width={190} height={60} priority className="h-12 w-auto" />
        <span aria-hidden className="logo-reflet" />
      </div>
      <span className="flex w-full items-center gap-4">
        <span aria-hidden className="filet filet-gauche h-px flex-1" />
        <span className="signature-lettres whitespace-nowrap text-sm font-semibold leading-none text-cta" style={{ fontVariationSettings: '"wdth" 112' }}>
          ESPACE PRO
        </span>
        <span aria-hidden className="filet filet-droite h-px flex-1" />
      </span>
    </div>
  );
}
