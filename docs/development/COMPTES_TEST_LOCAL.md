# 🔐 Comptes de Test - Environnement Local

## Mot de passe universel

**Tous les comptes utilisent le même mot de passe en développement local :**

```
password
```

## 👥 Utilisateurs disponibles

### 👑 Marraine (Super Admin)

- **Email :** `aurelia@htf.com`
- **Rôle :** Marraine
- **Description :** Accès complet, gestion de tous les managers et FBO
- **Dashboard :** Vue globale avec statistiques complètes

---

### 📊 Managers

#### Manager 1

- **Email :** `manager1@htf.com`
- **Rôle :** Manager
- **Équipe :** Aucun FBO assigné

#### Manager 2

- **Email :** `manager2@htf.com`
- **Rôle :** Manager
- **Équipe :** FBO 3

#### Manager 3

- **Email :** `manager3@htf.com`
- **Rôle :** Manager
- **Équipe :** FBO 1 et FBO 2

---

### 👤 FBO (Field Business Operators)

#### FBO 1

- **Email :** `fbo1@htf.com`
- **Rôle :** FBO
- **Manager :** Manager 3

#### FBO 2

- **Email :** `fbo2@htf.com`
- **Rôle :** FBO
- **Manager :** Manager 3

#### FBO 3

- **Email :** `fbo3@htf.com`
- **Rôle :** FBO
- **Manager :** Manager 2

---

## 🎯 Connexion rapide

### Depuis l'interface web

1. Ouvrir http://localhost:3000
2. Les boutons de connexion rapide sont affichés en mode développement
3. Cliquer sur "⚡ Direct" pour se connecter instantanément

### Via l'API (curl)

```bash
# Connexion en tant que Marraine
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aurelia@htf.com","password":"password"}'

# Connexion en tant que Manager
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager3@htf.com","password":"password"}'

# Connexion en tant que FBO
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fbo1@htf.com","password":"password"}'
```

---

## 📊 Données de test créées automatiquement

Au démarrage de l'application, les données suivantes sont générées :

- **1 Campagne active** : "Les défis de l'été de la Happy Team"

  - Dates : 07/07/2025 → 31/08/2025
  - Statut : Active
  - Créateur : Manager 1

- **1 Défi du jour** avec 3 actions
- **6 Assignments d'actions** (UserActions)
- **Configuration bonus** :
  - Panier : 2.50€
  - Parrainage : 10.00€
- **5 Bonus journaliers** (avec et sans preuves)
- **3 Versions d'application** (v1.0.0, v1.1.0, v1.2.0)

---

## 🔄 Réinitialisation des données

### Réinitialiser uniquement les données de test

```bash
docker exec htf_sunup_backend sh -c "cd /app/apps/backend && pnpm db:seed"
```

### Réinitialiser complètement la base de données

```bash
# Arrêter les conteneurs
docker-compose down

# Supprimer le volume de la base de données
docker volume rm htf-sunup_postgres_data

# Redémarrer les conteneurs
docker-compose up -d

# Attendre que Postgres soit prêt
sleep 10

# Appliquer les migrations
cd apps/backend
for file in drizzle/*.sql; do
  docker exec -i htf_sunup_postgres psql -U postgres -d htf_sunup_db < "$file"
done

# Recréer les mots de passe
docker exec htf_sunup_backend node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password', 10));"

# Insérer les utilisateurs de test
docker exec -i htf_sunup_postgres psql -U postgres -d htf_sunup_db << 'EOF'
INSERT INTO users (name, email, password, role) VALUES
('Aurelia', 'aurelia@htf.com', '$2a$10$[YOUR_HASH]', 'marraine'),
('Manager 1', 'manager1@htf.com', '$2a$10$[YOUR_HASH]', 'manager'),
('Manager 2', 'manager2@htf.com', '$2a$10$[YOUR_HASH]', 'manager'),
('Manager 3', 'manager3@htf.com', '$2a$10$[YOUR_HASH]', 'manager'),
('FBO 1', 'fbo1@htf.com', '$2a$10$[YOUR_HASH]', 'fbo'),
('FBO 2', 'fbo2@htf.com', '$2a$10$[YOUR_HASH]', 'fbo'),
('FBO 3', 'fbo3@htf.com', '$2a$10$[YOUR_HASH]', 'fbo');
EOF

# Seeding des données
docker exec htf_sunup_backend sh -c "cd /app/apps/backend && pnpm db:seed"

# Redémarrer le backend
docker restart htf_sunup_backend
```

---

## ⚠️ Avertissements de sécurité

1. **Ces comptes sont UNIQUEMENT pour le développement local**
2. Ne jamais utiliser ces mots de passe en production
3. Le mode développement doit être activé (`NODE_ENV=development`)
4. Les boutons de connexion rapide ne s'affichent qu'en mode développement
5. Ce fichier ne doit JAMAIS être commité en production

---

## 🌐 URLs de l'environnement local

- **Frontend :** http://localhost:3000
- **Backend API :** http://localhost:3001
- **Base de données :** `postgresql://postgres:postgres@localhost:5432/htf_sunup_db`
- **API Health :** http://localhost:3001/api/health (si disponible)

---

## 🧪 Scénarios de test recommandés

### Test 1 : Vue Marraine

```
Login: aurelia@htf.com
Tester: Vue d'ensemble, statistiques globales, gestion des équipes
```

### Test 2 : Vue Manager avec équipe

```
Login: manager3@htf.com
Tester: Gestion de FBO 1 et FBO 2, validation des défis, suivi de progression
```

### Test 3 : Vue FBO

```
Login: fbo1@htf.com
Tester: Consultation des défis, soumission de preuves, progression personnelle
```

### Test 4 : Changement de rôle

```
1. Login en tant que FBO 1
2. Logout
3. Login en tant que Manager 3
→ Vérifier que la navigation et les permissions changent correctement
```

---

## 📝 Notes pour le développement

- Les boutons de connexion rapide sur la page de login facilitent les tests
- Le mot de passe `password` est haché avec bcrypt (coût 10)
- Les comptes persistent entre les redémarrages de conteneurs
- Pour changer les comptes, modifier le fichier `apps/backend/src/db/seed.ts`
