# Guide de Démarrage Rapide - HTF SunUp

## 🚀 Lancement en 5 minutes

### 1. Prérequis

- Docker et Docker Compose installés
- Git installé
- Node.js 18+ et pnpm (optionnel pour développement local)

### 2. Installation

```bash
# Cloner le projet
git clone <votre-repo> htf-sunup
cd htf-sunup

# Démarrer tous les services avec Docker
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

### 3. Accès aux Services

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Documentation API** : http://localhost:3001/api

### 4. Comptes de Test

Utilisez ces comptes créés automatiquement :

| Rôle         | Email            | Mot de passe | Accès              |
| ------------ | ---------------- | ------------ | ------------------ |
| **Marraine** | aurelia@htf.com  | password     | Gestion globale    |
| **Manager**  | jeromine@htf.com | password     | Gestion équipe     |
| **FBO**      | marie@htf.com    | password     | Validation actions |

### 5. Test Rapide de l'API

```bash
# Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aurelia@htf.com","password":"password"}'

# Copier le token retourné et tester les campagnes
curl -X GET http://localhost:3001/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Fonctionnalités Disponibles ✅

### Backend Complet

- ✅ **Authentification JWT** avec 3 rôles (marraine/manager/fbo)
- ✅ **Gestion des campagnes** : CRUD complet avec validation des dates
- ✅ **Gestion des défis** : Défis quotidiens liés aux campagnes
- ✅ **Gestion des actions** : 1-6 actions par défi (vente/recrutement/réseaux sociaux)
- ✅ **Base de données** : PostgreSQL avec migrations Drizzle
- ✅ **API REST** : Tous les endpoints fonctionnels
- ✅ **Documentation** : Swagger intégré

### Données de Test

Le système crée automatiquement :

- 1 Campagne active : "Les défis de l'été de la Happy Team"
- 1 Défi pour aujourd'hui avec 3 actions
- 7 utilisateurs (1 marraine, 3 managers, 3 FBO)

## 🔧 Développement Local

Si vous préférez développer sans Docker :

```bash
# Démarrer uniquement PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Installer les dépendances
pnpm install

# Appliquer les migrations
pnpm db:migrate

# Créer les données de test
pnpm db:seed

# Démarrer backend et frontend
pnpm dev
```

## 📋 Prochaines Étapes

### Frontend à Adapter

- [ ] Interface de gestion des campagnes (marraine/managers)
- [ ] Dashboard FBO adapté aux défis de campagnes
- [ ] Vue hebdomadaire imprimable

### Endpoints Principaux

**Campagnes :**

- `GET /campaigns` - Liste des campagnes
- `POST /campaigns` - Créer une campagne
- `GET /campaigns/active` - Campagnes actives

**Défis :**

- `GET /challenges` - Liste des défis
- `GET /challenges/today` - Défis du jour
- `GET /challenges/:id/actions` - Défi avec actions

**Actions :**

- `POST /actions` - Créer une action
- `GET /actions/challenge/:id` - Actions d'un défi

## 🐛 Résolution de Problèmes

### Services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Redémarrer les services
docker-compose restart

# Nettoyer et relancer
docker-compose down
docker-compose up -d
```

### Base de données vide

```bash
# Appliquer les migrations
docker-compose exec backend pnpm db:migrate

# Créer les données de test
docker-compose exec backend pnpm db:seed
```

### Erreur 401 sur l'API

Vérifiez que vous utilisez le bon token JWT :

```bash
# Générer un nouveau token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aurelia@htf.com","password":"password"}'
```

## 📚 Documentation Complète

- **Plan MVP** : [docs/MVP_PLAN.md](./docs/MVP_PLAN.md)
- **Documentation API** : [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
- **README** : [README.md](./README.md)

## 🚀 Déploiement

Le projet est prêt pour le déploiement :

- Frontend : Vercel
- Backend : Render
- Base de données : PostgreSQL sur Render

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les détails.

---

**Vous êtes prêt !** 🎉 Le backend est entièrement fonctionnel avec toutes les fonctionnalités des campagnes de défis.
