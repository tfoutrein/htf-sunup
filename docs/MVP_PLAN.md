# Plan de Développement MVP - HTF SunUp

## Vue d'ensemble du projet

**Objectif :** Créer une application mobile-first pour gérer les défis quotidiens de la Happy Team Factory (équipe d'entrepreneurs Forever Living).

**Période :** Du 07 juillet au 31 août 2025

## Fonctionnalités MVP

### 1. Authentification

- [ ] Système de connexion login/mot de passe
- [ ] Gestion des sessions utilisateur
- [ ] Protection des routes selon les rôles

### 2. Gestion des utilisateurs et équipes

- [ ] CRUD des membres FBO
- [ ] Attribution des managers aux membres
- [ ] Interface de gestion d'équipe pour les managers

### 3. Programmation des actions

- [ ] Interface manager pour créer/programmer les actions quotidiennes
- [ ] 3 types d'actions : Vente, Recrutement, Réseaux sociaux
- [ ] Planification sur la période du challenge

### 4. Interface FBO (membres)

- [ ] Dashboard avec les 3 défis du jour
- [ ] Interface fun et décontractée (style summer/chill)
- [ ] Système de validation des actions (check done)

### 5. Suivi et monitoring

- [ ] Dashboard manager pour voir l'avancement de son équipe
- [ ] Vue globale pour la marraine (Aurélia)

## Architecture technique

### Base de données

```
Users (id, email, password, role, manager_id, name)
├── Roles: 'marraine' | 'manager' | 'fbo'

Actions (id, title, description, type, date, created_by)
├── Types: 'vente' | 'recrutement' | 'reseaux_sociaux'

UserActions (id, user_id, action_id, completed, completed_at)
```

### Stack technique

- **Frontend :** Next.js 14, Hero UI, Tailwind CSS
- **Backend :** Nest.js, Drizzle ORM
- **Base de données :** PostgreSQL
- **Design :** Mobile-first, style décontracté/summer

## Plan de développement (par phases)

### Phase 1 : Foundation (Semaine 1)

1. **Setup de la base de données**

   - [ ] Création des entités Users, Actions, UserActions
   - [ ] Migrations Drizzle
   - [ ] Seed data pour tests

2. **Authentification**
   - [ ] JWT auth backend (login/register)
   - [ ] Pages de connexion frontend
   - [ ] Middleware de protection des routes

### Phase 2 : Gestion des utilisateurs (Semaine 1-2)

3. **CRUD Utilisateurs**
   - [ ] API endpoints CRUD users
   - [ ] Interface de gestion d'équipe (managers)
   - [ ] Attribution manager-membre

### Phase 3 : Gestion des actions (Semaine 2)

4. **Programmation des actions**
   - [ ] API endpoints CRUD actions
   - [ ] Interface manager pour créer/programmer
   - [ ] Validation des types d'actions

### Phase 4 : Interface FBO (Semaine 2-3)

5. **Dashboard FBO**
   - [ ] Page d'accueil avec défis du jour
   - [ ] Design mobile-first summer/chill
   - [ ] Système de validation (check done)

### Phase 5 : Monitoring et finitions (Semaine 3)

6. **Dashboards de suivi**

   - [ ] Interface manager : suivi équipe
   - [ ] Interface marraine : vue globale
   - [ ] Statistiques et indicateurs

7. **UX/UI Polish**
   - [ ] Design système cohérent
   - [ ] Animations et micro-interactions
   - [ ] Tests utilisateur

## Rôles et permissions

### Marraine (Aurélia)

- Vue globale sur toutes les équipes
- Accès à tous les dashboards
- Gestion des managers

### Managers (Jéromine, Gaëlle, Audrey, Maud, Virginie)

- Gestion de leur équipe (CRUD membres)
- Programmation des actions pour leur équipe
- Suivi de l'avancement de leur équipe

### Membres FBO

- Accès à leurs défis quotidiens
- Validation de leurs actions
- Vue de leur progression

## Critères de succès MVP

1. **Fonctionnel**

   - Tous les rôles peuvent se connecter
   - Les managers peuvent gérer leur équipe
   - Les FBO reçoivent et valident leurs défis
   - Le suivi fonctionne correctement

2. **Technique**

   - Application responsive (mobile-first)
   - Performance optimisée
   - Sécurité des données

3. **UX**
   - Interface intuitive
   - Style décontracté et engageant
   - Expérience fluide sur mobile

## Livraison

- **Durée estimée :** 3 semaines
- **Environnement de test :** Déploiement Vercel + Render
- **Formation :** Documentation utilisateur
- **Support :** Période d'accompagnement post-lancement

---

_Ce plan sera affiné au fur et à mesure du développement selon les retours utilisateurs et les contraintes techniques rencontrées._
