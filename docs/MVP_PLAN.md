# Plan de Développement MVP - HTF SunUp

## Vue d'ensemble du projet

**Objectif :** Créer une application mobile-first pour gérer les défis quotidiens de la Happy Team Factory (équipe d'entrepreneurs Forever Living).

**Période :** Du 07 juillet au 31 août 2025

## Concepts clés

### Hiérarchie des défis

- **Campagne de défi** : Période définie (date début/fin) contenant plusieurs défis
- **Défi** : Ensemble d'actions à réaliser un jour donné (1 à 6 actions par défi)
- **Action** : Tâche individuelle à réaliser par un FBO

### Caractéristiques importantes

- Les campagnes sont **globales** : marraine et managers voient et modifient les mêmes campagnes
- Chaque défi quotidien contient 3 types d'actions : Vente, Recrutement, Réseaux sociaux
- Les FBO valident leurs actions avec preuves

## Fonctionnalités MVP

### 1. Authentification

- [x] Système de connexion login/mot de passe
- [x] Gestion des sessions utilisateur
- [x] Protection des routes selon les rôles

### 2. Gestion des utilisateurs et équipes

- [x] CRUD des membres FBO
- [x] Attribution des managers aux membres
- [x] Interface de gestion d'équipe pour les managers

### 3. Gestion des campagnes de défis ✅ **IMPLÉMENTÉ BACKEND**

- [x] **CRUD des campagnes** (ajout, suppression, modification)
  - [x] API endpoints complets (/campaigns)
  - [x] Gestion périodes (date début/fin) avec validation
  - [x] Statut des campagnes (active, inactive, completed)
  - [x] Campagnes actives (/campaigns/active)
  - [ ] Interface frontend partagée marraine/managers
- [x] **Gestion des défis quotidiens**
  - [x] API CRUD défis (/challenges)
  - [x] Défis liés aux campagnes
  - [x] Unicité date/campagne
  - [x] Défis du jour (/challenges/today)
  - [ ] Interface de planification frontend
- [x] **Programmation des actions**
  - [x] Actions liées aux défis (challengeId)
  - [x] Ordre des actions (1-6 par défi)
  - [x] 3 types d'actions : vente, recrutement, reseaux_sociaux
  - [x] Validation limite 6 actions par défi
  - [ ] Interface de programmation frontend

### 4. Interface FBO (membres)

- [x] Dashboard avec les 3 défis du jour
- [x] Interface fun et décontractée (style summer/chill)
- [x] Système de validation des actions (check done)
- [ ] **Vue hebdomadaire** (dimanche 10h)
  - Tableau imprimable des défis de la semaine
  - Organisation et anticipation
- [ ] **Adaptation aux campagnes**
  - Affichage basé sur les défis de la campagne active
  - Vue détaillée d'un défi (1-6 actions)

### 5. Suivi et monitoring

- [x] Dashboard manager pour voir l'avancement de son équipe
- [x] Vue globale pour la marraine (Aurélia)
- [ ] **Adaptation aux campagnes**
  - Suivi par campagne pour managers
  - Vue globale campagnes pour marraine
  - Statistiques et indicateurs campagne

### 6. Fonctionnalités étendues (hors MVP actuel)

- [ ] Chat communautaire
  - Messages texte, vocaux, photos
  - Espace d'échange pour la communauté
- [ ] Notifications automatiques
  - 8h00 : envoi des 3 actions du jour
  - Dimanche 10h : vue hebdomadaire

## Architecture technique ✅ **IMPLÉMENTÉE**

### Base de données (COMPLÈTE)

```
Users (id, email, password, role, manager_id, name) ✅
├── Roles: 'marraine' | 'manager' | 'fbo'

Campaigns (id, name, description, start_date, end_date, status, created_by, created_at, updated_at) ✅
├── Campagnes de défis globales
├── Statuts: 'active' | 'inactive' | 'completed'

Challenges (id, campaign_id, date, title, description, created_at, updated_at) ✅
├── Défis quotidiens liés à une campagne
├── Contrainte unicité (campaign_id, date)

Actions (id, challenge_id, title, description, type, order, created_at, updated_at) ✅
├── Types: 'vente' | 'recrutement' | 'reseaux_sociaux'
├── order: position dans le défi (1-6)
├── Liées aux défis via challenge_id

UserActions (id, user_id, action_id, challenge_id, completed, completed_at, proof_url) ✅
├── Lien avec le défi pour traçabilité
├── Challenge_id ajouté pour suivi par défi
```

### API Backend ✅ **COMPLÈTE**

**Endpoints Campagnes:**

- `POST /campaigns` - Créer une campagne
- `GET /campaigns` - Lister toutes les campagnes
- `GET /campaigns/active` - Campagnes actives
- `GET /campaigns/:id` - Détails d'une campagne
- `GET /campaigns/:id/challenges` - Campagne avec ses défis
- `PATCH /campaigns/:id` - Modifier une campagne
- `DELETE /campaigns/:id` - Supprimer une campagne

**Endpoints Défis:**

- `POST /challenges` - Créer un défi
- `GET /challenges` - Lister les défis (filtres par campagne/date)
- `GET /challenges/today` - Défis du jour
- `GET /challenges/:id` - Détails d'un défi
- `GET /challenges/:id/actions` - Défi avec ses actions
- `PATCH /challenges/:id` - Modifier un défi
- `DELETE /challenges/:id` - Supprimer un défi

**Endpoints Actions (adaptés):**

- `POST /actions` - Créer une action (liée à un défi)
- `GET /actions/challenge/:challengeId` - Actions d'un défi
- `PATCH /actions/:id` - Modifier une action
- `DELETE /actions/:id` - Supprimer une action

### Stack technique

- **Frontend :** Next.js 14, Hero UI, Tailwind CSS
- **Backend :** Nest.js, Drizzle ORM ✅
- **Base de données :** PostgreSQL ✅
- **Design :** Mobile-first, style décontracté/summer

## Plan de développement ✅ **BACKEND TERMINÉ**

### Phase 1 : Foundation (Semaine 1) ✅

1. **Setup de la base de données**

   - [x] Création des entités Users, Actions, UserActions
   - [x] Migrations Drizzle
   - [x] Seed data pour tests

2. **Authentification**
   - [x] JWT auth backend (login/register)
   - [x] Pages de connexion frontend
   - [x] Middleware de protection des routes

### Phase 2 : Gestion des utilisateurs (Semaine 1-2) ✅

3. **CRUD Utilisateurs**
   - [x] API endpoints CRUD users
   - [x] Interface de gestion d'équipe (managers)
   - [x] Attribution manager-membre

### Phase 3 : Architecture campagnes ✅ **TERMINÉE BACKEND**

4. **Migration base de données**

   - [x] Ajout entités Campaigns et Challenges
   - [x] Migration des données existantes
   - [x] Mise à jour relations Actions

5. **CRUD Campagnes**

   - [x] API endpoints CRUD campagnes
   - [x] Logique métier (validation dates, statuts)
   - [x] Gestion périodes et statuts
   - [ ] Interface partagée marraine/managers

6. **Gestion des défis**
   - [x] API CRUD défis quotidiens
   - [x] Validation unicité date/campagne
   - [x] Attribution actions aux défis (1-6 par défi)
   - [ ] Interface de planification par campagne

### Phase 4 : Interface FBO adaptée (Semaine 3) 🔄 **EN COURS**

7. **Dashboard FBO mis à jour**

   - [ ] Affichage défis basé sur campagnes actives
   - [ ] Vue détaillée d'un défi (1-6 actions)
   - [ ] Système validation avec preuve adapté

8. **Vue hebdomadaire**
   - [ ] Interface tableau imprimable
   - [ ] Planification semaine (dimanche 10h)

### Phase 5 : Monitoring campagnes (Semaine 4) 📋 **À FAIRE**

9. **Dashboards adaptés**
   - [ ] Suivi par campagne pour managers
   - [ ] Vue globale campagnes pour marraine
   - [ ] Statistiques et indicateurs campagne

## Rôles et permissions ✅ **IMPLÉMENTÉS BACKEND**

### Marraine (Aurélia)

- **Campagnes** : Création, modification, suppression (API complète)
- **Défis** : Programmation actions quotidiennes dans les campagnes
- **Suivi** : Vue globale toutes équipes, toutes campagnes
- **Gestion** : Accès managers et leurs équipes

### Managers (Jéromine, Gaëlle, Audrey)

- **Campagnes** : Accès aux mêmes campagnes que la marraine
- **Défis** : Co-programmation des actions quotidiennes
- **Équipe** : Gestion CRUD de leur équipe
- **Suivi** : Progression de leur équipe sur les campagnes

### Membres FBO

- **Défis** : Accès aux défis du jour de la campagne active
- **Actions** : Validation avec preuves (1 à 6 actions par défi)
- **Suivi** : Vue de leur progression dans la campagne
- **Planning** : Vue hebdomadaire des défis à venir

## État d'implémentation actuel ✅

### ✅ **BACKEND COMPLET** (22 juin 2025)

- **Base de données** : Schema complet avec campagnes, défis, actions
- **Migrations** : Appliquées avec succès sur PostgreSQL
- **API** : Tous les endpoints CRUD fonctionnels et testés
- **Authentification** : JWT fonctionnel avec tous les rôles
- **Seed** : Données de test complètes (1 campagne, 1 défi, 3 actions)
- **Tests** : Endpoints validés avec Postman/curl

### 🔄 **FRONTEND À ADAPTER**

- **Interfaces existantes** : À adapter pour les campagnes
- **Dashboards** : À étendre pour le suivi par campagne
- **Navigation** : À enrichir avec gestion campagnes

### 📋 **PROCHAINES ÉTAPES PRIORITAIRES**

1. **Interface gestion campagnes** (marraine/managers)

   - Liste des campagnes avec statuts
   - Création/modification de campagnes
   - Planification des défis

2. **Adaptation dashboard FBO**

   - Affichage défis de la campagne active
   - Vue détaillée défi avec 1-6 actions
   - Validation adaptée

3. **Vue hebdomadaire imprimable**
   - Tableau des défis de la semaine
   - Export/impression

## Critères de succès MVP ✅ **BACKEND VALIDÉ**

1. **Fonctionnel**

   - [x] Gestion complète des campagnes par API
   - [x] Défis quotidiens avec 1-6 actions configurables
   - [x] Architecture hiérarchique campagne → défi → actions
   - [ ] Interface frontend complète

2. **Technique**

   - [x] Architecture campagnes/défis/actions fonctionnelle
   - [x] Migration données sans perte
   - [x] Performance avec nouvelles entités
   - [x] Tests API validés

3. **UX**
   - [ ] Interface campagnes intuitive
   - [ ] Planning défis claire pour FBO
   - [ ] Vue hebdomadaire imprimable

---

## Logs d'implémentation

### 22 juin 2025 - Implémentation backend campagnes de défis ✅

- **Schema DB** : Ajout tables campaigns, challenges, modification actions
- **Migrations** : Migration Drizzle appliquée avec succès
- **Modules** : CampaignsModule et ChallengesModule créés
- **Services** : Logique métier complète (validation dates, unicité, limites)
- **Contrôleurs** : API REST complète avec authentification JWT
- **Seed** : Données de test avec nouvelle structure
- **Tests** : Validation de tous les endpoints principaux

**Endpoints testés et fonctionnels :**

- `GET /campaigns` → Liste des campagnes
- `GET /challenges` → Liste des défis
- `GET /challenges/today` → Défis du jour
- `GET /challenges/1/actions` → Défi avec ses actions
- `GET /campaigns/1/challenges` → Campagne avec ses défis

_Plan mis à jour le 22 juin 2025 - Backend campagnes de défis implémenté_
