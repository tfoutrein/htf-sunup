# Guide de Vérification des Données d'Aurélia en Production

## 🎯 Objectif

Vérifier que les modifications concernant Aurélia ont été correctement appliquées en production :

- Changement du rôle "marraine" vers "manager"
- Suppression complète du rôle "marraine"
- Hiérarchie des managers avec Aurélia

## 📋 Étapes pour Récupérer les Credentials de Production

### 1. Récupérer la String de Connexion depuis Render

1. **Connectez-vous à Render** : [https://render.com](https://render.com)
2. **Accédez à votre Dashboard** et trouvez la base de données `htf-sunup-postgres`
3. **Cliquez sur la base de données** pour ouvrir les détails
4. **Onglet "Connect"** : Copiez la string de connexion `External Database URL`

La string devrait ressembler à :

```
postgresql://username:password@host:port/database_name
```

### 2. Méthode Alternative : Variables d'Environnement du Backend

1. **Accédez au service backend** `htf-sunup-backend` sur Render
2. **Onglet "Environment"** : Trouvez la variable `DATABASE_URL`
3. **Cliquez sur "Reveal"** pour voir la valeur complète

## 🚀 Exécution du Script de Vérification

### Méthode 1 : Avec Variable d'Environnement

```bash
# Naviguez vers le dossier backend
cd apps/backend

# Exécutez le script avec la DATABASE_URL de production
DATABASE_URL="postgresql://username:password@host:port/database_name" pnpm db:check-aurelia-prod
```

### Méthode 2 : Export de Variable (macOS/Linux)

```bash
# Exportez la variable d'environnement
export DATABASE_URL="postgresql://username:password@host:port/database_name"

# Naviguez vers le dossier backend
cd apps/backend

# Exécutez le script
pnpm db:check-aurelia-prod
```

### Méthode 3 : Fichier .env Temporaire

```bash
# Créez un fichier .env.production dans apps/backend
echo 'DATABASE_URL="postgresql://username:password@host:port/database_name"' > .env.production

# Chargez les variables et exécutez
source .env.production && pnpm db:check-aurelia-prod

# Supprimez le fichier après utilisation
rm .env.production
```

## 📊 Sortie Attendue du Script

Le script vérifiera et affichera :

### ✅ Informations d'Aurélia

```
✅ Found Aurélia:
   ID: 1
   Name: Aurélia
   Email: aurelia@example.com
   Role: manager
   Manager ID: null
   Created At: 2024-01-01T00:00:00.000Z
   Updated At: 2024-01-01T00:00:00.000Z
```

### ✅ Distribution des Rôles

```
📊 Role distribution:
   manager: 3 users
   fbo: 25 users
```

### ✅ Vérification du Rôle "marraine"

```
✅ No users found with "marraine" role
```

### ✅ Hiérarchie des Managers

```
👥 All managers:
   - Aurélia (ID: 1)
     Email: aurelia@example.com
     Manager ID: None

   - Manager 2 (ID: 2)
     Email: manager2@example.com
     Manager ID: 1
     Manager Name: Aurélia
```

### ✅ Subordonnés d'Aurélia

```
✅ Found 2 subordinates:
   - Manager 2 (manager2@example.com) - Role: manager
   - Manager 3 (manager3@example.com) - Role: manager
```

## 🚨 Problèmes Potentiels et Solutions

### ❌ DATABASE_URL non trouvée

**Solution** : Vérifiez que vous avez bien exporté la variable d'environnement

### ❌ Erreur de connexion SSL

**Solution** : Le script détecte automatiquement les connexions de production et utilise SSL

### ❌ Aurélia non trouvée

**Solution** : Le script recherchera aussi par nom si l'email ne correspond pas

### ❌ Rôle "marraine" encore présent

**Solution** : Exécutez le script de migration pour supprimer le rôle :

```bash
DATABASE_URL="..." pnpm db:remove-marraine
```

## 🔍 Vérifications Supplémentaires

### Vérifier les Logs Render

1. **Service Backend** sur Render
2. **Onglet "Logs"** pour voir les logs de démarrage
3. Recherchez les messages de migration de base de données

### Vérifier via API

Si le backend est accessible, vous pouvez aussi vérifier via l'API :

```bash
# Vérifier la santé de l'API
curl https://htf-sunup-backend.onrender.com/api/health

# Vérifier les utilisateurs (si endpoint public disponible)
curl https://htf-sunup-backend.onrender.com/api/users
```

## 📝 Rapport de Vérification

Après exécution, documentez les résultats :

- [ ] ✅ Aurélia trouvée avec rôle "manager"
- [ ] ✅ Aucun utilisateur avec rôle "marraine"
- [ ] ✅ Hiérarchie des managers correcte
- [ ] ✅ Aurélia a des managers comme subordonnés
- [ ] ✅ Distribution des rôles cohérente

## 🛠️ Commandes Utiles

```bash
# Vérifier la version de Node.js
node --version

# Vérifier les dépendances
pnpm install

# Test de connexion simple
DATABASE_URL="..." node -e "console.log('Connection string loaded:', process.env.DATABASE_URL ? 'OK' : 'MISSING')"
```

---

⚠️ **IMPORTANT** : Ne jamais commiter les credentials de production dans le repository. Utilisez toujours des variables d'environnement ou des fichiers .env temporaires.
