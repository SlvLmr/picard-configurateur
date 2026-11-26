/*
 * Service worker de l'Espace Pro (application installable).
 * Volontairement prudent : les pages et données restent servies en direct (droits et fraîcheur),
 * seuls les fichiers statiques sont mis en cache. Sans réseau, une page « hors connexion » s'affiche.
 */
const CACHE = "espace-pro-v1";
const STATIQUES = ["/hors-ligne", "/icons/icon-192.png", "/icons/icon-512.png", "/logos/picard-serrures.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIQUES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Fichiers statiques versionnés de Next.js, icônes et logos : cache d'abord
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/logos/") || url.pathname.startsWith("/motifs/")) {
    e.respondWith(
      caches.match(req).then(
        (r) =>
          r ||
          fetch(req).then((rep) => {
            const copie = rep.clone();
            caches.open(CACHE).then((c) => c.put(req, copie));
            return rep;
          }),
      ),
    );
    return;
  }

  // Pages : toujours le réseau ; sans connexion, la page dédiée
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/hors-ligne")));
  }
});
