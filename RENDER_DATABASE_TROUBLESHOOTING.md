# Guide de Dépannage Base de Données - Render

## Problème : Table "proofs" manquante

### Symptômes

```
PostgresError: relation "proofs" does not exist
Failed query: select count(*) from "proofs" where "proofs"."daily_bonus_id" = $1
```

### Cause

La migration `0007_busy_veda.sql` qui crée la table `proofs` n'a pas été exécutée correctement en production.

## Solutions

### Solution 1 : Script de Correction Automatique (Recommandé)

1. **Connexion à Render Dashboard**

   - Aller sur render.com
   - Sélectionner le service backend
   - Aller dans l'onglet "Shell"

2. **Exécuter le script de correction**

   ```bash
   cd apps/backend
   npm run render:fix-db
   ```

3. **Vérifier les logs**
   Le script va afficher :
   - ✅ Connection établie
   - ✅ Table créée avec succès
   - ✅ Contraintes ajoutées
   - ✅ Index créés

### Solution 2 : Diagnostic Avancé

1. **Vérifier l'état de la base**

   ```bash
   cd apps/backend
   npm run db:diagnose-production
   ```

2. **Analyser les résultats**
   - Tables manquantes
   - État des migrations Drizzle
   - Structure de la table proofs

### Solution 3 : Correction Manuelle via SQL

Si les scripts automatiques échouent, exécuter directement en SQL :

```sql
-- Créer la table proofs
CREATE TABLE "proofs" (
  "id" serial PRIMARY KEY NOT NULL,
  "url" varchar(500) NOT NULL,
  "type" varchar(50) NOT NULL,
  "original_name" varchar(255) NOT NULL,
  "size" integer NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "user_action_id" integer,
  "daily_bonus_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Ajouter les contraintes
ALTER TABLE "proofs"
ADD CONSTRAINT "proofs_user_action_id_user_actions_id_fk"
FOREIGN KEY ("user_action_id")
REFERENCES "public"."user_actions"("id")
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "proofs"
ADD CONSTRAINT "proofs_daily_bonus_id_daily_bonus_id_fk"
FOREIGN KEY ("daily_bonus_id")
REFERENCES "public"."daily_bonus"("id")
ON DELETE cascade ON UPDATE no action;

-- Créer les index
CREATE INDEX IF NOT EXISTS "idx_proofs_user_action_id"
ON "proofs" ("user_action_id");

CREATE INDEX IF NOT EXISTS "idx_proofs_daily_bonus_id"
ON "proofs" ("daily_bonus_id");
```

## Scripts Disponibles

### Pour Diagnostic

```bash
# Diagnostic complet de la base de données
npm run db:diagnose-production

# Diagnostic spécifique aux preuves (local)
npm run db:diagnose
```

### Pour Correction

```bash
# Correction automatique sur Render
npm run render:fix-db

# Correction avec TypeScript (local/development)
npm run db:fix-proofs-table
```

## Prévention

### 1. Vérifier les Migrations avant Déploiement

```bash
cd apps/backend
npm run db:migrate
npm run build
```

### 2. Tester le Processus de Migration

```bash
# En local
npm run db:deploy
```

### 3. Vérifier les Variables d'Environnement

- `DATABASE_URL` correctement configurée sur Render
- SSL activé pour les connexions externes

## Dépannage Avancé

### Erreurs Communes

#### 1. Connexion SSL Refusée

```
Error: self signed certificate in certificate chain
```

**Solution** : Vérifier la configuration SSL dans les scripts

#### 2. Permissions Insuffisantes

```
Error: permission denied for table
```

**Solution** : Vérifier les droits de l'utilisateur de base de données

#### 3. Contraintes de Clés Étrangères

```
Error: violates foreign key constraint
```

**Solution** : Vérifier l'existence des tables référencées

### Logs Utiles

#### Logs d'Application Render

```bash
# Dans Render Dashboard > Logs
2025-07-06T19:00:35.495Z PostgresError: relation "proofs" does not exist
```

#### Logs de Migration

```bash
🔗 Connecting to database...
✅ Connected to database
❌ proofs table missing - creating now...
✅ Dependencies verified - proceeding with table creation
✅ proofs table created successfully
```

## Contact Support

En cas de problème persistant :

1. **Vérifier les logs Render** dans le dashboard
2. **Exécuter le diagnostic** avec `npm run db:diagnose-production`
3. **Contacter l'équipe** avec les logs d'erreur complets

## Scripts de Maintenance

### Nettoyage (à utiliser avec précaution)

```bash
# Supprimer et recréer la table proofs (DANGER - perte de données)
DROP TABLE IF EXISTS proofs CASCADE;
# Puis réexécuter le script de création
```

### Sauvegarde

```bash
# Exporter les données avant modifications importantes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```
