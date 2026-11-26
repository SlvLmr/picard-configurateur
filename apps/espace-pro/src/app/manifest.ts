import type { MetadataRoute } from "next";

/** Application installable (PWA) : icône sur l'écran d'accueil et ouverture en plein écran. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Espace Pro Picard Serrures",
    short_name: "Espace Pro",
    description: "La plateforme des équipes et du réseau Picard Serrures.",
    lang: "fr",
    start_url: "/accueil",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b2545",
    theme_color: "#0b2545",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mes leads", url: "/leads", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Déclarer un SAV", url: "/sav/nouvelle", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Médiathèque", url: "/mediatheque", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
