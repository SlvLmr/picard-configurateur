"use client";

import { useEffect } from "react";

/** Enregistre le service worker de l'application installable (en production uniquement). */
export function EnregistrementSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sans service worker, le site fonctionne normalement */
    });
    // Recharge automatique au retour du réseau sur la page hors connexion
    const enLigne = () => {
      if (window.location.pathname === "/hors-ligne") window.location.assign("/accueil");
    };
    window.addEventListener("online", enLigne);
    return () => window.removeEventListener("online", enLigne);
  }, []);
  return null;
}
