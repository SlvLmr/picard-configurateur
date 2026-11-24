# Picard Serrures — Configurateur de portes

Configurateur premium des portes blindées Picard Serrures.

Sous-domaine cible : `maporte.picard-serrures.com`

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zustand (state)
- Framer Motion (animations)
- Lucide React (icônes)

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
  app/
    page.tsx              # Landing
    configurateur/        # Configurateur
  components/
    landing/              # Hero, Header, Showcase, Footer
    configurator/         # DoorPreview, ConfiguratorPanel, ViewToggle
    ui/                   # Primitives (Button, SectionLabel)
  lib/
    catalog.ts            # Données mock : modèles, couleurs, décors, options
    store.ts              # Store Zustand (config + view)
    utils.ts              # Helpers (cn, formatPrice)
```

## Étapes suivantes

- [ ] Intégrer les images Nano Banana (40 décors + portes)
- [ ] Upload photo perso + drag & drop (react-konva)
- [ ] Hotspots de visite guidée
- [ ] Sauvegarde par code court (Supabase)
- [ ] Génération PDF (@react-pdf/renderer)
- [ ] Formulaire devis + envoi Brevo
- [ ] Dashboard admin
