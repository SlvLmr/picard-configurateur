# Module SAV : cadrage (version de travail, à valider ensemble)

## Décisions prises
- **Le SAV est entièrement géré dans l'Espace Pro.** Il remplace Qualios pour le SAV ; Qualios garde le reste de la qualité.
- **Qui ouvre une demande :** clients professionnels (IAP, serruriers, fenêtriers), commerciaux pour leurs clients, service SAV ou ADV en interne (demande reçue par téléphone ou e-mail).
- **Qui traite :** un service SAV dédié, le bureau d'études ou la technique (expertise, assistance), la qualité (non-conformités, actions correctives).
- **Types de demandes :** réclamation produit ou garantie, pièces détachées, assistance technique, livraison ou litige de commande.
- **Garantie :** vérifiée à partir du numéro de commande d'origine (pas d'enregistrement des poses).
- **Délais :** aucun engagement affiché au client ; seul le statut est visible.
- **Indispensable dans un dossier :** photos et vidéos, numéro de série ou de commande d'origine, statut visible, retour produit et avoir.

## Proposition de fonctionnement

### Rôles à ajouter
| Rôle | Peut |
|---|---|
| SAV | Voir et traiter toutes les demandes, affecter, décider, clôturer |
| Bureau d'études | Voir les demandes qui lui sont affectées, donner un avis technique |
| Qualité | Voir toutes les demandes, qualifier une non-conformité, suivre les actions correctives |

### Cycle de vie d'une demande
1. **Nouvelle** : déposée par le client, le commercial ou le SAV.
2. **En analyse** : prise en charge par le SAV.
3. **Informations demandées** : le SAV attend une photo, un numéro, une précision du client.
4. **Avis technique** : transmise au bureau d'études (optionnel).
5. **Décision** : garantie acceptée, refusée, ou geste commercial.
6. **En cours de résolution** : pièce expédiée, retour produit attendu, remplacement, avoir.
7. **Résolue**, puis **clôturée** (automatiquement après un délai sans réponse du client).

### Dossier SAV
- Type de demande, produit concerné (gamme, référence), numéro de commande d'origine, numéro de série si connu
- Description, photos et vidéos (prises depuis le téléphone, sur le chantier)
- Adresse du chantier, client final (facultatif)
- Fil d'échanges entre le client et le SAV, avec pièces jointes
- Décision, motif, résolution : pièce envoyée, retour produit (bon de retour), remplacement, avoir (montant, référence)
- Pour la qualité : non-conformité oui ou non, cause, action corrective

### Écrans
- **Client :** « Déclarer un problème » en quelques étapes ; liste de ses demandes avec statut ; fil d'échanges.
- **Commercial :** demandes de son portefeuille ; déclarer pour un client ; un SAV ouvert est un sujet de visite.
- **SAV :** file de traitement (filtres par type, statut, ancienneté), affectation, décision, résolution.
- **Qualité :** tableau des non-conformités par produit ou cause, actions correctives, tendance.
- **Pilotage :** volume par type, délai moyen de résolution interne, taux de prise sous garantie, produits les plus concernés.

## Questions encore ouvertes
1. Faut-il **reprendre l'historique** des dossiers SAV de Qualios ? Si oui, sous quelle forme peut-on l'exporter ?
2. Les **avoirs** sont-ils émis dans Navision ? L'Espace Pro doit-il seulement les tracer, ou les déclencher ?
3. Les **pièces détachées** : catalogue à part, ou commande via la Boutique ou l'ADV ?
4. Le **client final** (particulier) doit-il recevoir des nouvelles, ou tout passe par l'installateur ?
5. Notifications : par e-mail à chaque changement de statut, ou uniquement dans l'Espace Pro ?
