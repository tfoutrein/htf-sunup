# Comptes de Test - HTF Sunup (Développement Local)

## 🔐 Mot de passe universel

**Tous les comptes utilisent le même mot de passe en développement :**

```
password
```

## 👥 Utilisateurs disponibles

### 👑 Marraine (Super Admin)

- **Email :** `aurelia@htf.com`
- **Mot de passe :** `password`
- **Rôle :** Marraine
- **Permissions :** Accès complet, gestion de tous les managers et FBO

---

### 📊 Managers

#### Manager 1

- **Email :** `manager1@htf.com`
- **Mot de passe :** `password`
- **Rôle :** Manager
- **Équipe :** Pas de FBO assignés

#### Manager 2

- **Email :** `manager2@htf.com`
- **Mot de passe :** `password`
- **Rôle :** Manager
- **Équipe :** Pas de FBO assignés

#### Manager 3

- **Email :** `manager3@htf.com`
- **Mot de passe :** `password`
- **Rôle :** Manager
- **Équipe :** FBO 1 et FBO 2

---

### 👤 FBO (Field Business Operators)

#### FBO 1

- **Email :** `fbo1@htf.com`
- **Mot de passe :** `password`
- **Rôle :** FBO
- **Manager :** Manager 3

#### FBO 2

- **Email :** `fbo2@htf.com`
- **Mot de passe :** `password`
- **Rôle :** FBO
- **Manager :** Manager 3

#### FBO 3

- **Email :** `fbo3@htf.com`
- **Mot de passe :** `password`
- **Rôle :** FBO
- **Manager :** Manager 2 (ID: 4)

---

## 🎯 Scénarios de test

### Tester le dashboard Marraine

```
Email: aurelia@htf.com
Password: password
```

→ Accès à la vue globale, gestion des managers

### Tester le dashboard Manager

```
Email: manager3@htf.com
Password: password
```

→ Vue de l'équipe (FBO 1 et FBO 2), validation des actions

### Tester le dashboard FBO

```
Email: fbo1@htf.com
Password: password
```

→ Vue des défis quotidiens, soumission de preuves

---

## 📋 Données de test créées

- **1 Campagne active :** "Les défis de l'été de la Happy Team"

  - Date début : 07/07/2025
  - Date fin : 31/08/2025
  - Créée par : Manager 1

- **1 Défi du jour :** Défi de la date courante

  - 3 actions assignées
  - 6 UserActions (assignments)

- **Configuration bonus :**

  - Panier : 2.50€
  - Parrainage : 10.00€

- **5 Bonus journaliers :** Avec et sans preuves

- **3 Versions d'application :** v1.0.0, v1.1.0, v1.2.0

---

## 🔄 Réinitialiser les données

Si vous voulez réinitialiser les données de test :

```bash
# Depuis le répertoire backend
docker exec htf_sunup_backend sh -c "cd /app/apps/backend && pnpm db:seed"
```

---

## ⚠️ Important

**Ces comptes sont uniquement pour le développement local !**

- Ne jamais utiliser ces mots de passe en production
- Le fichier `.env` doit contenir `NODE_ENV=development`
- Ces comptes sont automatiquement créés lors du seeding

---

## 🌐 URLs de l'application

- **Frontend :** http://localhost:3000
- **Backend API :** http://localhost:3001
- **Base de données :** postgresql://postgres:postgres@localhost:5432/htf_sunup_db
