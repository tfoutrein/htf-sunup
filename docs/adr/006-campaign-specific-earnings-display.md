# ADR 006 : Affichage des Cagnottes par Campagne

## Statut

**APPROUVÉ** - 19 octobre 2025

## Contexte

### Situation Actuelle

Le système HTF Sunup calcule actuellement les cagnottes (earnings) correctement par FBO ET par campagne :

- Les gains des défis complétés sont liés à une campagne via `challenges.campaignId`
- Les bonus quotidiens sont liés à une campagne via `dailyBonus.campaignId`
- Le calcul des gains totaux se fait via `calculateTotalEarnings(userId, campaignId)`

### Problème Identifié

Bien que les cagnottes soient techniquement liées à des campagnes spécifiques, **l'interface utilisateur ne le montre pas clairement** :

1. **Manque de contexte** : Le FBO voit un montant total mais sans association explicite à la campagne active
2. **Confusion inter-campagne** : Pas de visibilité sur le fait que chaque nouvelle campagne repart à zéro
3. **Règle métier implicite** : La règle "pas de campagne active = pas de gains possibles" n'est pas visuellement claire

### Règles Métier à Respecter

1. ✅ **Gains uniquement sur campagne active** : Impossible de gagner sans campagne active
2. ✅ **Cagnotte par campagne** : Chaque campagne a sa propre cagnotte indépendante
3. ✅ **Remise à zéro** : Une nouvelle campagne démarre avec une cagnotte à 0€
4. ❌ **Clarté de l'interface** : Le FBO doit comprendre immédiatement à quelle campagne appartient sa cagnotte

### Règles Techniques à Vérifier

- ✅ Les bonus quotidiens vérifient la campagne active (ligne 56-58 de `daily-bonus.service.ts`)
- ❓ Les actions de défis doivent aussi vérifier la campagne active (à implémenter)

## Décision

### Approche Choisie : **Affichage Frontend Amélioré (Option C)**

Améliorer l'interface utilisateur pour rendre la relation "cagnotte ↔ campagne" **visuellement évidente** sans modifier la structure de données existante.

### Modifications Proposées

#### 1. **Composant EarningsDisplay Amélioré**

Afficher clairement le nom de la campagne avec la cagnotte :

```tsx
// Avant
💰 125,50 €

// Après
💰 125,50 € • Campagne Été 2024
    ↳ Cette cagnotte est liée à cette campagne
```

#### 2. **Indicateur de Campagne Active**

Ajouter un badge/indicateur visuel dans le header :

```tsx
<Badge color="success">🎯 Campagne Active : {campaignName}</Badge>
```

#### 3. **Dashboard Statistiques Détaillées**

Créer une section dédiée montrant :

- Cagnotte actuelle de la campagne en cours
- Répartition : Défis complétés vs Bonus quotidiens
- Message explicite : "Nouvelle campagne = Nouvelle cagnotte"

#### 4. **Message d'Avertissement si Pas de Campagne Active**

```tsx
⚠️ Aucune campagne active actuellement
   Les défis et bonus ne sont pas disponibles
```

#### 5. **Historique des Cagnottes par Campagne (Optionnel - Phase 2)**

Page dédiée listant toutes les campagnes passées avec leur cagnotte respective :

```
📊 Historique des Cagnottes
├─ Campagne Hiver 2024   →  450,00 € ✓ Validée
├─ Campagne Automne 2024  →  380,50 € ✓ Validée
└─ Campagne Été 2024      →  125,50 € 🔄 En cours
```

### Implémentation Backend (Validation Campagne Active)

Ajouter la vérification de campagne active pour les **actions de défis** :

```typescript
// Dans user-actions.service.ts ou actions.service.ts
async completeAction(userId: number, actionId: number) {
  // 1. Récupérer l'action et son challenge
  const action = await this.getActionWithChallenge(actionId);

  // 2. Récupérer la campagne associée
  const campaign = await this.getCampaignForChallenge(action.challengeId);

  // 3. VÉRIFIER que la campagne est active
  if (campaign.status !== 'active' || campaign.archived) {
    throw new BadRequestException(
      "Impossible de compléter une action : la campagne n'est pas active"
    );
  }

  // 4. Vérifier que la date est dans la période
  const today = new Date();
  if (today < campaign.startDate || today > campaign.endDate) {
    throw new BadRequestException(
      "Impossible de compléter une action en dehors de la période de campagne"
    );
  }

  // 5. Compléter l'action
  // ... suite du code
}
```

## Conséquences

### Positives ✅

1. **Clarté immédiate** : Le FBO comprend instantanément que sa cagnotte est liée à LA campagne active
2. **Pas de migration de données** : Aucun changement de schéma de base de données
3. **Rétrocompatible** : Les calculs existants continuent de fonctionner
4. **Évolutif** : Facilite l'ajout futur d'historique de cagnottes
5. **Sécurité renforcée** : Vérification backend de la campagne active pour toutes les actions

### Négatives ⚠️

1. **Modifications UI** : Nécessite des modifications dans plusieurs composants frontend
2. **Tests UI** : Besoin de tester sur mobile et desktop
3. **Complexité visuelle** : Risque de surcharge d'information si mal conçu

### Risques 🔴

1. **Régression** : Risque de casser l'affichage actuel si mal implémenté
2. **Performance** : Appels API supplémentaires si historique de cagnottes (Phase 2)

## Alternatives Considérées

### Option A : Stockage Persistant des Cagnottes

Créer une table `campaign_earnings` pour stocker les cagnottes.

**Rejetée car** :

- ❌ Duplication de données (déjà calculables dynamiquement)
- ❌ Risque de désynchronisation entre calcul et stockage
- ❌ Complexité technique non nécessaire pour le besoin actuel

### Option B : Système de Versement

Ajouter un système de "déblocage/versement" des cagnottes.

**Rejetée car** :

- ❌ Hors périmètre de la demande actuelle
- ❌ Le système de validation de campagne existe déjà
- ✅ Peut être ajouté plus tard si besoin

### Option D : Aucune Modification

Garder l'interface actuelle.

**Rejetée car** :

- ❌ Ne résout pas le problème de clarté pour les FBO
- ❌ Risque de confusion inter-campagnes
- ❌ Règle métier non explicite visuellement

## Plan d'Implémentation

### Phase 1 : Backend - Validation Campagne Active (Priorité Haute)

1. ✅ Ajouter vérification campagne active pour les actions de défis
2. ✅ Tests unitaires de la validation
3. ✅ Tests e2e des cas limites (campagne archivée, dates dépassées)

### Phase 2 : Frontend - Amélioration Affichage (Priorité Haute)

1. ✅ Modifier `EarningsDisplay` pour afficher le nom de campagne
2. ✅ Ajouter badge "Campagne Active" dans le header
3. ✅ Créer section statistiques détaillées dans le dashboard
4. ✅ Ajouter message d'avertissement si pas de campagne active
5. ✅ Tests UI responsive (mobile + desktop)

### Phase 3 : Historique (Priorité Basse - Optionnel)

1. 🔄 Créer page historique des cagnottes par campagne
2. 🔄 API endpoint pour récupérer les campagnes terminées avec earnings
3. 🔄 Tests de performance

## Références

- [Schema.ts](mdc:apps/backend/src/db/schema.ts) - Structure de données actuelle
- [DailyBonusService](mdc:apps/backend/src/daily-bonus/daily-bonus.service.ts) - Validation campagne active (ligne 56-58)
- [DashboardHeader](mdc:apps/frontend/src/components/dashboard/DashboardHeader.tsx) - Affichage actuel des gains
- [useDashboardData](mdc:apps/frontend/src/hooks/useDashboardData.ts) - Logique de récupération des données

## Notes

- Cette ADR s'inscrit dans la continuité des ADR précédentes sur la validation de campagne (ADR-003, ADR-004)
- L'historique des cagnottes (Phase 3) peut être implémenté ultérieurement selon les retours utilisateurs
- La règle "une cagnotte par campagne" est déjà respectée techniquement, seul l'affichage nécessite une amélioration

---

**Date de création** : 19 octobre 2025  
**Auteur** : Équipe HTF Sunup  
**Dernière mise à jour** : 19 octobre 2025
