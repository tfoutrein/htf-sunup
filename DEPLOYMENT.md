# Guide de Déploiement - HTF SunUp

Ce guide détaille la configuration et le déploiement de HTF SunUp sur Vercel (frontend) et Render (backend + PostgreSQL).

## 🏗️ Architecture de Déploiement

- **Frontend (Next.js)**: Déployé sur Vercel
- **Backend (Nest.js)**: Déployé sur Render
- **Base de données**: PostgreSQL sur Render
- **CI/CD**: GitHub Actions

## 📋 Prérequis

1. Compte GitHub avec le repository HTF SunUp
2. Compte Vercel connecté à GitHub
3. Compte Render connecté à GitHub

## 🚀 Configuration du Déploiement

### 1. Configuration Vercel

#### 1.1 Créer le projet Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Importer le repository `htf-sunup`
3. Configuration du projet :
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `cd apps/frontend && pnpm build`
   - **Output Directory**: `apps/frontend/.next`

#### 1.2 Variables d'environnement Vercel

Dans les paramètres du projet Vercel, ajouter :

```env
NEXT_PUBLIC_API_URL=https://htf-sunup-backend.onrender.com
```

#### 1.3 Récupérer les tokens Vercel

1. Aller dans **Settings** > **Tokens**
2. Créer un nouveau token
3. Récupérer l'**Organization ID** et le **Project ID** depuis les paramètres

### 2. Configuration Render

#### 2.1 Créer les services Render

1. Aller sur [render.com](https://render.com)
2. Créer un nouveau **Blueprint** à partir du repository
3. Le fichier `render.yaml` sera automatiquement détecté

#### 2.2 Configuration manuelle (alternative)

Si vous préférez créer manuellement :

**Base de données PostgreSQL :**

- Service Type: PostgreSQL
- Name: `htf-sunup-postgres`
- Database: `htf_sunup_production`
- User: `htf_sunup_user`

**Backend API :**

- Service Type: Web Service
- Name: `htf-sunup-backend`
- Runtime: Node
- Build Command: `cd apps/backend && pnpm install && pnpm build`
- Start Command: `cd apps/backend && pnpm start:prod`

#### 2.3 Variables d'environnement Render

Le backend aura automatiquement :

- `DATABASE_URL` : généré automatiquement
- `NODE_ENV` : production
- `PORT` : 10000
- `FRONTEND_URL` : https://htf-sunup.vercel.app
- `CORS_ORIGIN` : https://htf-sunup.vercel.app

#### 2.4 Récupérer le Deploy Hook

1. Dans les paramètres du service backend
2. Aller dans **Settings** > **Deploy Hook**
3. Copier l'URL du webhook

### 3. Configuration GitHub Secrets

Dans les paramètres du repository GitHub, ajouter les secrets suivants :

#### Secrets Vercel

```
VERCEL_TOKEN=<votre-token-vercel>
VERCEL_ORG_ID=<votre-org-id>
VERCEL_PROJECT_ID=<votre-project-id>
```

#### Secrets Render

```
RENDER_DEPLOY_HOOK_URL=<votre-deploy-hook-url>
```

## 🔄 Processus de Déploiement

### Déploiement Automatique

Le déploiement se fait automatiquement via GitHub Actions :

1. **Push sur `main`** ou **merge d'une PR** → déclenche le workflow CI/CD
2. **Tests et builds** → vérifie la qualité du code
3. **Déploiement** → déploie sur Vercel et Render

### Workflows GitHub Actions

#### `ci.yml` - Intégration Continue

- Lint et vérification TypeScript
- Tests backend
- Build frontend et backend

#### `deploy.yml` - Déploiement

- Déploiement frontend sur Vercel
- Déploiement backend sur Render
- Health checks post-déploiement

### Déploiement Manuel

#### Frontend (Vercel)

```bash
# Installer la CLI Vercel
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

#### Backend (Render)

Le déploiement se fait automatiquement via git push ou via le dashboard Render.

## 🌐 URLs de Production

Une fois déployé, les services seront disponibles sur :

- **Frontend**: https://htf-sunup.vercel.app
- **Backend API**: https://htf-sunup-backend.onrender.com
- **API Documentation**: https://htf-sunup-backend.onrender.com/api

## 🔧 Configuration Post-Déploiement

### 1. Mise à jour des URLs

Après le premier déploiement, mettre à jour :

1. **Vercel** : Variable `NEXT_PUBLIC_API_URL` avec l'URL Render finale
2. **Render** : Variables `FRONTEND_URL` et `CORS_ORIGIN` avec l'URL Vercel finale

### 2. Base de données

La base de données PostgreSQL sera automatiquement créée sur Render. Les migrations se lancent automatiquement au démarrage du backend.

### 3. Monitoring

- **Vercel** : Dashboard avec métriques et logs
- **Render** : Dashboard avec métriques, logs et health checks

## 🐛 Dépannage

### Erreurs communes

#### Frontend ne peut pas contacter le backend

- Vérifier `NEXT_PUBLIC_API_URL` dans Vercel
- Vérifier que le backend est déployé et accessible

#### Erreurs de CORS

- Vérifier `CORS_ORIGIN` dans les variables Render
- S'assurer que l'URL frontend est correcte

#### Erreurs de base de données

- Vérifier que PostgreSQL est démarré sur Render
- Vérifier la variable `DATABASE_URL`

### Logs

#### Vercel

```bash
vercel logs <deployment-url>
```

#### Render

Les logs sont disponibles dans le dashboard Render.

## 📊 Monitoring et Performance

### Metrics disponibles

**Vercel :**

- Core Web Vitals
- Temps de réponse
- Bandwidth usage

**Render :**

- CPU et RAM usage
- Response time
- Database connections

### Alertes

Configurer des alertes dans les dashboards pour :

- Downtime
- Erreurs 5xx
- Performance dégradée

## 🔒 Sécurité

### Variables d'environnement

- Toutes les variables sensibles sont dans les secrets GitHub
- Pas de secrets committés dans le code

### HTTPS

- Vercel : HTTPS automatique
- Render : HTTPS automatique

### CORS

- Configuration stricte pour autoriser uniquement le frontend

## 🚀 Optimisations

### Performance

- **Vercel** : CDN global, cache automatique
- **Render** : Instance dédiée, autoscaling

### Coûts

- **Vercel Free Tier** : 100GB bandwidth, fonction serverless
- **Render Free Tier** : 750h/mois, 512MB RAM

---

## 📞 Support

En cas de problème :

1. Vérifier les logs dans les dashboards
2. Consulter la documentation officielle
3. Créer une issue dans le repository
