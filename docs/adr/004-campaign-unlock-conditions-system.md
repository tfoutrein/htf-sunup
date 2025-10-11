# ADR-004: Système de Conditions de Déblocage Personnalisées pour les Cagnottes

- **Statut**: Accepté ✅
- **Date**: 2025-10-05
- **Décideurs**: Équipe de développement HTF Sunup
- **Date d'acceptation**: 2025-10-05

## Contexte et énoncé du problème

Actuellement, le système de validation de campagne permet aux managers de valider ou rejeter l'attribution des cagnottes de leurs FBO avec un simple commentaire. Cependant, il n'existe pas de mécanisme structuré pour définir et vérifier les conditions de déblocage des cagnottes.

Le besoin exprimé est d'ajouter un système permettant de :

1. **Lors de la création de campagne** : Permettre au manager de définir une liste de conditions de déblocage personnalisées (ex: "Présence à toutes les formations", "Taux de conversion > 10%", "3 parrainages minimum")
2. **Lors de la validation de cagnotte** : Afficher ces conditions au manager qui doit cocher chaque condition remplie par le FBO
3. **Règle de validation stricte** : La cagnotte ne peut être validée que si TOUTES les conditions sont cochées/remplies

Ce système ajoute une couche de contrôle qualité et garantit que les objectifs définis en amont sont bien respectés avant le paiement des cagnottes.

## Facteurs de décision

- **Flexibilité** : Les conditions doivent être personnalisables par campagne
- **Simplicité d'utilisation** : Interface intuitive pour créer et valider les conditions
- **Traçabilité** : Historique de quelles conditions ont été validées et par qui
- **Intégrité des données** : Impossible de valider une cagnotte sans toutes les conditions
- **Scalabilité** : Nombre variable de conditions par campagne (recommandé : 1-10)
- **Performance** : Impact minimal sur les requêtes existantes
- **Maintenabilité** : Architecture extensible pour évolutions futures

## Options considérées

### Option 1: Conditions Prédéfinies (Non retenue)

- **Description**: Liste fixe de types de conditions standardisées
- **Avantages**:
  - Cohérence entre campagnes
  - Interface simplifiée avec sélection multiple
  - Facilite les statistiques globales
- **Inconvénients**:
  - Manque de flexibilité pour des besoins spécifiques
  - Nécessite de maintenir une liste exhaustive
  - Peut limiter l'adaptabilité métier

### Option 2: Conditions Personnalisées Textuelles (CHOISI)

- **Description**: Le manager peut créer des conditions textuelles libres lors de la création de campagne
- **Avantages**:
  - **Flexibilité maximale** : Adapté à chaque campagne et contexte
  - **Simplicité technique** : Pas de référentiel de conditions à maintenir
  - **Rapidité d'implémentation** : Structure de données simple
  - **Évolutivité** : Facile d'ajouter des fonctionnalités (ordre, catégories) plus tard
- **Inconvénients**:
  - Moins de standardisation entre campagnes
  - Pas de statistiques globales sur les types de conditions
  - Dépend de la clarté rédactionnelle du manager

### Option 3: Hybride avec Templates (Non retenue)

- **Description**: Conditions prédéfinies + possibilité d'en créer de personnalisées
- **Avantages**:
  - Meilleur des deux mondes
  - Guidage tout en gardant la flexibilité
- **Inconvénients**:
  - Complexité technique accrue
  - Interface plus chargée
  - Surcharge pour un MVP

## Décision

**Solution choisie**: Option 2 - Conditions Personnalisées Textuelles

**Justification**:

Cette option correspond parfaitement au besoin exprimé et à la philosophie du projet : **simplicité et flexibilité**. Les managers connaissent leurs équipes et leurs objectifs spécifiques ; leur donner la liberté de définir leurs propres conditions permet une adaptation fine au contexte de chaque campagne.

L'implémentation technique est également plus simple et rapide, ce qui permet de valider le concept avec les utilisateurs réels avant d'ajouter potentiellement des fonctionnalités avancées (templates, suggestions, catégorisation) dans une version future.

## Architecture technique proposée

### 1. Base de données

Création d'une nouvelle table `campaign_unlock_conditions` :

```sql
CREATE TABLE campaign_unlock_conditions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_campaign_unlock_conditions_campaign
  ON campaign_unlock_conditions(campaign_id);
```

Table de tracking des conditions validées `campaign_validation_conditions` :

```sql
CREATE TABLE campaign_validation_conditions (
  id SERIAL PRIMARY KEY,
  validation_id INTEGER NOT NULL REFERENCES campaign_validations(id) ON DELETE CASCADE,
  condition_id INTEGER NOT NULL REFERENCES campaign_unlock_conditions(id) ON DELETE CASCADE,
  is_fulfilled BOOLEAN NOT NULL DEFAULT false,
  fulfilled_at TIMESTAMP,
  fulfilled_by INTEGER REFERENCES users(id),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(validation_id, condition_id)
);
```

### 2. Backend (NestJS)

- **Module**: Étendre le module `CampaignValidationModule`
- **Service**: Nouvelles méthodes dans `CampaignValidationService` :
  - `createUnlockConditions(campaignId, conditions[])`
  - `getUnlockConditionsByCampaign(campaignId)`
  - `updateConditionFulfillment(validationId, conditionId, fulfilled)`
  - `checkAllConditionsFulfilled(validationId)` → Booléen
- **DTOs**:
  - `CreateUnlockConditionDto`: { description, displayOrder }
  - `UpdateConditionFulfillmentDto`: { isFulfilled, comment }
- **Validation business**: Refuser la validation de cagnotte si toutes les conditions ne sont pas cochées

### 3. Frontend (Next.js)

#### Création de campagne

- Ajout d'une section "Conditions de déblocage" dans `CampaignForm`
- Interface pour ajouter/supprimer/réordonner des conditions
- Minimum 1 condition, maximum 10 recommandé
- Champ texte libre par condition (max 500 caractères)

#### Validation de cagnotte (Dashboard Manager)

- Affichage de la liste des conditions avec checkboxes
- Compteur visuel : "3/5 conditions remplies"
- Bouton "Valider la cagnotte" désactivé tant que toutes les conditions ne sont pas cochées
- Possibilité d'ajouter un commentaire par condition
- Message d'alerte si tentative de validation incomplète

### 4. Règles métier

- **Création de campagne** :

  - Au moins 1 condition de déblocage obligatoire par campagne
  - Maximum 10 conditions (limite technique configurable)
  - Description de condition : 10-500 caractères

- **Validation de cagnotte** :

  - TOUTES les conditions doivent être cochées pour permettre la validation
  - Le manager peut décocher une condition même après l'avoir cochée (avant validation finale)
  - Une fois la cagnotte validée, les conditions sont verrouillées (historique immuable)

- **Modification de campagne** :
  - Les conditions peuvent être modifiées si la campagne est en statut `draft`
  - Si la campagne est `active` : possibilité d'ajouter des conditions, impossible d'en supprimer
  - Si la campagne est `completed` : conditions verrouillées

## Conséquences attendues

### Positives:

- ✅ **Contrôle qualité renforcé** : Les managers s'assurent que tous les critères sont remplis avant validation
- ✅ **Transparence** : Les FBO voient les conditions dès le début de la campagne
- ✅ **Flexibilité métier** : Conditions adaptées au contexte de chaque campagne
- ✅ **Traçabilité** : Historique de quelles conditions ont été validées et quand
- ✅ **Prévention des litiges** : Critères clairs et documentés
- ✅ **Extensibilité** : Architecture permettant d'ajouter facilement des fonctionnalités (templates, catégories, pondération) plus tard

### Négatives (ou risques):

- ⚠️ **Dépendance à la clarté rédactionnelle** : Si les conditions sont mal formulées, elles peuvent créer de la confusion
- ⚠️ **Charge de travail manager** : Ajout d'une étape lors de la création de campagne
- ⚠️ **Rigidité** : Si toutes les conditions doivent être remplies, pas de flexibilité pour des cas limites
- ⚠️ **Performance** : Requêtes supplémentaires lors de la récupération des campagnes et validations
- ⚠️ **Complexité UX** : Interface de validation devient plus chargée

### Mitigations:

- 📝 Fournir des exemples de bonnes conditions lors de la création
- 🎯 Limiter le nombre de conditions (10 max) pour éviter la surcharge
- 💡 Afficher les conditions au FBO dès le début de la campagne pour transparence
- ⚡ Optimiser les requêtes avec des JOINs et index appropriés

## Prochaines étapes pour l'implémentation

### Phase 1 : Base de données (Backend)

1. ✅ Créer le schéma des tables dans `schema.ts`
2. ✅ Générer la migration Drizzle : `pnpm db:generate`
3. ✅ Appliquer la migration : `pnpm db:migrate`
4. ✅ Ajouter les données de seed pour tests

### Phase 2 : API Backend

1. ✅ Créer les DTOs : `CreateUnlockConditionDto`, `UpdateConditionFulfillmentDto`
2. ✅ Étendre `CampaignValidationService` avec les nouvelles méthodes
3. ✅ Ajouter les endpoints REST :
   - `POST /campaigns/:id/unlock-conditions`
   - `GET /campaigns/:id/unlock-conditions`
   - `PUT /campaigns/:id/unlock-conditions/:conditionId`
   - `DELETE /campaigns/:id/unlock-conditions/:conditionId`
   - `PUT /campaign-validations/:id/conditions/:conditionId/fulfill`
4. ✅ Ajouter la validation métier (empêcher validation si conditions non remplies)
5. ✅ Tests unitaires et E2E

### Phase 3 : Frontend

1. ✅ Modifier `CampaignForm` pour ajouter la section "Conditions de déblocage"
2. ✅ Créer le composant `UnlockConditionsManager` (ajout/suppression/ordre)
3. ✅ Modifier le dashboard Manager pour afficher les conditions lors de la validation
4. ✅ Créer le composant `ConditionChecklistValidator`
5. ✅ Ajouter les hooks TanStack Query : `useUnlockConditions`, `useUpdateConditionFulfillment`
6. ✅ Bloquer la validation de cagnotte si conditions non remplies
7. ✅ Afficher les conditions au FBO dans son dashboard

### Phase 4 : Tests & Documentation

1. ✅ Tests E2E complets du workflow
2. ✅ Mise à jour de la documentation API
3. ✅ Mise à jour du README et guides utilisateur
4. ✅ Tests utilisateur avec un manager pilote

## Évolutions futures possibles

- **Phase 2.0** : Système de templates de conditions réutilisables
- **Phase 2.1** : Catégorisation des conditions (Présence, Performance, Formation, etc.)
- **Phase 2.2** : Conditions avec pondération (certaines plus importantes que d'autres)
- **Phase 2.3** : Conditions avec validation automatique basée sur les données (ex: "3 parrainages" vérifié automatiquement)
- **Phase 2.4** : Notifications aux FBO quand une condition est validée
- **Phase 2.5** : Statistiques agrégées sur les conditions les plus fréquentes

## Liens

- Schéma de base de données : `apps/backend/src/db/schema.ts`
- Service de validation : `apps/backend/src/campaign-validation/campaign-validation.service.ts`
- Formulaire de campagne : `apps/frontend/src/components/campaigns/CampaignForm.tsx`
- Dashboard Manager : `apps/frontend/src/app/manager/dashboard/page.tsx`
- ADR Système de validation : `docs/adr/003-fbo-campaign-validation-system.md`

---

_Cet ADR définit l'architecture pour le système de conditions de déblocage personnalisées des cagnottes dans HTF Sunup._
