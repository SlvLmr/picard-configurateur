# Espace Pro : feuille de route

Méthode : une rubrique à la fois. Fiche d'une page (fonctions, vue par rôle), validation, construction, mise en ligne, test.

## Fait
- **Leads** (installateurs et ATC) et **Lead Management** (outil interne, sous CRM) : validation, qualification, attribution, carte, envois e-mail et SMS, enquêtes NPS, statistiques, facturation paramétrable.
- **Accueil** : priorités, canal de messages (photos, visionneuse), agenda en frise (à partir de 2027). Les pages Messages et Calendrier sont fusionnées dans l'accueil.
- **Animations** : offres, remboursements et parrainages ; offres en cours, permanentes et archivées.
- **Médiathèque** : gammes, produits et téléchargements.
- **Titres modifiables** par l'administrateur.

## À faire, demandé par Sylvain
- **Aperçu « voir en tant que »** : l'administrateur choisit un profil (administrateur, chef de marché, IAP, ATC, Lead Manager, responsable SAV) et voit exactement ses écrans, en lecture seule.
- **Zoning ATC** : reprendre le découpage des secteurs du « Dashboard ATC » (liste des départements par secteur à fournir).
- **Newsletters** : contours à définir ensemble (à rappeler à Sylvain).
- **Pilotage du marketing digital** : Google Ads, fréquentation du site, SEO et GEO, dans un tableau de pilotage. À construire ensemble.
- **Questionnaires** : créer, diffuser et exploiter des questionnaires (réutilise le moteur des enquêtes NPS).
- **Leads, reste à définir** : rapprochement lead et commande Navision (code lead sur la commande, export mensuel à obtenir auprès de la DSI).

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
