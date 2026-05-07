# Picard Serrures — Configurateur de portes

Configurateur premium des portes blindées Picard Serrures.
Application 100 % statique, hébergée sur **GitHub Pages**.

> URL publique : https://slvlmr.github.io/picard-configurateur/

## Stack

- **Vite + React 18** (JavaScript)
- **Tailwind CSS** (design tokens dans `tailwind.config.js`)
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes
- **html2canvas + jsPDF** pour l'export PDF
- **localStorage** pour la sauvegarde par code

Aucun backend, aucune base de données. Tout vit dans le navigateur.

## Lancer en local

Pré-requis : Node.js 20+.

```bash
npm install
npm run dev
```

L'app est disponible sur http://localhost:5173.

Pour vérifier la version de production :

```bash
npm run build
npm run preview
```

## Déploiement

Chaque push sur `main` déclenche le workflow `.github/workflows/deploy.yml`,
qui build avec Vite et publie sur GitHub Pages.

Activation côté repo (à faire une seule fois) :

1. Settings → Pages
2. **Source : GitHub Actions**

Le premier déploiement met 2-3 minutes. Ensuite chaque push prend environ
une minute.

## Modifier le catalogue (sans dev)

Tout le catalogue tient dans `src/data/`. Édition directe possible
depuis l'interface web GitHub (bouton crayon sur chaque fichier) :

| Fichier | Contenu |
|---|---|
| `src/data/decors.js` | Galerie d'inspiration (12 décors V1) |
| `src/data/doors.js` | Modèles de portes (Diamant Luminance, Sérénité, Présence, Vauban) |
| `src/data/colors.js` | Nuancier RAL |
| `src/data/handles.js` | Poignées |
| `src/data/glasses.js` | Configurations de vitrage |
| `src/data/accessories.js` | Heurtoir, numéro, judas, plaque |
| `src/data/finishes.js` | Mate / Satinée / Brillante |
| `src/data/hotspots.js` | Hotspots techniques + descriptions |

### Ajouter un décor

Ouvrir `src/data/decors.js` et dupliquer un objet existant :

```js
{
  id: 13, // unique
  name: 'Hôtel particulier 16e',
  type: 'exterior',           // 'exterior' ou 'interior'
  category: 'house_villa',    // 'house_villa' ou 'apartment_building'
  style: 'Classique',
  gradient: 'from-stone-100 via-amber-50 to-stone-200',
  accent: 'rgba(184, 134, 11, 0.3)',
  imageUrl: null,             // ou URL d'une image plus tard
}
```

`gradient` accepte n'importe quelle classe Tailwind `from-* via-* to-*`.
`accent` est un rgba pour l'éclairage de la scène.

### Ajouter une porte

Ouvrir `src/data/doors.js` :

```js
{
  id: 5,
  slug: 'edition-2026',
  name: 'Édition 2026',
  range: 'Premium',
  security: 5,                // 1 à 5 étoiles A2P
  priceFrom: 6500,
  price: 'À partir de 6 500 €',
  desc: 'Description courte (1 ligne).',
  icon: '◇',
  panelStyle: 'horizontal_lines', // 'asymmetric_glass' | 'full_panel' | 'horizontal_lines' | 'fortress'
}
```

### Modifier une couleur

Dans `src/data/colors.js`, changez le `hex` (et éventuellement `name` / `ral`).
Garder `textOn` cohérent (clair sur fond foncé, foncé sur fond clair).

## Sauvegarde par code

Quand un visiteur clique « Sauvegarder », un code à 6 caractères est généré
(alphabet sans O/0/I/1/L) et stocké dans `localStorage` avec son email et une
expiration à 30 jours.

> ⚠️ Limitation honnête V1 : la sauvegarde fonctionne **uniquement sur le
> navigateur d'origine**. Migration possible vers une vraie base (Supabase /
> Firestore) en V2.

## Architecture

```
src/
├── App.jsx                   # Routage entre les 4 étapes
├── main.jsx                  # Bootstrap React
├── index.css                 # Tailwind + tokens
├── data/                     # Catalogue (à éditer pour ajouter)
├── hooks/
│   ├── useConfiguratorState.js
│   └── useResponsive.js
├── utils/
│   ├── codeGenerator.js
│   ├── localStorage.js
│   └── pdfGenerator.js
└── components/
    ├── Intro.jsx
    ├── ProgressBar.jsx
    ├── DecorGallery.jsx
    ├── PhotoUploader.jsx
    ├── DoorSelector.jsx
    ├── DoorCanvas.jsx
    ├── HotspotSystem.jsx
    ├── GuidedTour.jsx
    ├── PersonalizationPanel.jsx
    ├── Summary.jsx
    ├── SaveModal.jsx
    ├── RestoreModal.jsx
    ├── QuoteForm.jsx
    └── ShareMenu.jsx
```

## Roadmap V2 (à plus tard)

- Vraies images Nano Banana pour les 40 décors et les portes
- Drag & drop fin de la porte sur la photo perso (react-konva)
- Sauvegarde côté serveur (Supabase / Firestore)
- Envoi du devis via Brevo / Formspree
- Dashboard admin pour suivre les configurations
