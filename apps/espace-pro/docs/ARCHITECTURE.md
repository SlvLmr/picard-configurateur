# Espace Pro : architecture

## Principe
Un socle commun et des modules activés selon le rôle de l'utilisateur.
Un utilisateur a **un rôle** (ce qu'il peut faire) et **un périmètre** (sur quelles données).
Le niveau IAP (Elite, Premium, Officiel) est un attribut du compte client, pas un rôle.

## Modules
| Module | Route | Phase | État |
|---|---|---|---|
| Accueil | `/accueil` | 1 | Maquette fonctionnelle (4 profils) |
| Leads | `/leads` | 1 | Maquette fonctionnelle (répartiteur, client, commercial) |
| Médiathèque | `/mediatheque` | 1 | À construire |
| CRM | `/crm` | 2 | À construire |
| Pilotage | `/pilotage` | 2 | À construire |
| Configurateur | `/configurateur` | 2 (en parallèle) | À construire |
| Boutique et points | `/boutique` | 3 | À construire |
| Marketing | `/marketing` | 4 | À construire |

Accès par rôle : `src/lib/roles.ts` (`ROLE_MODULES`).

## Structure du code
```
src/
  app/
    (app)/            routes authentifiées, une par module, dans l'AppShell
    layout.tsx        police, thème, session
  components/
    ui/               design system : composants génériques, sans logique métier
    shell/            navigation, barre du haut, recherche globale
    leads/            composants propres au module Leads
  lib/
    roles.ts          rôles, modules, personas de démonstration
    session.tsx       session de démo (persona, marque, thème)
    mock/             données fictives, à remplacer par la base de données
```

Règle : un composant de `ui/` ne connaît aucun concept métier. Les composants métier vivent dans un dossier par module.

## Prochaines étapes techniques
1. Base de données et authentification (Supabase : PostgreSQL avec sécurité par ligne pour les périmètres, connexion Microsoft pour les internes, lien magique pour les clients).
2. Remplacer `lib/mock` par une couche d'accès aux données typée.
3. Moteur d'attribution des leads (zone, niveau IAP, capacité) côté serveur.
4. Import des comptes clients et des commerciaux depuis Navision (fichiers en attendant l'accord de la DSI).

## Démonstration
En attendant l'authentification, le sélecteur en haut de page permet de voir l'outil en tant que :
répartitrice (Claire), commercial (Julien), directeur commercial (Philippe), client IAP Elite (Marc).
