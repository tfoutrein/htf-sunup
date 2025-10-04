# 🔒 Guide de Vérification Production - SÉCURITÉ MAXIMALE

**⚠️ ATTENTION : Base de données avec utilisateurs réels**
**❌ PAS DE SEED - PAS DE MODIFICATION - VÉRIFICATION UNIQUEMENT**

---

## 🎯 Objectif

Vérifier l'état de la base de données de production et préparer l'application sécurisée des migrations de performance **SANS RIEN CASSER**.

---

## 📋 Prérequis

- [ ] Accès à la base de données de production (lecture seule pour vérification)
- [ ] Variables d'environnement de production
- [ ] Droits de backup
- [ ] Temps de maintenance planifié (optionnel)

---

## ⚠️ RÈGLES DE SÉCURITÉ

### ❌ INTERDIT

1. **PAS DE SEED** - Les utilisateurs réels existent déjà
2. **PAS DE TRUNCATE** - Ne pas vider les tables
3. **PAS DE DROP** - Ne pas supprimer de tables
4. **PAS DE DELETE** - Ne pas supprimer de données
5. **PAS DE UPDATE** - Ne pas modifier les données utilisateur

### ✅ AUTORISÉ (après backup)

1. **CREATE INDEX IF NOT EXISTS** - Création d'indexes (non destructif)
2. **ALTER TABLE ADD COLUMN** - Ajout de colonnes (non destructif)
3. **INSERT INTO drizzle.\_\_drizzle_migrations** - Tracking des migrations

---

## 📊 Phase 1 - Vérification READ-ONLY (10 minutes)

### Étape 1.1 : Connexion à la Production

```bash
# Se connecter à la base de production
# Remplacer par votre DATABASE_URL de production
export PROD_DB_URL="postgresql://user:password@host:5432/htf_sunup_db"

# Test de connexion (READ-ONLY)
psql $PROD_DB_URL -c "SELECT version();"
```

**✅ Attendu :** Version PostgreSQL affichée

---

### Étape 1.2 : Vérifier les Utilisateurs Existants

```bash
# Compter les utilisateurs réels
psql $PROD_DB_URL -c "
SELECT
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
"
```

**✅ Attendu :** Affichage des comptages par rôle

**📝 Noter :**

- Nombre de managers : **\_**
- Nombre de FBOs : **\_**
- Nombre total : **\_**

---

### Étape 1.3 : Vérifier le Système de Migrations Drizzle

```bash
# Vérifier si le schema drizzle existe
psql $PROD_DB_URL -c "
SELECT EXISTS (
  SELECT FROM pg_namespace
  WHERE nspname = 'drizzle'
);
"
```

**Résultat Possible :**

#### Cas A : `drizzle` schema existe ✅

```bash
# Lister les migrations appliquées
psql $PROD_DB_URL -c "
SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
ORDER BY created_at;
"
```

**📝 Noter :** Nombre de migrations : **\_**

#### Cas B : `drizzle` schema n'existe PAS ⚠️

```bash
# La base a été créée avec l'ancien migrate.ts (SQL manuel)
# On devra faire un "baseline" avant d'appliquer les nouvelles migrations
```

**📝 Noter :** Schema drizzle absent - Baseline nécessaire

---

### Étape 1.4 : Vérifier les Indexes Actuels

```bash
# Compter les indexes de performance existants
psql $PROD_DB_URL -c "
SELECT
  COUNT(*) as total_indexes,
  COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as performance_indexes
FROM pg_indexes
WHERE schemaname = 'public';
"
```

**📝 Noter :**

- Total indexes : **\_**
- Performance indexes (idx\_\*) : **\_**

---

### Étape 1.5 : Vérifier le Schéma de Tables

```bash
# Lister toutes les tables
psql $PROD_DB_URL -c "
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND table_schema = 'public') as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
"
```

**✅ Attendu :** Liste de ~11 tables principales

**📝 Vérifier la présence de :**

- [ ] users
- [ ] campaigns
- [ ] challenges
- [ ] actions
- [ ] user_actions
- [ ] daily_bonus
- [ ] proofs
- [ ] campaign_validations
- [ ] app_versions
- [ ] user_version_tracking
- [ ] campaign_bonus_config

---

## 🗄️ Phase 2 - Backup OBLIGATOIRE (5-10 minutes)

### Étape 2.1 : Créer un Backup Complet

```bash
# Créer un dossier backups
mkdir -p backups

# Backup complet avec timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/htf_sunup_prod_backup_${TIMESTAMP}.sql"

# Dump de la base complète
pg_dump $PROD_DB_URL > $BACKUP_FILE

# Vérifier la taille du backup
ls -lh $BACKUP_FILE
```

**✅ Attendu :** Fichier .sql créé avec taille > 0

**📝 Noter :**

- Fichier backup : **********\_**********
- Taille : **\_**
- Date : **\_**

---

### Étape 2.2 : Vérifier l'Intégrité du Backup

```bash
# Vérifier que le backup contient bien les données
grep -c "COPY public.users" $BACKUP_FILE
grep -c "COPY public.campaigns" $BACKUP_FILE
grep -c "COPY public.challenges" $BACKUP_FILE
```

**✅ Attendu :** Toutes les commandes retournent >= 1

---

### Étape 2.3 : Sauvegarder le Backup (CRITIQUE)

```bash
# Option 1 : Copier sur un autre serveur
scp $BACKUP_FILE user@backup-server:/backups/

# Option 2 : Upload vers S3/Cloud Storage
# aws s3 cp $BACKUP_FILE s3://your-bucket/backups/

# Option 3 : Copier localement
cp $BACKUP_FILE ~/safe-backups/
```

**✅ Attendu :** Backup sécurisé en 2 endroits minimum

---

## 🔍 Phase 3 - Analyse des Migrations à Appliquer (5 minutes)

### Étape 3.1 : Lister les Migrations Locales

```bash
# Depuis le projet
cd apps/backend
ls -la drizzle/

# Lister les fichiers de migration
ls -1 drizzle/*.sql
```

**✅ Attendu :** 12 fichiers de migration (0000 à 0011)

---

### Étape 3.2 : Examiner la Migration d'Indexes

```bash
# Voir le contenu de la migration des indexes
cat drizzle/0011_add_performance_indexes.sql | head -50
```

**✅ Vérifier :**

- [ ] Toutes les instructions sont `CREATE INDEX IF NOT EXISTS`
- [ ] Aucun `DROP`, `DELETE`, `TRUNCATE`
- [ ] Uniquement des `CREATE INDEX` et `ANALYZE`

---

### Étape 3.3 : Comparer avec l'État Actuel

```bash
# Vérifier quelles migrations sont déjà appliquées
# Si le schema drizzle existe :
psql $PROD_DB_URL -c "
SELECT
  id,
  hash,
  created_at
FROM drizzle.__drizzle_migrations
ORDER BY id;
"

# Comparer avec les fichiers locaux
ls -1 drizzle/*.sql | wc -l
```

**📝 Analyse :**

- Migrations en prod : **\_**
- Migrations en local : **\_**
- Migrations à appliquer : **\_**

---

## 🚨 Phase 4 - Décision Go/No-Go

### Checklist de Validation

- [ ] ✅ Backup créé et sécurisé en 2+ endroits
- [ ] ✅ Nombre d'utilisateurs réels confirmé
- [ ] ✅ Schema drizzle présent OU baseline possible
- [ ] ✅ Migrations examinées - aucune instruction destructive
- [ ] ✅ Accès superuser à la DB (pour CREATE INDEX)
- [ ] ✅ Temps de maintenance alloué (optionnel)
- [ ] ✅ Plan de rollback prêt

### Critères Go/No-Go

**🟢 GO - Appliquer les Migrations**

Si TOUTES ces conditions sont remplies :

- ✅ Backup OK
- ✅ Migrations non-destructives
- ✅ Drizzle tracking OK ou baseline possible
- ✅ Utilisateurs réels intacts

**🔴 NO-GO - Reporter**

Si UNE SEULE de ces conditions :

- ❌ Pas de backup
- ❌ Instructions SQL suspectes
- ❌ Incertitude sur l'état de la DB
- ❌ Pas de plan de rollback

---

## 🎯 Phase 5 - Application des Migrations (15 minutes)

**⚠️ NE PAS EXÉCUTER SANS BACKUP ET VALIDATION**

### Scénario A : Schema Drizzle Existe Déjà

```bash
cd apps/backend

# Vérifier que DATABASE_URL pointe vers production
echo $DATABASE_URL

# Dry-run (vérification)
pnpm db:deploy --dry-run

# Application réelle (APRÈS validation)
pnpm db:deploy
```

### Scénario B : Schema Drizzle Manquant (Baseline Requis)

```bash
# 1. Créer le schema drizzle
psql $PROD_DB_URL -c "CREATE SCHEMA IF NOT EXISTS drizzle;"

# 2. Créer la table de tracking
psql $PROD_DB_URL -c "
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
"

# 3. Insérer les migrations 0000-0010 comme "déjà appliquées"
# (car les tables existent déjà via l'ancien migrate.ts)
cd apps/backend

# Lister les migrations à "baséliner"
for i in {0000..0010}; do
  MIGRATION_FILE="drizzle/${i}_*.sql"
  if [ -f $MIGRATION_FILE ]; then
    echo "Baseline: $MIGRATION_FILE"
  fi
done

# Générer les INSERT statements (à adapter)
# ATTENTION : Vérifier les hash dans drizzle/meta/*.json
```

**⚠️ Important :** Le baseline est délicat. Si nécessaire, demander assistance.

---

### Scénario C : Appliquer Uniquement la Migration 0011 (Indexes)

Si les migrations 0000-0010 sont déjà en base via l'ancien système :

```bash
# Application manuelle de la migration d'indexes UNIQUEMENT
psql $PROD_DB_URL -f apps/backend/drizzle/0011_add_performance_indexes.sql

# Puis enregistrer dans Drizzle
# (si schema drizzle existe)
psql $PROD_DB_URL -c "
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at)
VALUES (11, '<hash_de_0011>', EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT DO NOTHING;
"
```

---

## ✅ Phase 6 - Validation Post-Migration (10 minutes)

### Étape 6.1 : Vérifier les Indexes Créés

```bash
# Compter les nouveaux indexes
psql $PROD_DB_URL -c "
SELECT COUNT(*) as performance_indexes
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';
"
```

**✅ Attendu :** 43 indexes de performance

---

### Étape 6.2 : Vérifier les Utilisateurs (Inchangés)

```bash
# VÉRIFIER que les utilisateurs sont INTACTS
psql $PROD_DB_URL -c "
SELECT
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
"
```

**✅ Attendu :** Les MÊMES nombres qu'en Phase 1.2

**🚨 ALERTE :** Si les nombres diffèrent → ROLLBACK IMMÉDIAT

---

### Étape 6.3 : Tester les Endpoints API

```bash
# Tester la connexion à l'API de production
# (avec les vrais credentials de prod)
curl -X POST https://your-prod-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"real-user@example.com","password":"real-password"}'

# Récupérer un token
export PROD_TOKEN="<token_obtenu>"

# Tester quelques endpoints
curl -H "Authorization: Bearer $PROD_TOKEN" \
  https://your-prod-api.com/api/users/all-members

curl -H "Authorization: Bearer $PROD_TOKEN" \
  https://your-prod-api.com/api/campaigns
```

**✅ Attendu :**

- Status 200 sur tous les endpoints
- Temps de réponse < 100ms (amélioration attendue)
- Données cohérentes

---

### Étape 6.4 : Vérifier les Performances

```bash
# Mesurer le temps de réponse
time curl -H "Authorization: Bearer $PROD_TOKEN" \
  https://your-prod-api.com/api/users/all-members
```

**✅ Attendu :** Temps < 100ms (vs potentiellement 800ms+ avant)

---

## 🔄 Plan de Rollback (EN CAS DE PROBLÈME)

### Rollback Complet

```bash
# 1. Arrêter l'API backend
docker-compose stop backend

# 2. Restaurer le backup
BACKUP_FILE="backups/htf_sunup_prod_backup_YYYYMMDD_HHMMSS.sql"

# 3. Drop + Recréer la base
psql $PROD_DB_URL -c "DROP DATABASE htf_sunup_db;"
psql $PROD_DB_URL -c "CREATE DATABASE htf_sunup_db;"

# 4. Restaurer le dump
psql $PROD_DB_URL < $BACKUP_FILE

# 5. Redémarrer l'API
docker-compose start backend

# 6. Vérifier les utilisateurs
psql $PROD_DB_URL -c "SELECT COUNT(*) FROM users;"
```

**⏱️ Durée estimée :** 5-10 minutes

---

### Rollback Partiel (Indexes Seulement)

Si seuls les indexes posent problème :

```bash
# Supprimer les indexes de performance
psql $PROD_DB_URL -c "
DO $$
DECLARE
  idx_name TEXT;
BEGIN
  FOR idx_name IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || idx_name || ';';
  END LOOP;
END $$;
"
```

**⚠️ Note :** Ceci supprime UNIQUEMENT les indexes, pas les données.

---

## 📊 Rapport de Migration

### Template de Rapport

```markdown
# Rapport de Migration Performance - Production

**Date :** ******\_\_\_******
**Exécuté par :** ******\_\_\_******
**Durée totale :** ******\_\_\_****** minutes

## État Avant Migration

- Utilisateurs managers : **\_**
- Utilisateurs FBOs : **\_**
- Total utilisateurs : **\_**
- Indexes existants : **\_**
- Migrations Drizzle : **\_**

## Backup

- Fichier : **********\_**********
- Taille : **\_** MB
- Localisations sécurisées :
  - [ ] ***
  - [ ] ***

## Migrations Appliquées

- [ ] 0011_add_performance_indexes.sql
- [ ] Autres : **********\_**********

## État Après Migration

- Utilisateurs managers : **\_** (doit être identique)
- Utilisateurs FBOs : **\_** (doit être identique)
- Total utilisateurs : **\_** (doit être identique)
- Indexes créés : **\_** (+43 attendus)
- Migrations Drizzle : **\_**

## Tests de Validation

- [ ] Login fonctionnel
- [ ] GET /users/all-members : **\_** ms
- [ ] GET /campaigns : **\_** ms
- [ ] Données cohérentes

## Problèmes Rencontrés

_Aucun_ ou _Décrire_ :

## Décision Finale

- [ ] ✅ Migration réussie - Mise en production
- [ ] ⚠️ Migration réussie avec warnings - Surveillance
- [ ] ❌ Rollback effectué - Analyse requise

## Signatures

**Technique :** ******\_\_\_******
**Validation :** ******\_\_\_******
```

---

## 🎓 Checklist Finale

Avant de considérer la migration comme terminée :

- [ ] Backup créé et sécurisé (minimum 2 endroits)
- [ ] Migrations appliquées sans erreur
- [ ] 43 indexes de performance créés
- [ ] Nombre d'utilisateurs IDENTIQUE avant/après
- [ ] Endpoints API testés et fonctionnels
- [ ] Performance améliorée (< 100ms)
- [ ] Rapport de migration rempli
- [ ] Backup de post-migration créé

---

## 🚨 Contacts d'Urgence

En cas de problème critique :

1. **Rollback immédiat** (voir section Rollback)
2. **Notification équipe**
3. **Analyse des logs**
4. **Investigation post-mortem**

---

**Document créé le :** 4 Octobre 2025  
**Version :** 1.0  
**Statut :** Prêt pour utilisation production
