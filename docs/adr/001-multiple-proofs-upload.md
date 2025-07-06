# ADR-001: Système de preuves multiples pour actions et bonus

- **Statut**: Accepté
- **Date**: 2025-01-02
- **Décideurs**: tfoutrein

## Contexte et énoncé du problème

Actuellement, le système HTF Sunup permet aux FBO d'uploader **UNE seule preuve** par action et par bonus quotidien. Cette preuve est stockée dans un champ `proofUrl` (string) dans les tables `userActions` et `dailyBonus`.

**Besoin utilisateur** : Les FBO souhaitent pouvoir uploader **jusqu'à 5 preuves** par action et par bonus pour mieux documenter leurs réalisations et fournir des justificatifs plus complets.

**Question principale** : Comment faire évoluer l'architecture actuelle pour supporter plusieurs preuves tout en maintenant la compatibilité et les performances ?

## Facteurs de décision

- **Compatibilité** : Maintenir le fonctionnement des preuves existantes
- **Limite fonctionnelle** : Maximum 5 preuves par action/bonus
- **Performance** : Éviter la dégradation lors du chargement des preuves
- **Maintenabilité** : Solution simple à comprendre et faire évoluer
- **Expérience utilisateur** : Interface intuitive pour gérer plusieurs preuves
- **Stockage** : Optimisation des coûts S3 et organisation des fichiers
- **Migrations** : Facilité de migration des données existantes

## Options considérées

### Option 1: Extension du champ actuel (proofUrl → proofUrls[])

- **Description**: Remplacer le champ `proofUrl` (string) par `proofUrls` (array/JSON) dans les tables existantes
- **Avantages**:
  - Modification minimale du schéma existant
  - Logique centralisée dans les tables actuelles
  - Migration simple des données existantes
- **Inconvénients**:
  - Requêtes JSON moins performantes que les relations SQL
  - Limite de taille des champs JSON
  - Moins flexible pour ajouter des métadonnées aux preuves

### Option 2: Table de preuves dédiée avec relations

- **Description**: Créer une nouvelle table `proofs` avec relations many-to-one vers `userActions` et `dailyBonus`
- **Avantages**:
  - Architecture relationnelle propre et performante
  - Possibilité d'ajouter des métadonnées (taille, type, date upload)
  - Requêtes SQL optimisées avec jointures
  - Facilité d'extension future (commentaires, validation)
- **Inconvénients**:
  - Modification plus importante de l'architecture
  - Jointures supplémentaires dans les requêtes
  - Migration plus complexe

### Option 3: Champ JSON dédié en plus du champ actuel

- **Description**: Garder `proofUrl` pour rétrocompatibilité, ajouter `additionalProofs` (JSON) pour les preuves supplémentaires
- **Avantages**:
  - Rétrocompatibilité totale
  - Migration sans impact
  - Transition progressive possible
- **Inconvénients**:
  - Duplication de logique (gestion 2 champs)
  - Interface utilisateur plus complexe
  - Code backend plus verbeux

## Décision

**Solution choisie**: Option 2 - Table de preuves dédiée avec relations

**Justification**:
Cette option offre la meilleure architecture à long terme pour les raisons suivantes :

1. **Performance** : Les requêtes SQL avec jointures sont plus performantes que les requêtes JSON
2. **Extensibilité** : Facilite l'ajout futur de fonctionnalités (validation des preuves, commentaires, métadonnées)
3. **Maintenabilité** : Architecture relationnelle claire et standard
4. **Flexibilité** : Peut supporter plus de 5 preuves si besoin futur
5. **Compatibilité** : Migration automatique des preuves existantes vers la nouvelle table

## Conséquences attendues

### Positives:

- Interface utilisateur plus riche pour gérer plusieurs preuves
- Possibilité d'ajouter des métadonnées utiles (type de fichier, taille, timestamps)
- Architecture scalable pour de futures évolutions
- Meilleure organisation du stockage S3 avec structure hiérarchique
- Performance optimisée pour l'affichage des preuves

### Négatives (ou risques):

- Migration nécessaire pour les données existantes (environ 50-100 preuves actuelles)
- Modification de plusieurs composants frontend pour gérer les arrays
- Modification des APIs backend pour les nouvelles relations
- Tests supplémentaires requis pour la nouvelle architecture

## Prochaines étapes pour l'implémentation

1. **Phase 1 - Backend**

   - Créer la nouvelle table `proofs` avec le schéma Drizzle
   - Implémenter la migration des données existantes
   - Modifier les services pour gérer les relations multiples
   - Adapter les endpoints d'upload pour supporter plusieurs fichiers

2. **Phase 2 - Frontend**

   - Créer un composant `MultiProofUpload` pour gérer jusqu'à 5 preuves
   - Adapter les modales d'actions et bonus pour le nouveau composant
   - Modifier l'affichage des preuves existantes (gallery/carousel)
   - Mettre à jour les hooks TanStack Query pour les nouvelles structures

3. **Phase 3 - Tests et Déploiement**
   - Tests unitaires et e2e pour la nouvelle fonctionnalité
   - Tests de migration sur un jeu de données de développement
   - Déploiement avec rollback plan si nécessaire

## Liens

- [Schéma actuel de la base de données](../backend/src/db/schema.ts)
- [Service de stockage actuel](../backend/src/storage/storage.service.ts)
- [Composants de preuves actuels](../frontend/src/components/ui/)
- [Documentation API upload preuves](./API_DOCUMENTATION.md#upload-de-preuves-dactions)

---

_ADR-001 pour le projet HTF Sunup - Système de preuves multiples_
