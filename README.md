# Picard Serrures — Configurateur de portes

Configurateur premium des portes blindées Picard Serrures.
Application 100 % statique avec admin Decap CMS, hébergée sur **Netlify**.

## Stack

- **Vite + React 18** (JavaScript)
- **Tailwind CSS** (design tokens dans `tailwind.config.js`)
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes
- **html2canvas + jsPDF** pour l'export PDF
- **Decap CMS** pour l'administration du catalogue
- **Netlify Identity + Git Gateway** pour l'auth de l'admin
- **Netlify Forms** pour les demandes de devis
- **localStorage** pour la sauvegarde par code (V1)

Pas de backend custom. Toutes les données du catalogue vivent dans `src/data/*.json`,
éditées via l'interface Decap qui commit automatiquement dans le repo.

## Lancer en local

Pré-requis : Node.js 20+.

```bash
npm install
npm run dev
```

Sur http://localhost:5173.

## Déploiement & admin — setup Netlify (à faire une seule fois)

### 1. Créer le site Netlify

1. Va sur https://app.netlify.com/start, connecte-toi avec ton compte GitHub
2. **Add new site → Import an existing project → GitHub → SlvLmr/picard-configurateur**
3. Branch : `main` — Build command : `npm run build` — Publish directory : `dist`
4. **Deploy site**

Le site apparaît sur une URL `random-name.netlify.app`. Renomme-la dans
**Site settings → Change site name → `picard-configurateur`** pour avoir
`picard-configurateur.netlify.app`.

### 2. Activer Identity (login admin)

1. Sur le dashboard du site, onglet **Identity → Enable Identity**
2. Dans **Identity → Settings and usage → Registration preferences**, choisis
   **Invite only** (sinon n'importe qui peut s'inscrire)
3. Toujours dans Identity → **Services → Git Gateway → Enable Git Gateway**
4. Onglet **Identity → Invite users** : invite ton email (`sylvain@…`).
   Tu reçois un email d'invitation, clique le lien, choisis un mot de passe.

### 3. Premier accès à l'admin

Une fois invité, va sur https://picard-configurateur.netlify.app/admin/ et
connecte-toi avec ton email + mot de passe choisi.

Tu peux maintenant éditer décors, portes, couleurs, poignées, vitrages,
accessoires, finitions et hotspots. Chaque sauvegarde commit automatiquement
dans le repo, ce qui déclenche un nouveau déploiement (~1 min).

### 4. Recevoir les demandes de devis

Netlify Forms est déjà branché (formulaire `devis` détecté à l'index.html).
Onglet **Forms** dans Netlify → tu vois toutes les demandes reçues.

Configure les notifications par email : **Forms → Form notifications →
Add notification → Email notification → form: devis → ton email**.

> Limite gratuite : 100 soumissions/mois et 10 Mo de pièces jointes. Largement
> suffisant en V1.

## Modifier le catalogue (sans dev)

### Via l'admin Decap (recommandé)

https://picard-configurateur.netlify.app/admin/ — édition visuelle, drag & drop
d'images, validation. Chaque sauvegarde = un commit automatique.

### Directement dans GitHub

Tu peux aussi ouvrir `src/data/*.json` sur GitHub et utiliser le crayon. Même
résultat (commit + redéploiement), mais sans validation d'erreurs.

| Fichier | Contenu |
|---|---|
| `src/data/decors.json` | Galerie d'inspiration (12 décors V1) |
| `src/data/doors.json` | Modèles de portes (Appartement, Maison, Maison vitrée) |
| `src/data/colors.json` | Nuancier RAL |
| `src/data/handles.json` | Poignées |
| `src/data/glasses.json` | Configurations de vitrage |
| `src/data/accessories.json` | Heurtoir, numéro, judas, plaque |
| `src/data/finishes.json` | Mate / Satinée / Brillante |
| `src/data/hotspots.json` | Hotspots techniques + descriptions |

### Règles de compatibilité

Les décors, poignées, vitrages et accessoires ont un champ
`compatibleDoorIds` qui filtre l'affichage selon le modèle de porte choisi
par le visiteur :

- **Tableau vide `[]`** → l'élément est **compatible avec toutes** les portes
- **Tableau avec des IDs `[1, 3]`** → uniquement compatible avec les portes
  qui ont ces IDs

Exemple : pour qu'un heurtoir soit réservé aux portes de maison (ID 2) et
aux portes de maison vitrée (ID 3), édite `src/data/accessories.json` et mets
`"compatibleDoorIds": [2, 3]` sur l'accessoire concerné.

L'admin Decap fournit un widget liste pour gérer ça facilement.

## Sauvegarde par code (côté visiteur)

Quand un visiteur clique « Sauvegarder », un code à 6 caractères est généré
(alphabet sans O/0/I/1/L) et stocké dans `localStorage` avec son email et une
expiration à 30 jours.

> ⚠️ Limitation honnête V1 : la sauvegarde fonctionne **uniquement sur le
> navigateur d'origine**. Migration possible vers une vraie base (Supabase /
> Firestore) en V2.

## Architecture

```
src/
├── App.jsx                   # Routage entre les 2 étapes
├── main.jsx                  # Bootstrap React
├── index.css                 # Tailwind + tokens
├── data/
│   ├── *.json                # Catalogue (édité par Decap)
│   └── index.js              # Barrel d'export + helpers de filtrage
├── hooks/
│   ├── useConfiguratorState.js
│   └── useResponsive.js
├── utils/
│   ├── codeGenerator.js
│   ├── localStorage.js
│   ├── pdfGenerator.js
│   └── assets.js             # Résolution URLs images décors
└── components/
    ├── Intro.jsx             # Accueil + 3 modèles
    ├── ProgressBar.jsx
    ├── PhotoUploader.jsx
    ├── DoorCanvas.jsx        # Rendu de la porte sur le décor
    ├── HotspotSystem.jsx
    ├── GuidedTour.jsx
    ├── PersonalizationPanel.jsx
    ├── Summary.jsx
    ├── SaveModal.jsx
    ├── RestoreModal.jsx
    ├── QuoteForm.jsx         # Netlify Forms + mailto fallback
    └── ShareMenu.jsx

public/
├── admin/                    # Decap CMS (login Netlify Identity)
│   ├── index.html
│   └── config.yml
├── decors/                   # Images de décors uploadées via Decap
└── LOGO-PICARD-SERRURES-MIDNIGHT.png
```

## Roadmap V2 (à plus tard)

- Vraies images Nano Banana pour les décors et les portes (uploadables via Decap)
- Drag & drop fin de la porte sur la photo perso (react-konva)
- Sauvegarde côté serveur (Supabase / Firestore) pour récupération cross-device
- Inbox des demandes de devis directement dans /admin (au-delà de Netlify Forms)
- Dashboard analytics (taux de configuration, modèle le plus choisi, etc.)
