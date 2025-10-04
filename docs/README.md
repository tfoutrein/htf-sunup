# 📚 Documentation HTF Sunup

Bienvenue dans la documentation centralisée du projet HTF Sunup.

## 📂 Organisation de la Documentation

Cette documentation est organisée de manière thématique pour faciliter la navigation et la maintenance.

### 🏗️ [adr/](./adr/) - Architecture Decision Records

Documentation des décisions d'architecture importantes du projet.

**Fichiers :**

- `001-multiple-proofs-upload.md` - Système d'upload multiple de preuves
- `002-multiple-proofs-viewing-system.md` - Système de visualisation des preuves
- `003-fbo-campaign-validation-system.md` - Système de validation par les FBO

---

### 🔌 [api/](./api/) - Documentation API

Documentation des APIs et intégrations.

**Fichiers :**

- `API_DOCUMENTATION.md` - Documentation complète de l'API REST
- `TANSTACK_QUERY_DOCUMENTATION.md` - Gestion du cache et état serveur avec TanStack Query

---

### 🚀 [deployment/](./deployment/) - Déploiement & Infrastructure

Guides de déploiement et configuration des environnements.

**Fichiers :**

- `DEPLOYMENT.md` - Guide de déploiement principal
- `RENDER_CONFIGURATION.md` - Configuration Render.com
- `RENDER_DATABASE_TROUBLESHOOTING.md` - Dépannage base de données Render
- `VERCEL_TEST_CONFIG.md` - Configuration tests Vercel

---

### 💻 [development/](./development/) - Guides de Développement

Guides pour démarrer et développer sur le projet.

**Fichiers :**

- `QUICK_START.md` - Guide de démarrage rapide (5 minutes)
- `DEV_ACCOUNTS.md` - Comptes de développement et test
- `COMPTES_TEST_LOCAL.md` - Comptes de test locaux
- `QUICK_LOGIN_DEV.md` - Connexion rapide en développement

---

### 📚 [guides/](./guides/) - Guides Opérationnels

Guides pour la maintenance et les opérations quotidiennes.

**Fichiers :**

- `ARCHIVED_CAMPAIGNS_CLEANUP_GUIDE.md` - Nettoyage des campagnes archivées
- `PRODUCTION_CHECK_GUIDE.md` - Checklist de vérification production
- `PRODUCTION_USER_DELETION_GUIDE.md` - Suppression sécurisée d'utilisateurs
- `PROOFS_TROUBLESHOOTING.md` - Dépannage du système de preuves

---

### ⚡ [performance/](./performance/) - Performance & Optimisation

Audits et guides d'optimisation des performances.

**Fichiers :**

- `PERFORMANCE_INDEX.md` - 📑 Point d'entrée de la documentation performance
- `PERFORMANCE_SUMMARY.md` - Résumé exécutif (5 min)
- `PERFORMANCE_AUDIT.md` - Audit complet (30 min)
- `PERFORMANCE_QUICK_START.md` - Quick wins (30 min d'implémentation)
- `PERFORMANCE_CHECKLIST.md` - Checklist d'optimisation

**👉 Commencer par :** `PERFORMANCE_INDEX.md`

---

### 🔒 [security/](./security/) - Sécurité

Audits de sécurité et recommandations.

**Fichiers :**

- `AUDIT_SECURITE.md` - Audit de sécurité complet

---

### 🧪 [testing/](./testing/) - Tests & Validation

Guides de tests et validation du projet.

**Fichiers :**

- `DOCKER_FACEBOOK_TESTING.md` - Tests d'intégration Facebook avec Docker
- `FACEBOOK_UI_TEST_GUIDE.md` - Tests UI de l'authentification Facebook

---

## 📄 Fichiers à la Racine du Projet

Certains fichiers stratégiques restent à la racine pour faciliter l'accès par les IAs et les développeurs :

### Pour les IAs (Contexte Projet)

- `PROJECT_VIBE_CONF.md` - Configuration et type de projet
- `DEVPLAN.md` - Plan de développement
- `MVP_PLAN.md` - Plan MVP détaillé
- `CLAUDE.md` - Contexte pour Claude
- `GEMINI.md` - Contexte pour Gemini

### Documentation Principale

- `README.md` - Point d'entrée principal du projet

---

## 🔍 Comment Naviguer ?

### Par Besoin

**Je veux démarrer rapidement** → [development/QUICK_START.md](./development/QUICK_START.md)

**Je veux comprendre l'API** → [api/API_DOCUMENTATION.md](./api/API_DOCUMENTATION.md)

**Je veux déployer** → [deployment/DEPLOYMENT.md](./deployment/DEPLOYMENT.md)

**Je veux optimiser les performances** → [performance/PERFORMANCE_INDEX.md](./performance/PERFORMANCE_INDEX.md)

**Je veux résoudre un problème** → [guides/](./guides/)

**Je veux comprendre une décision d'architecture** → [adr/](./adr/)

**Je veux sécuriser l'application** → [security/AUDIT_SECURITE.md](./security/AUDIT_SECURITE.md)

**Je veux tester** → [testing/](./testing/)

---

## 🎯 Conventions

### Nommage des Fichiers

- **Majuscules + snake_case** : `API_DOCUMENTATION.md`
- **Préfixes par thème** : `PERFORMANCE_*`, `PRODUCTION_*`
- **Numérotation pour ADRs** : `001-description.md`

### Structure des Documents

Tous les documents suivent une structure cohérente :

1. **Titre principal** avec emoji
2. **Introduction** courte
3. **Sections numérotées** avec emojis
4. **Liens vers ressources** connexes
5. **Section de support** en fin

### Liens Internes

- Utiliser des **chemins relatifs** depuis le fichier actuel
- Toujours vérifier que les liens fonctionnent après déplacement

---

## 📝 Maintenance

### Ajouter un Nouveau Document

1. **Identifier la catégorie** appropriée
2. **Créer le fichier** dans le bon répertoire
3. **Suivre les conventions** de nommage
4. **Mettre à jour ce README** si nécessaire
5. **Vérifier les liens** dans les autres documents

### Mettre à Jour un Document

1. **Vérifier la date** de dernière mise à jour
2. **Mettre à jour le contenu**
3. **Vérifier les liens** internes et externes
4. **Tester les commandes** et exemples de code

---

## 🤝 Contribution

Pour contribuer à la documentation :

1. Respecter l'organisation actuelle
2. Suivre les conventions de nommage
3. Inclure des exemples concrets
4. Ajouter des emojis pour la lisibilité
5. Mettre à jour les liens nécessaires

---

**Dernière mise à jour :** 4 Octobre 2025

_Documentation organisée pour HTF Sunup - Application de défis quotidiens Happy Team Factory_ 🌅
