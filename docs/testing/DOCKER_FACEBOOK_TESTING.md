# Tests Docker avec Feature Flag Facebook

Ce guide explique comment tester la fonctionnalité de feature flag Facebook avec Docker.

## 🔧 Configuration des Variables d'Environnement

### Variables Backend

- `FACEBOOK_AUTH_ENABLED` : Active/désactive l'authentification Facebook côté serveur
- `FACEBOOK_APP_ID` : ID de l'application Facebook
- `FACEBOOK_APP_SECRET` : Secret de l'application Facebook
- `FACEBOOK_CALLBACK_URL` : URL de callback pour OAuth

### Variables Frontend

- `NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED` : Active/désactive l'affichage des composants Facebook
- `NEXT_PUBLIC_FACEBOOK_APP_ID` : ID de l'application Facebook (exposé au client)

## 📋 Prérequis

1. Docker et Docker Compose installés
2. Ports 3000 et 3001 disponibles
3. Fichiers d'environnement configurés

## 🚀 Tests Automatisés

### Validation de la Configuration

```bash
./scripts/validate-docker-config.sh
```

Vérifie que tous les fichiers et variables sont correctement configurés.

### Test de Cohérence

```bash
./scripts/test-env-consistency.sh
```

Vérifie la cohérence entre tous les fichiers d'environnement.

### Test avec Facebook Activé

```bash
./scripts/test-docker-facebook.sh enabled
```

Ce test :

- ✅ Configure Facebook comme activé
- ✅ Lance les services Docker
- ✅ Vérifie que les boutons Facebook sont visibles
- ✅ Vérifie que les endpoints Facebook sont accessibles

### Test avec Facebook Désactivé

```bash
./scripts/test-docker-facebook.sh disabled
```

Ce test :

- ✅ Configure Facebook comme désactivé
- ✅ Lance les services Docker
- ✅ Vérifie que les boutons Facebook sont masqués
- ✅ Vérifie que les endpoints Facebook retournent des erreurs

## 🔍 Vérification Manuelle

### Facebook Activé

1. **Frontend** : Visitez http://localhost:3000/login

   - ✅ Le bouton "Continuer avec Facebook" doit être visible
   - ✅ La page profil doit afficher la section "Comptes liés"

2. **Backend** : Testez les endpoints
   ```bash
   curl http://localhost:3001/api/auth/facebook
   # Doit rediriger vers Facebook OAuth
   ```

### Facebook Désactivé

1. **Frontend** : Visitez http://localhost:3000/login

   - ❌ Le bouton "Continuer avec Facebook" ne doit PAS être visible
   - ❌ La page profil ne doit PAS afficher la section "Comptes liés"

2. **Backend** : Testez les endpoints
   ```bash
   curl http://localhost:3001/api/auth/facebook
   # Doit retourner une erreur 500
   ```

## 📁 Fichiers de Configuration

### `.env.example` (Facebook Activé)

```env
FACEBOOK_AUTH_ENABLED=true
NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=true
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### `scripts/configs/.env.docker.test` (Facebook Désactivé)

```env
FACEBOOK_AUTH_ENABLED=false
NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=false
FACEBOOK_APP_ID=disabled-for-testing
FACEBOOK_APP_SECRET=disabled-for-testing
```

## 🏗️ Structure des Scripts

```
scripts/
├── test-docker-facebook.sh     # Tests complets avec Docker
├── validate-docker-config.sh   # Validation des configurations
├── test-env-consistency.sh     # Tests de cohérence
└── configs/
    └── .env.docker.test        # Configuration Facebook désactivée
```

## 🐛 Dépannage

### Problème : Les conteneurs ne démarrent pas

```bash
# Nettoyer les conteneurs existants
docker-compose down -v
docker system prune -f

# Vérifier les ports
lsof -i :3000 -i :3001
```

### Problème : Les variables d'environnement ne sont pas prises en compte

```bash
# Vérifier les variables dans les conteneurs
docker-compose exec backend env | grep FACEBOOK
docker-compose exec frontend env | grep FACEBOOK
```

### Problème : Les services ne répondent pas

```bash
# Vérifier les logs
docker-compose logs backend
docker-compose logs frontend
```

### Problème : Docker daemon non démarré

```bash
# Sur macOS avec Colima
colima start

# Ou démarrer Docker Desktop
open -a Docker
```

## 🧪 Tests de Régression

1. **Test de basculement** : Passer de activé à désactivé sans redémarrer
2. **Test de persistance** : Vérifier que les paramètres persistent après redémarrage
3. **Test d'intégration** : Vérifier que les autres fonctionnalités fonctionnent toujours

## 📊 Résultats Attendus

| Scénario  | Bouton Facebook | Section Profil | Endpoints API   |
| --------- | --------------- | -------------- | --------------- |
| Activé    | ✅ Visible      | ✅ Affichée    | ✅ Fonctionnels |
| Désactivé | ❌ Masqué       | ❌ Masquée     | ❌ Erreur 500   |

## 🔄 Commandes Utiles

```bash
# Validation complète
./scripts/validate-docker-config.sh && ./scripts/test-env-consistency.sh

# Arrêter tous les services
docker-compose down

# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer un service spécifique
docker-compose restart backend

# Reconstruire les images
docker-compose build --no-cache

# Vérifier l'état des services
docker-compose ps
```

## ✅ Checklist de Test

- [ ] `./scripts/validate-docker-config.sh` passe
- [ ] `./scripts/test-env-consistency.sh` passe
- [ ] `./scripts/test-docker-facebook.sh disabled` fonctionne
- [ ] `./scripts/test-docker-facebook.sh enabled` fonctionne
- [ ] Bouton Facebook masqué quand désactivé
- [ ] Section profil masquée quand désactivé
- [ ] Endpoints Facebook protégés quand désactivé

---

💡 **Note** : Ces tests garantissent que la fonctionnalité Facebook peut être complètement désactivée pour répondre aux exigences de conformité ou de déploiement spécifiques.
