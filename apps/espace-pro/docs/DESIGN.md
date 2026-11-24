# Espace Pro : design system

La page `/design-system` de l'application fait référence. Ce document résume les règles.

## Intention
Un outil de travail pour des gens de métier. Sobre, dense, précis.
L'identité vient du sujet (plans techniques, laiton des cylindres), pas d'effets décoratifs.

## Couleurs
- **Crème** pour les fonds, **camaïeu de bleus** pour la structure, le texte et les données.
- **Laiton** (`--cta`) réservé à l'action principale. Une seule par zone.
- États : succès (vert), à surveiller (ambre), bloquant (rouge).
- Tokens sémantiques uniquement dans les composants (`globals.css`). Déclinés pour Picard, Eliot, clair et sombre.
- Les teintes seront recalées sur les chartes officielles.

## Typographie
Archivo, une seule famille.
| Rôle | Taille / interligne | Graisse |
|---|---|---|
| Chiffre héros | 48/52 | 700 |
| Titre de page | 36/40 (24/28 sur mobile) | 600, largeur 112 |
| Valeur d'indicateur | 24/28 | 700, chiffres à chasse fixe |
| Titre de section | 18/24 | 600 |
| Titre de panneau, élément principal | 16/24 | 600 |
| Texte courant | 14/20 | 400 |
| Interface (boutons, libellés) | 14/20 | 500 |
| Métadonnée | 12/16 | 400 |

Interdits : libellés en capitales, un mot isolé mis en couleur dans un titre, séparateurs « · » dans les métadonnées, flèches dans les boutons.

## Espacements et rayons
Grille de 4 px : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Les échelles Tailwind par défaut sont désactivées.
Rayons : 4 (étiquettes), 8 (boutons, champs), 12 (panneaux).

## Composants
`Button`, `Badge` / `NiveauBadge`, `Panel`, `PageHeader`, `StatBand`, `Field` / `Input` / `Select`, `Segmented`, `Cote`, `Avatar`, `EmptyState`, `Toast`.

## La cote
Élément signature : une ligne de cote (deux butées, une mesure, une valeur).
Uniquement pour une mesure entre deux bornes : objectif, délai, palier.

## Règles de mise en page
- Une seule bande d'indicateurs par page, en tête.
- Un panneau encadre des données qu'on manipule, jamais un simple texte.
- Le libellé d'un bouton dit ce qui se passe ; la confirmation reprend le même verbe (« Attribuer » → « Lead attribué »).
