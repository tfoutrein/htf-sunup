# ADR-003: Système de Validation de Campagne FBO par les Managers

- **Statut**: Proposé
- **Date**: 2025-01-27
- **Décideurs**: Équipe de développement HTF Sunup

## Contexte et énoncé du problème

Les managers ont besoin d'un système pour valider les campagnes de leurs FBO (Field Business Officers) en se basant sur des critères externes aux défis de l'été. Actuellement, les FBO accumulent des gains automatiquement en complétant des défis et des bonus, mais il n'existe pas de mécanisme permettant aux managers de valider ou invalider l'attribution finale des récompenses en fonction d'autres paramètres business.

Le besoin principal est d'ajouter une interface dans le dashboard manager permettant de :

1. Visualiser le bilan de réalisation de chaque FBO (gains totaux, complétude des défis)
2. Valider ou invalider l'attribution des gains par une case à cocher
3. Conserver cette validation en base de données

## Facteurs de décision

- **Simplicité d'implémentation** : Solution facile à intégrer dans l'architecture existante
- **Expérience utilisateur** : Interface intuitive pour les managers
- **Performance** : Impact minimal sur les requêtes existantes
- **Maintenabilité** : Code facile à maintenir et étendre
- **Sécurité** : Contrôle d'accès approprié (seuls les managers peuvent valider)
- **Traçabilité** : Historique des validations pour audit

## Options considérées

### Option 1: Nouvelle table `campaign_validations`

- **Description**: Créer une table dédiée pour stocker les validations de campagne avec relation user/campaign
- **Avantages**:
  - Séparation claire des responsabilités
  - Facilite l'historique et l'audit
  - Permet d'ajouter des métadonnées (date, commentaire, etc.)
  - Scalable pour plusieurs campagnes
- **Inconvénients**:
  - Nouvelle table à maintenir
  - Requêtes JOIN supplémentaires

### Option 2: Champ `validated` dans la table `users`

- **Description**: Ajouter un champ booléen directement dans la table users
- **Avantages**:
  - Simplicité maximale
  - Pas de JOIN nécessaire
  - Performance optimale
- **Inconvénients**:
  - Pas de relation avec une campagne spécifique
  - Pas d'historique
  - Pas de traçabilité (qui a validé, quand)
  - Ne permet qu'une validation globale par utilisateur

### Option 3: Extension de la table `user_actions` avec validation

- **Description**: Ajouter des champs de validation dans la table user_actions existante
- **Avantages**:
  - Utilise la structure existante
  - Validation granulaire par action
- **Inconvénients**:
  - Complexité accrue (validation par action vs par campagne)
  - Ne correspond pas au besoin (validation globale de campagne)
  - Modification d'une table critique

## Décision

**Solution choisie**: Option 1 - Nouvelle table `campaign_validations`

**Justification**:
Cette option offre le meilleur équilibre entre simplicité d'implémentation et flexibilité future. Elle permet une validation spécifique par campagne avec traçabilité complète, ce qui correspond exactement au besoin exprimé. La structure permet également d'ajouter facilement des fonctionnalités futures comme les commentaires de validation ou l'historique des modifications.

## Conséquences attendues

### Positives:

- Interface claire pour les managers dans le dashboard existant
- Traçabilité complète des validations de campagne
- Possibilité d'étendre facilement avec des métadonnées
- Séparation claire entre les données de performance et les validations business
- Compatibilité avec le système de rôles existant

### Négatives (ou risques):

- Légère complexité supplémentaire dans les requêtes de dashboard
- Nouvelle table à maintenir et sauvegarder
- Besoin de migration de données si des validations existantes doivent être migrées

## Prochaines étapes pour l'implémentation

1. **Base de données**:

   - Créer la table `campaign_validations` avec les champs : id, userId, campaignId, isValidated, validatedBy, validatedAt, comment
   - Générer et appliquer la migration Drizzle

2. **Backend**:

   - Créer le service `CampaignValidationService`
   - Ajouter les endpoints API : GET /campaign-validations, PUT /campaign-validations/:userId/:campaignId
   - Ajouter les DTOs et la validation des permissions (managers peuvent valider tous les FBO dans leur hiérarchie)

3. **Frontend**:

   - Créer le composant `CampaignValidationSection` dans le dashboard manager
   - Intégrer l'affichage des gains totaux et complétude des défis
   - Ajouter l'interface de validation avec case à cocher
   - Implémenter les appels API et la gestion d'état

4. **Tests**:
   - Tests unitaires pour le service backend
   - Tests d'intégration pour les endpoints
   - Tests E2E pour l'interface manager

## Liens

- Dashboard Manager existant : `apps/frontend/src/app/manager/dashboard/page.tsx`
- Schéma de base de données : `apps/backend/src/db/schema.ts`
- Service de campagnes : `apps/backend/src/campaigns/`

---

_Cet ADR définit l'architecture pour le système de validation de campagne FBO dans HTF Sunup._
