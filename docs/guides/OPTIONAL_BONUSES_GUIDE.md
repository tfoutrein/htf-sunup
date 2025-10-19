# Guide : Bonus Optionnels par Campagne

## 📋 Vue d'ensemble

Cette fonctionnalité permet aux **managers** de choisir si une campagne autorise ou non les bonus quotidiens (paniers et parrainages). Si les bonus sont désactivés, les FBO se concentrent uniquement sur les défis quotidiens.

## 🎯 Pour les Managers

### Créer une Campagne avec/sans Bonus

Lors de la création ou modification d'une campagne :

1. Accédez au formulaire de campagne
2. Localisez la section **"Autoriser les bonus quotidiens"** (après la vidéo de présentation)
3. **Cochez** la case pour autoriser les bonus (activé par défaut)
4. **Décochez** la case pour désactiver les bonus

```
☑️ Autoriser les bonus quotidiens

Si décoché, les FBO ne pourront pas déclarer de bonus (paniers, parrainages) 
pour cette campagne. Seuls les défis quotidiens seront disponibles.
```

### Identifier les Campagnes avec/sans Bonus

Dans les **dashboards Manager**, chaque campagne affiche un indicateur :

- **"• Bonus ✓"** (en orange) : Les bonus sont activés
- **"• Pas de bonus"** (en gris) : Les bonus sont désactivés

### Cas d'Usage Recommandés

**✅ Activer les bonus quand :**
- Vous souhaitez encourager les parrainages et dépôts de panier
- La campagne a un objectif commercial fort
- Vous voulez maximiser la motivation des FBO

**❌ Désactiver les bonus quand :**
- La campagne se concentre uniquement sur les défis
- Vous souhaitez simplifier le suivi
- La période nécessite un focus spécifique (ex: formation)

## 👤 Pour les FBO

### Campagne avec Bonus Activés

Vous verrez :
- ✅ Le bouton **"Déclarer un Bonus"** dans le dashboard
- ✅ La section **"Mes Bonus Déclarés"**
- ✅ Les statistiques de bonus
- ✅ Accès à la page `/fbo/daily-bonus`

### Campagne sans Bonus Activés

Vous **ne verrez pas** :
- ❌ Le bouton "Déclarer un Bonus"
- ❌ La section "Mes Bonus Déclarés"
- ❌ Les statistiques de bonus

Si vous essayez d'accéder à `/fbo/daily-bonus`, un message s'affichera :

```
💰 Bonus non disponibles

Les bonus quotidiens ne sont pas activés pour la campagne [Nom].
Concentre-toi sur les défis quotidiens pour gagner des euros ! 🚀
```

## 🔧 Technique

### Migration de Base de Données

```sql
-- Migration 0014_loud_smiling_tiger.sql
ALTER TABLE campaigns 
ADD COLUMN bonuses_enabled BOOLEAN DEFAULT true NOT NULL;
```

**Rétrocompatibilité** : Toutes les campagnes existantes ont automatiquement `bonuses_enabled = true`.

### API Backend

**Validation automatique** : Si un FBO tente de créer un bonus pour une campagne où `bonusesEnabled = false`, l'API renvoie une erreur :

```
400 Bad Request
"Les bonus quotidiens ne sont pas autorisés pour cette campagne"
```

### Hook Frontend

```typescript
import { useBonusesEnabled } from '@/hooks';

const { bonusesEnabled, activeCampaign } = useBonusesEnabled();

// Utilisation
{bonusesEnabled && <BonusButton />}
```

## 📊 Statistiques

Les statistiques de bonus ne sont calculées et affichées que pour les campagnes où `bonusesEnabled = true`.

## 🆘 Questions Fréquentes

### Puis-je changer le paramètre après avoir créé la campagne ?

✅ **Oui !** Vous pouvez modifier une campagne existante et activer/désactiver les bonus à tout moment.

### Que deviennent les bonus déjà créés si je désactive ?

Les bonus existants restent en base de données et sont toujours visibles dans l'historique. Mais les FBO ne pourront plus en créer de nouveaux.

### Les FBO sont-ils notifiés du changement ?

Oui, si les bonus sont désactivés :
- Les sections bonus disparaissent du dashboard
- Un message informatif s'affiche si accès à `/fbo/daily-bonus`

### Puis-je désactiver seulement les paniers ou les parrainages ?

❌ **Pas pour le moment.** C'est une option "tout ou rien". Cependant, cette fonctionnalité pourrait être ajoutée ultérieurement (voir ADR-007 Option B).

## 📚 Ressources

- [ADR 007 : Bonus Optionnels par Campagne](../adr/007-optional-campaign-bonuses.md)
- [Documentation API Campagnes](../api/API_DOCUMENTATION.md)
- [Schéma de Base de Données](../../apps/backend/src/db/schema.ts)

---

**Date de création** : 19 octobre 2025  
**Version** : 1.0.0  
**Dernière mise à jour** : 19 octobre 2025

