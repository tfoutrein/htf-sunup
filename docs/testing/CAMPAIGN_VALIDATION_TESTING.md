# Tests de Validation de Campagne Active

## Vue d'ensemble

Ce document décrit les tests à effectuer pour valider le fonctionnement de la règle métier :
**"Les actions ne peuvent être complétées que pendant une campagne active"**

## Tests Backend

### Test 1 : Complétion réussie avec campagne active ✅

**Scénario** : Un FBO tente de compléter une action pendant une campagne active

**Prérequis** :

- Une campagne avec `status = 'active'` et `archived = false`
- `startDate` dans le passé, `endDate` dans le futur
- Une action non complétée assignée au FBO

**Actions** :

1. Se connecter en tant que FBO
2. Accéder à une action du défi du jour
3. Télécharger une preuve
4. Valider l'action

**Résultat attendu** :

- ✅ L'action est marquée comme complétée
- ✅ La preuve est enregistrée
- ✅ Les gains sont mis à jour

### Test 2 : Échec - Campagne non active ❌

**Scénario** : Un FBO tente de compléter une action sur une campagne `draft` ou `completed`

**Prérequis** :

- Une campagne avec `status ≠ 'active'` (ex: 'draft', 'completed', 'cancelled')
- Une action non complétée

**Actions** :

1. Se connecter en tant que FBO
2. Tenter de compléter une action via l'API

**Résultat attendu** :

- ❌ HTTP 400 Bad Request
- ❌ Message : "Impossible de compléter une action : la campagne n'est pas active"

### Test 3 : Échec - Campagne archivée ❌

**Scénario** : Un FBO tente de compléter une action sur une campagne archivée

**Prérequis** :

- Une campagne avec `status = 'active'` mais `archived = true`
- Une action non complétée

**Actions** :

1. Se connecter en tant que FBO
2. Tenter de compléter une action via l'API

**Résultat attendu** :

- ❌ HTTP 400 Bad Request
- ❌ Message : "Impossible de compléter une action : la campagne n'est pas active"

### Test 4 : Échec - Date avant début de campagne ❌

**Scénario** : Un FBO tente de compléter une action avant le début de la campagne

**Prérequis** :

- Une campagne avec `status = 'active'`
- `startDate` dans le futur (ex: +5 jours)
- Une action non complétée

**Actions** :

1. Se connecter en tant que FBO
2. Tenter de compléter une action via l'API

**Résultat attendu** :

- ❌ HTTP 400 Bad Request
- ❌ Message : "Impossible de compléter une action en dehors de la période de campagne"

### Test 5 : Échec - Date après fin de campagne ❌

**Scénario** : Un FBO tente de compléter une action après la fin de la campagne

**Prérequis** :

- Une campagne avec `status = 'active'`
- `endDate` dans le passé (ex: -5 jours)
- Une action non complétée

**Actions** :

1. Se connecter en tant que FBO
2. Tenter de compléter une action via l'API

**Résultat attendu** :

- ❌ HTTP 400 Bad Request
- ❌ Message : "Impossible de compléter une action en dehors de la période de campagne"

## Tests Frontend

### Test 6 : Affichage nom de campagne dans la cagnotte ✅

**Scénario** : Vérifier que le nom de la campagne est visible dans l'affichage des gains

**Actions** :

1. Se connecter en tant que FBO avec une campagne active
2. Observer l'affichage de la cagnotte (desktop et mobile)

**Résultat attendu** :

- ✅ Icône 🎯 + nom de la campagne visible
- ✅ Affichage cohérent sur mobile et desktop

### Test 7 : Badge "Campagne Active" ✅

**Scénario** : Vérifier l'affichage du badge de campagne active

**Actions** :

1. Se connecter en tant que FBO avec une campagne active
2. Observer le header du dashboard

**Résultat attendu** :

- ✅ Badge vert avec "🟢 Campagne Active"
- ✅ Animation pulse sur l'icône

### Test 8 : Section détaillée de la cagnotte ✅

**Scénario** : Vérifier la section dédiée aux gains de campagne

**Actions** :

1. Se connecter en tant que FBO avec une campagne active
2. Observer la section après la barre de progression

**Résultat attendu** :

- ✅ Titre "Ta Cagnotte - [Nom Campagne]"
- ✅ Total de la cagnotte affiché
- ✅ Répartition Défis vs Bonus visible
- ✅ Pourcentages calculés
- ✅ Message explicatif sur les règles

### Test 9 : Message d'avertissement sans campagne ⚠️

**Scénario** : Vérifier le message quand aucune campagne n'est active

**Actions** :

1. Archiver toutes les campagnes actives (via admin)
2. Se connecter en tant que FBO
3. Observer le dashboard

**Résultat attendu** :

- ⚠️ Grande carte avec icône ⚠️
- ⚠️ Titre "Aucune campagne active"
- ⚠️ Encadré "Règle importante" expliquant les règles
- ⚠️ Pas d'actions ni de bonus disponibles

### Test 10 : Responsive Mobile 📱

**Scénario** : Vérifier l'affichage sur mobile

**Devices à tester** :

- iPhone SE (petit écran)
- iPhone 12 Pro (standard)
- iPad (tablette)

**Actions** :

1. Accéder au dashboard depuis chaque device
2. Vérifier tous les nouveaux composants

**Résultat attendu** :

- ✅ Cagnotte visible en sticky top sur mobile
- ✅ Nom de campagne tronqué correctement (max-w-[180px])
- ✅ Section détaillée responsive
- ✅ Badge campagne active lisible
- ✅ Pas de débordement horizontal
- ✅ Touch targets suffisamment grands

### Test 11 : Responsive Desktop 🖥️

**Résolutions à tester** :

- 1280x720 (petit laptop)
- 1920x1080 (standard)
- 2560x1440 (grand écran)

**Actions** :

1. Accéder au dashboard depuis chaque résolution
2. Vérifier tous les nouveaux composants

**Résultat attendu** :

- ✅ Cagnotte visible dans le header (desktop only)
- ✅ Nom de campagne tronqué correctement (max-w-[200px])
- ✅ Section détaillée bien alignée
- ✅ Badge campagne active dans le header
- ✅ Espacement harmonieux

## Checklist Finale

### Backend ✅

- [x] Validation campagne active dans `ActionsService.completeUserAction()`
- [x] Validation campagne active dans `UserActionsService.update()`
- [x] Messages d'erreur explicites
- [ ] Tests unitaires automatisés (à faire ultérieurement)

### Frontend ✅

- [x] Nom campagne dans `EarningsDisplay`
- [x] Badge "Campagne Active" dans `DashboardHeader`
- [x] Composant `CampaignEarningsBreakdown`
- [x] Message d'avertissement amélioré
- [ ] Tests UI responsive manuels (à valider avec utilisateurs réels)

### Documentation ✅

- [x] ADR 006 créé et approuvé
- [x] Document de tests manuels créé
- [x] Règles métier documentées

## Notes

### Pourquoi des tests manuels ?

Les tests automatisés NestJS nécessitent une configuration complexe avec mocking de la base de données.
Pour ce sprint, nous privilégions :

1. Tests manuels via l'application
2. Tests e2e si besoin (à ajouter plus tard)
3. Validation par les utilisateurs réels

### Prochaines étapes

1. Tester manuellement les scénarios ci-dessus en développement local
2. Déployer en environnement de staging
3. Faire tester par un FBO et un Manager réels
4. Créer des tests e2e si des régressions sont détectées

---

**Date de création** : 19 octobre 2025  
**Auteur** : Équipe HTF Sunup
