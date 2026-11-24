# Espace Pro : architecture

## Principe
Un socle commun et des modules activés selon le rôle de l'utilisateur.
Un utilisateur a **un rôle** (ce qu'il peut faire) et **un périmètre** (sur quelles données).
Le niveau IAP (Elite, Premium, Officiel) est un attribut du compte client, pas un rôle.

## Modules
| Module | Route | Phase | État |
|---|---|---|---|
| Accueil | `/accueil` | 1 | Maquette fonctionnelle (4 profils) |
| Leads | `/leads` | 1 | Branché sur la base pour les internes ; démonstration pour les autres profils |
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

## Base de données (Supabase)
Projet **Commerce**, partagé avec l'outil Commerce existant. Toutes les tables Espace Pro sont préfixées `ep_` ; aucune table existante n'est modifiée.

| Table | Rôle |
|---|---|
| `ep_comptes` | Entreprises clientes. Les 152 IAP sont importés depuis `boost_iap`, reliés à `commerciaux` |
| `ep_profils` | Rôle et périmètre de chaque utilisateur (lié à `auth.users`) |
| `ep_leads` | Leads et leur cycle de vie (`demo = true` pour les données de démonstration) |
| `ep_lead_evenements` | Historique complet de chaque lead : source des taux et délais |
| `ep_points` | Mouvements de points de fidélité |

- **Lecture** : règles par ligne (RLS) selon le rôle. Interne : tout ; commercial : son portefeuille ; client : ses leads.
- **Écriture** : uniquement par fonctions qui contrôlent le rôle : `ep_attribuer_lead`, `ep_accepter_lead`, `ep_refuser_lead`, `ep_changer_statut_lead`.
- **Attribution** : à l'insertion, `ep_suggerer` choisit un compte du département (Elite, puis Premium, puis Officiel, puis le moins sollicité sur 30 jours), sinon le commercial du secteur.
- **Indicateurs** : `ep_stats_leads(jours)`, calculé avec les droits de l'appelant.
- **Migrations versionnées** : `supabase/migrations/` à la racine du dépôt.
- Supprimer les données de démonstration : `delete from ep_leads where demo;`

## Connexion
Page `/connexion` : mot de passe ou lien par e-mail. Sans connexion, l'application reste en mode démonstration (données fictives).
L'adresse de retour du lien (`/auth/callback`) doit être autorisée dans Supabase (Authentication, URL Configuration).
Les inscriptions du projet Commerce sont réservées à une liste d'adresses (déclencheur `inscriptions_reservees`) : à adapter pour ouvrir l'Espace Pro aux autres utilisateurs.

## Prochaines étapes techniques
1. Ouvrir la connexion aux utilisateurs Espace Pro (invitation par l'administrateur).
2. Brancher l'accueil client et le module Leads côté installateur sur la base.
3. Formulaire de Ma Porte et du site → insertion directe dans `ep_leads`.
4. Import des comptes non IAP (serruriers, fenêtriers) depuis Navision ou fichier.

## Démonstration
En attendant l'authentification, le sélecteur en haut de page permet de voir l'outil en tant que :
répartitrice (Claire), commercial (Julien), directeur commercial (Philippe), client IAP Elite (Marc).
