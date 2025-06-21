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

### 3. Gestion des campagnes de défis (NOUVEAU)

- [ ] **CRUD des campagnes** (ajout, suppression, modification)
  - Interface partagée marraine/managers
  - Définition période (date début/fin)
  - Vue globale des campagnes
- [ ] **Gestion des défis quotidiens**
  - Création défis pour chaque jour de la campagne
  - Attribution de 1 à 6 actions par défi
- [ ] **Programmation des actions**
  - Interface pour définir les actions dans chaque défi
  - 3 types d'actions : Vente, Recrutement, Réseaux sociaux
  - Planification sur toute la période de la campagne

### 4. Interface FBO (membres)

- [x] Dashboard avec les 3 défis du jour
- [x] Interface fun et décontractée (style summer/chill)
- [x] Système de validation des actions (check done)
- [ ] **Vue hebdomadaire** (dimanche 10h)
  - Tableau imprimable des défis de la semaine
  - Organisation et anticipation

### 5. Suivi et monitoring

- [x] Dashboard manager pour voir l'avancement de son équipe
- [x] Vue globale pour la marraine (Aurélia)

### 6. Fonctionnalités étendues (hors MVP actuel)

- [ ] Chat communautaire
  - Messages texte, vocaux, photos
  - Espace d'échange pour la communauté
- [ ] Notifications automatiques
  - 8h00 : envoi des 3 actions du jour
  - Dimanche 10h : vue hebdomadaire

## Architecture technique

### Base de données (MISE À JOUR)

```
Users (id, email, password, role, manager_id, name)
├── Roles: 'marraine' | 'manager' | 'fbo'

Campaigns (id, name, description, start_date, end_date, created_by) [NOUVEAU]
├── Campagnes de défis globales

Challenges (id, campaign_id, date, title, description) [NOUVEAU]
├── Défis quotidiens liés à une campagne

Actions (id, challenge_id, title, description, type, order) [MODIFIÉ]
├── Types: 'vente' | 'recrutement' | 'reseaux_sociaux'
├── order: position dans le défi (1-6)

UserActions (id, user_id, action_id, challenge_id, completed, completed_at, proof_url)
├── Lien avec le défi pour traçabilité
```

### Stack technique

- **Frontend :** Next.js 14, Hero UI, Tailwind CSS
- **Backend :** Nest.js, Drizzle ORM
- **Base de données :** PostgreSQL
- **Design :** Mobile-first, style décontracté/summer

## Plan de développement (MISE À JOUR)

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

### Phase 3 : Architecture campagnes (NOUVEAU - Semaine 2-3)

4. **Migration base de données**

   - [ ] Ajout entités Campaigns et Challenges
   - [ ] Migration des données existantes
   - [ ] Mise à jour relations Actions

5. **CRUD Campagnes**

   - [ ] API endpoints CRUD campagnes
   - [ ] Interface partagée marraine/managers
   - [ ] Gestion périodes et statuts

6. **Gestion des défis**
   - [ ] API CRUD défis quotidiens
   - [ ] Interface de planification par campagne
   - [ ] Attribution actions aux défis (1-6 par défi)

### Phase 4 : Interface FBO adaptée (Semaine 3)

7. **Dashboard FBO mis à jour**

   - [ ] Affichage défis basé sur campagnes actives
   - [ ] Vue détaillée d'un défi (1-6 actions)
   - [ ] Système validation avec preuve

8. **Vue hebdomadaire**
   - [ ] Interface tableau imprimable
   - [ ] Planification semaine (dimanche 10h)

### Phase 5 : Monitoring campagnes (Semaine 4)

9. **Dashboards adaptés**
   - [ ] Suivi par campagne pour managers
   - [ ] Vue globale campagnes pour marraine
   - [ ] Statistiques et indicateurs campagne

## Rôles et permissions (MISE À JOUR)

### Marraine (Aurélia)

- **Campagnes** : Création, modification, suppression (vue globale partagée)
- **Défis** : Programmation actions quotidiennes dans les campagnes
- **Suivi** : Vue globale toutes équipes, toutes campagnes
- **Gestion** : Accès managers et leurs équipes

### Managers (Jéromine, Gaëlle, Audrey, Maud, Virginie)

- **Campagnes** : Accès aux mêmes campagnes que la marraine (vue partagée)
- **Défis** : Co-programmation des actions quotidiennes
- **Équipe** : Gestion CRUD de leur équipe
- **Suivi** : Progression de leur équipe sur les campagnes

### Membres FBO

- **Défis** : Accès aux défis du jour de la campagne active
- **Actions** : Validation avec preuves (1 à 6 actions par défi)
- **Suivi** : Vue de leur progression dans la campagne
- **Planning** : Vue hebdomadaire des défis à venir

## Critères de succès MVP (ACTUALISÉS)

1. **Fonctionnel**

   - Gestion complète des campagnes par marraine/managers
   - Défis quotidiens avec 1-6 actions configurables
   - FBO peuvent voir et valider leurs défis
   - Vue partagée campagnes entre marraine et managers

2. **Technique**

   - Architecture campagnes/défis/actions fonctionnelle
   - Migration données sans perte
   - Performance avec nouvelles entités

3. **UX**
   - Interface campagnes intuitive
   - Planning défis claire pour FBO
   - Vue hebdomadaire imprimable

## État actuel vs Nouvelles exigences

### ✅ Fonctionnalités déjà complétées (à adapter)

- Base authentification et utilisateurs : **OK**
- Interface FBO basique : **À adapter pour campagnes**
- Dashboards : **À étendre pour campagnes**

### 🔄 Fonctionnalités à refactorer

- **Actions** → intégrer dans défis et campagnes
- **Planning** → basé sur campagnes plutôt qu'actions directes
- **Suivi** → par campagne et défi

### 🆕 Nouvelles fonctionnalités prioritaires

1. **Gestion campagnes** (partagée marraine/managers)
2. **Défis quotidiens** (1-6 actions configurables)
3. **Vue hebdomadaire** FBO (tableau imprimable)

---

## Prochaines étapes immédiates

1. **Mise à jour schéma base** : Ajouter Campaigns et Challenges
2. **Migration données** : Adapter les actions existantes
3. **Interface campagnes** : Créer l'interface partagée
4. **Tests** : Valider la nouvelle architecture

_Plan mis à jour le 12 décembre 2024 - Intégration concept campagnes de défis_
