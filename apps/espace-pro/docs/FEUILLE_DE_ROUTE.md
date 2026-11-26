# Espace Pro : feuille de route

Méthode : une rubrique à la fois. Fiche d'une page (fonctions, vue par rôle), validation, construction, mise en ligne, test.

## Fait
- **Leads** (installateurs et ATC) et **Lead Management** (outil interne, sous CRM) : validation, qualification, attribution, carte, envois e-mail et SMS, enquêtes NPS, statistiques, facturation paramétrable.
- **Accueil** : priorités, canal de messages (photos, visionneuse), agenda en frise (à partir de 2027). Les pages Messages et Calendrier sont fusionnées dans l'accueil.
- **Animations** : offres, remboursements et parrainages ; offres en cours, permanentes et archivées.
- **Médiathèque** : gammes, produits et téléchargements.
- **Titres modifiables** par l'administrateur.
- **Aperçu « voir en tant que »** (lecture seule), **Zoning** des secteurs (départements à saisir), **Newsletters**, **Pilotage digital** (saisie mensuelle), **Questionnaires**, **Commandes Navision** (import CSV et rapprochement).
- **Médiathèque** : aperçu des documents façon Coup d'œil.

## À compléter avec Sylvain
- **Zoning** : saisir les départements de chaque secteur (écran prêt dans Lead Management), puis brancher les suggestions d'attribution dessus.
- **Pilotage digital** : connecter Google Ads, Google Analytics et Search Console pour remplacer la saisie mensuelle.
- **Navision** : confirmer le format de l'export (intitulés des colonnes) et l'endroit où le code lead est saisi sur la commande.
- **Newsletters** : images hébergées (aujourd'hui par adresse web) et désinscription.

## Plus tard
- **Application mobile iPhone et Android** (React Native, Expo) pour le terrain : leads avec notifications push, SAV avec photos, messages et agenda, médiathèque hors connexion, tournées avec GPS. Règle déjà appliquée : toute la logique métier reste réutilisable (voir ARCHITECTURE.md). En attendant : l'application installable (PWA).

## Réglages en attente (côté Sylvain)
- Clé d'API Brevo dans Vercel (BREVO_API_KEY, BREVO_EXPEDITEUR_EMAIL) pour envoyer les e-mails et SMS.
- URL de redirection Supabase : https://espace-pro-picard.vercel.app/auth/confirmer (et le domaine psi).
- Remplacer les produits, animations et contenus de démonstration.

## Règles de droits
- Seul l'administrateur général paramètre (droits, paramètres, facturation des leads, textes). Le CODIR consulte.

## Rubriques suivantes (ordre proposé)
1. Configurateur, puis SAV
2. Local, Boutique
3. CRM, Pilotage commercial, Pilotage campagne
