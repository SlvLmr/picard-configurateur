# Picard Serrures & Eliot : plateforme

Monorepo (npm workspaces) qui regroupe les applications web Picard.

| Application | Dossier | Public | Port local |
|---|---|---|---|
| **Espace Pro** | `apps/espace-pro` | Équipes Picard et réseau de professionnels | 3001 |
| **Ma Porte** | `apps/ma-porte` | Particuliers (simulateur de porte) | 3000 |

## Démarrer

```bash
npm install
npm run dev            # Espace Pro sur http://localhost:3001
npm run dev:ma-porte   # Ma Porte sur http://localhost:3000
```

## Documentation

- `apps/espace-pro/docs/ARCHITECTURE.md` : modules, rôles, structure du code, feuille de route
- `apps/espace-pro/docs/DESIGN.md` : design system (tokens, typographie, règles)
- `maquettes/` : maquette exploratoire et présentation du concept
