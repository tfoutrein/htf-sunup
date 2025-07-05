# Configuration Render - HTF SunUp

## 🚀 Éléments de Configuration Render

### 1. Configuration Automatique via Blueprint

Le fichier `render.yaml` est configuré pour déployer automatiquement :

- **Backend API** : Service web Node.js
- **Base de données** : PostgreSQL

### 2. Variables d'Environnement

#### Variables automatiquement configurées :

- `NODE_ENV` : production
- `PORT` : 10000
- `FRONTEND_URL` : https://htf-sunup-frontend.vercel.app
- `CORS_ORIGIN` : https://htf-sunup-frontend.vercel.app
- `JWT_SECRET` : généré automatiquement par Render
- `PASSWORD_SALT_ROUNDS` : 12
- `DATABASE_URL` : lié automatiquement à la base PostgreSQL

#### Variables de stockage S3 (iDrive e2) :

- `S3_ENDPOINT` : https://b2y8.par5.idrivee2-11.com
- `S3_REGION` : eu-west-1
- `S3_ACCESS_KEY_ID` : PBL16uf72p6Ohufxizs5
- `S3_SECRET_ACCESS_KEY` : CZ4kHYSS2HWIyKMf0VvRXDmJPdYAl47QJf4tGkze
- `S3_BUCKET_NAME` : htf-sunup-storage

### 3. Configuration Base de Données

#### PostgreSQL Configuration :

- **Nom** : htf-sunup-postgres
- **Base de données** : htf_sunup_production
- **Utilisateur** : htf_sunup_user
- **Plan** : Free (développement)

### 4. Configuration Stockage de Fichiers

#### Service de stockage S3 (iDrive e2) :

- **Endpoint** : b2y8.par5.idrivee2-11.com
- **Bucket** : htf-sunup-storage
- **Usage** : Stockage des preuves d'actions des utilisateurs

#### ⚠️ IMPORTANT - Configuration du Bucket :

Avant le déploiement, s'assurer que le bucket `htf-sunup-storage` existe sur iDrive e2 :

1. Se connecter au dashboard iDrive e2
2. Créer le bucket `htf-sunup-storage` si nécessaire
3. Configurer les permissions publiques en lecture

### 5. Migration de Base de Données

#### Processus de Migration :

1. Les migrations sont automatiquement exécutées au démarrage
2. Script de migration : `pnpm db:deploy` (inclus dans `start:prod`)
3. Fichier de migration : `drizzle/0000_tiny_dreadnoughts.sql`

#### Tables créées :

- `users` : Utilisateurs avec rôles (fbo, manager, marraine)
- `campaigns` : Campagnes de défi
- `challenges` : Défis quotidiens
- `actions` : Actions à réaliser
- `user_actions` : Actions complétées par les utilisateurs

### 6. Health Check

- **Endpoint** : `/api/health`
- **Vérification** : Disponibilité de l'API

## 📋 Checklist de Déploiement

### Avant le Déploiement :

- [ ] Vérifier que toutes les migrations sont présentes
- [ ] Tester les scripts de build et start localement
- [ ] Vérifier la configuration des variables d'environnement
- [ ] S'assurer que le health check fonctionne
- [ ] ⚠️ Créer le bucket S3 `htf-sunup-storage` sur iDrive e2
- [ ] Configurer les permissions du bucket S3

### Commandes de Test Local :

```bash
# Test du build
cd apps/backend
pnpm build

# Test des migrations
pnpm db:deploy

# Test du démarrage
pnpm start:prod
```

### Lors du Déploiement :

- [ ] Vérifier que le service backend démarre correctement
- [ ] Vérifier que la base de données est accessible
- [ ] Vérifier la connectivité au stockage S3 (iDrive e2)
- [ ] Tester les endpoints principaux
- [ ] Vérifier les logs pour des erreurs

## 🔧 Configuration Render Dashboard

### 1. Créer le Service

1. Aller sur [render.com](https://render.com)
2. Connecter votre repository GitHub
3. Créer un nouveau **Blueprint**
4. Sélectionner le repository `htf-sunup`
5. Render détectera automatiquement le fichier `render.yaml`

### 2. Variables d'Environnement Supplémentaires

Si nécessaire, ajouter manuellement dans le dashboard :

#### Storage/AWS S3 (optionnel) :

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=your_bucket_name
```

#### Monitoring (optionnel) :

```
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### 3. Configuration Avancée

#### Ressources :

- **CPU** : 0.5 vCPU (plan gratuit)
- **RAM** : 512 MB (plan gratuit)
- **Instances** : 1 (plan gratuit)

#### Mise à l'échelle :

- **Auto-scaling** : Désactivé (plan gratuit)
- **Scaling manuel** : Possible via dashboard

## 🚨 Problèmes Courants et Solutions

### Erreur de Migration

**Problème** : Échec de migration au démarrage
**Solution** :

1. Vérifier les logs de déploiement
2. Vérifier la connectivité à la base de données
3. Exécuter manuellement les migrations si nécessaire

### Erreur de Connexion Base de Données

**Problème** : Impossible de se connecter à PostgreSQL
**Solution** :

1. Vérifier que la base de données est démarrée
2. Vérifier la variable `DATABASE_URL`
3. Redémarrer le service backend

### Erreur CORS

**Problème** : Erreurs CORS depuis le frontend
**Solution** :

1. Vérifier `CORS_ORIGIN` dans les variables d'environnement
2. S'assurer que l'URL du frontend est correcte
3. Redéployer si nécessaire

### Erreur de Stockage S3

**Problème** : Impossible d'uploader des fichiers
**Solution** :

1. Vérifier que le bucket `htf-sunup-storage` existe sur iDrive e2
2. Vérifier les variables S3 : `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
3. Vérifier les permissions du bucket
4. Tester la connectivité depuis les logs Render

### Erreur de base de données

Vérifiez que :

1. Le service PostgreSQL est créé et running
2. La variable `DATABASE_URL` est correctement configurée
3. L'URL utilise le nom d'hôte interne de Render

### Erreur de requête SQL Failed query

Si vous obtenez cette erreur :

```
Failed query: select "id", "name", "email", "password", "role", "manager_id", "facebook_id", "facebook_access_token", "profile_picture", "auth_provider", "created_at", "updated_at" from "users" where "users"."email" = $1
```

**Cause** : Les colonnes Facebook ne sont pas présentes dans la table `users`.

**Solution** : Le script de migration a été mis à jour pour ajouter automatiquement les colonnes manquantes. Redéployez l'application et les colonnes seront créées automatiquement.

**Colonnes ajoutées** :

- `facebook_id` (varchar(255) UNIQUE)
- `facebook_access_token` (varchar(1000))
- `profile_picture` (varchar(500))
- `auth_provider` (varchar(50) DEFAULT 'local')

### Erreur de build

Vérifiez que :

1. Les commandes de build utilisent `pnpm` et non `npm`
2. Le répertoire de travail est correct (`cd apps/backend` ou `cd apps/frontend`)
3. Toutes les dépendances sont installées

## Ordre de déploiement recommandé

1. **Créer la base de données PostgreSQL** d'abord
2. **Déployer le backend** avec toutes les variables d'environnement
3. **Déployer le frontend** avec l'URL du backend
4. **Tester** l'application complète

## Surveillance des déploiements

- Les logs de déploiement sont visibles dans l'onglet "Logs" de chaque service
- Les erreurs de migration sont visibles au début des logs
- Les erreurs d'application sont visibles après le message "Available at your primary URL"

## 📊 Monitoring et Logs

### Logs disponibles :

- **Build logs** : Pendant la construction
- **Deploy logs** : Pendant le déploiement
- **Service logs** : Logs d'exécution en temps réel

### Métriques :

- **CPU usage** : Utilisation processeur
- **Memory usage** : Utilisation mémoire
- **Response time** : Temps de réponse
- **Error rate** : Taux d'erreur

## 🔄 Mise à Jour et Redéploiement

### Déploiement Automatique :

- Push sur `main` → Redéploiement automatique
- Merge de PR → Redéploiement automatique

### Déploiement Manuel :

1. Aller dans le dashboard Render
2. Cliquer sur **Manual Deploy**
3. Sélectionner la branche à déployer

## 🌍 URLs de Production

Après déploiement :

- **Frontend** : `https://htf-sunup-frontend.vercel.app`
- **API Backend** : `https://htf-sunup-backend.onrender.com`
- **API Documentation** : `https://htf-sunup-backend.onrender.com/docs`
- **Health Check** : `https://htf-sunup-backend.onrender.com/api/health`

## ✅ Validation Post-Déploiement

### Tests à effectuer :

1. **Health Check** : `GET /api/health`
2. **API Documentation** : Accès à `/docs`
3. **Authentification** : `POST /auth/login`
4. **Endpoints principaux** :
   - `GET /campaigns`
   - `GET /users/profile`
   - `GET /challenges`

### Commandes de test :

```bash
# Health check
curl https://htf-sunup-backend.onrender.com/api/health

# API documentation
curl https://htf-sunup-backend.onrender.com/docs

# Test endpoint
curl https://htf-sunup-backend.onrender.com/campaigns
```

## Variables d'environnement Backend

### Variables obligatoires

```
NODE_ENV=production
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=postgresql://user:password@host:port/database
```

### Variables Facebook

**IMPORTANT**: Même si vous n'utilisez pas l'authentification Facebook, vous devez définir ces variables pour éviter les erreurs de déploiement :

```
FACEBOOK_AUTH_ENABLED=false
FACEBOOK_APP_ID=dummy
FACEBOOK_APP_SECRET=dummy
FACEBOOK_CALLBACK_URL=https://votre-app.onrender.com/auth/facebook/callback
```

Si vous souhaitez activer Facebook :

```
FACEBOOK_AUTH_ENABLED=true
FACEBOOK_APP_ID=votre-app-id-facebook
FACEBOOK_APP_SECRET=votre-app-secret-facebook
FACEBOOK_CALLBACK_URL=https://votre-app.onrender.com/auth/facebook/callback
```

### Variables optionnelles

```
FRONTEND_URL=https://votre-frontend.onrender.com
PORT=3000
```

## Variables d'environnement Frontend

### Variables obligatoires

```
NEXT_PUBLIC_API_URL=https://votre-backend.onrender.com
```

### Variables Facebook

```
NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=false
```

Si vous souhaitez activer Facebook :

```
NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=true
```

## Configuration du service Backend sur Render

1. **Nom du service** : `htf-sunup-backend`
2. **Environment** : `Node`
3. **Build Command** : `cd apps/backend && pnpm install && pnpm build`
4. **Start Command** : `cd apps/backend && pnpm start:prod`
5. **Root Directory** : Laisser vide (utilise la racine du repo)

## Configuration du service Frontend sur Render

1. **Nom du service** : `htf-sunup-frontend`
2. **Environment** : `Static Site`
3. **Build Command** : `cd apps/frontend && pnpm install && pnpm build`
4. **Publish Directory** : `apps/frontend/out`
5. **Root Directory** : Laisser vide (utilise la racine du repo)

## Configuration de la base de données

1. Créer un service PostgreSQL sur Render
2. Copier l'URL de connexion interne
3. L'ajouter comme variable d'environnement `DATABASE_URL` dans le service backend

## Résolution des erreurs courantes

### Erreur Facebook Strategy

Si vous obtenez cette erreur :

```
Facebook OAuth configuration is missing. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.
```

**Solution** : Ajoutez les variables Facebook avec des valeurs factices comme indiqué ci-dessus, même si vous n'utilisez pas Facebook.

### Erreur de base de données

Vérifiez que :

1. Le service PostgreSQL est créé et running
2. La variable `DATABASE_URL` est correctement configurée
3. L'URL utilise le nom d'hôte interne de Render

### Erreur de build

Vérifiez que :

1. Les commandes de build utilisent `pnpm` et non `npm`
2. Le répertoire de travail est correct (`cd apps/backend` ou `cd apps/frontend`)
3. Toutes les dépendances sont installées
