# Guide de Suppression des Campagnes Archivées

Ce guide explique comment utiliser les scripts pour supprimer en toute sécurité les campagnes archivées et toutes leurs données associées.

## 📋 **Scripts Disponibles**

### 1. **Script SQL Direct** - `apps/backend/src/db/delete-archived-campaigns.sql`

- Script SQL pur pour exécution manuelle
- Contrôle total sur chaque étape
- Parfait pour les administrateurs de base de données

### 2. **Script Node.js Sécurisé** - `apps/backend/src/db/delete-archived-campaigns.ts`

- Interface interactive avec confirmations
- Mode dry-run par défaut
- Statistiques détaillées et vérifications

## 🚀 **Utilisation du Script Node.js (Recommandé)**

### **Étape 1 : Mode Dry-Run (Simulation)**

```bash
# Naviguez vers le répertoire backend
cd apps/backend

# Exécutez en mode dry-run (aucune suppression)
node src/db/delete-archived-campaigns.ts
```

**Ce que fait le dry-run :**

- ✅ Analyse les campagnes archivées
- ✅ Compte tous les éléments qui seraient supprimés
- ✅ Affiche un résumé détaillé
- ❌ N'effectue AUCUNE suppression

**Exemple de sortie :**

```
📊 Résumé des suppressions prévues:
   🎯 Campagnes archivées: 2
   🏆 Défis: 15
   ⚡ Actions: 90
   👤 Actions utilisateur: 245
   💰 Bonus quotidiens: 67
   📸 Preuves: 312
   ⚙️  Configurations bonus: 2

✅ DRY RUN terminé. 731 éléments seraient supprimés.
```

### **Étape 2 : Sauvegarde de la Base de Données**

**OBLIGATOIRE avant toute suppression !**

```bash
# Sauvegarde PostgreSQL
pg_dump -h localhost -U postgres -d htf_sunup_db > backup_before_cleanup_$(date +%Y%m%d_%H%M%S).sql

# Ou si vous utilisez Docker
docker exec -t $(docker ps -qf "name=postgres") pg_dump -U postgres htf_sunup_db > backup_before_cleanup_$(date +%Y%m%d_%H%M%S).sql
```

### **Étape 3 : Exécution Réelle**

```bash
# Définir la confirmation (sécurité supplémentaire)
export DELETE_CONFIRMATION="SUPPRIMER LES CAMPAGNES ARCHIVEES"

# Exécuter la suppression réelle
node src/db/delete-archived-campaigns.ts --execute
```

**Le script va :**

1. 🔍 Réanalyser les données à supprimer
2. ⚠️ Demander une confirmation explicite
3. 🗑️ Supprimer dans l'ordre correct des contraintes
4. ✅ Vérifier que tout a été supprimé

## 🔧 **Utilisation du Script SQL Direct**

### **Étape 1 : Connexion à la Base de Données**

```bash
# Connexion locale
psql -h localhost -U postgres -d htf_sunup_db

# Ou via Docker
docker exec -it $(docker ps -qf "name=postgres") psql -U postgres -d htf_sunup_db
```

### **Étape 2 : Analyse Préliminaire**

```sql
-- Copiez et exécutez la section "Étape 0" du script SQL
-- Cela vous montrera ce qui sera supprimé
```

### **Étape 3 : Suppression (Décommentez les Sections)**

```sql
-- Option A : Suppression par étapes (recommandé)
-- Décommentez et exécutez chaque section une par une

-- Option B : Suppression en une transaction
BEGIN;
-- Décommentez toutes les sections de suppression
-- Si tout va bien : COMMIT;
-- En cas de problème : ROLLBACK;
```

## ⚠️ **Précautions Importantes**

### **Avant Suppression**

1. **Sauvegarde obligatoire** - Créez TOUJOURS une sauvegarde complète
2. **Arrêt de l'application** - Assurez-vous qu'aucun utilisateur n'utilise l'app
3. **Vérification des campagnes** - Confirmez que seules les bonnes campagnes sont archivées
4. **Mode maintenance** - Activez le mode maintenance si possible

### **Données Affectées**

- 🎯 **Campagnes archivées** et toutes leurs données
- 🏆 **Défis** de ces campagnes
- ⚡ **Actions** de ces défis
- 👤 **Actions utilisateur** (historique de participation)
- 💰 **Bonus quotidiens** déclarés sur ces campagnes
- 📸 **Preuves** associées (fichiers dans S3/stockage externe NON supprimés)
- ⚙️ **Configurations** de bonus

### **Ce qui N'est PAS Supprimé**

- ✅ **Utilisateurs** (comptes préservés)
- ✅ **Campagnes actives** (non archivées)
- ✅ **Fichiers de preuves** dans le stockage externe (S3, etc.)
- ✅ **Logs** et données d'audit

## 🔍 **Vérifications Post-Suppression**

### **Vérification Automatique**

Le script Node.js effectue automatiquement :

- Comptage des campagnes archivées restantes
- Détection d'éventuelles données orphelines

### **Vérifications Manuelles**

```sql
-- Vérifier qu'il n'y a plus de campagnes archivées
SELECT COUNT(*) FROM campaigns WHERE archived = true;

-- Vérifier l'absence de données orphelines
SELECT
    'Défis orphelins' as type,
    COUNT(*) as count
FROM challenges c
LEFT JOIN campaigns cam ON c.campaign_id = cam.id
WHERE cam.id IS NULL;

-- Vérifier l'intégrité générale
SELECT
    table_name,
    COUNT(*) as records
FROM (
    SELECT 'campaigns' as table_name, COUNT(*) FROM campaigns
    UNION ALL
    SELECT 'challenges', COUNT(*) FROM challenges
    UNION ALL
    SELECT 'actions', COUNT(*) FROM actions
    UNION ALL
    SELECT 'user_actions', COUNT(*) FROM user_actions
    UNION ALL
    SELECT 'daily_bonus', COUNT(*) FROM daily_bonus
    UNION ALL
    SELECT 'proofs', COUNT(*) FROM proofs
) as counts;
```

## 🆘 **Procédure de Restauration d'Urgence**

Si vous devez restaurer après une suppression :

### **Méthode 1 : Restauration Complète**

```bash
# Arrêter l'application
docker-compose down

# Restaurer la base de données
psql -h localhost -U postgres -d htf_sunup_db < backup_before_cleanup_YYYYMMDD_HHMMSS.sql

# Redémarrer l'application
docker-compose up -d
```

### **Méthode 2 : Restauration Sélective**

Si vous avez une sauvegarde partielle ou des données dans un autre environnement :

1. Identifiez les données perdues
2. Exportez-les depuis l'environnement source
3. Importez-les dans l'environnement de production
4. Vérifiez l'intégrité des relations

## 📝 **Checklist de Suppression**

### **Avant de Commencer**

- [ ] Sauvegarde de la base de données créée
- [ ] Application en mode maintenance
- [ ] Utilisateurs notifiés (si nécessaire)
- [ ] Campagnes à supprimer identifiées et confirmées

### **Exécution**

- [ ] Dry-run exécuté et résultats vérifiés
- [ ] Confirmation de suppression comprise et acceptée
- [ ] Script d'exécution lancé avec succès
- [ ] Vérifications post-suppression effectuées

### **Après Suppression**

- [ ] Application redémarrée
- [ ] Tests fonctionnels sur les campagnes restantes
- [ ] Utilisateurs informés de la fin de maintenance
- [ ] Sauvegarde post-suppression créée (optionnel)

## 🎯 **Cas d'Usage Typiques**

### **Nettoyage Périodique**

- Suppression des campagnes de test anciennes
- Archivage des campagnes terminées depuis longtemps
- Optimisation de la base de données

### **Migration de Données**

- Nettoyage avant migration vers un nouvel environnement
- Réduction de la taille de la base pour export

### **Maintenance de Performance**

- Suppression de données obsolètes pour améliorer les performances
- Réduction de la charge sur les sauvegardes

## 📞 **Support et Dépannage**

En cas de problème :

1. **Arrêtez immédiatement** le script si une erreur survient
2. **Consultez les logs** pour identifier le problème
3. **Restaurez depuis la sauvegarde** si nécessaire
4. **Analysez la cause** avant de retenter

**Logs importants à vérifier :**

- Logs de l'application (NestJS)
- Logs de la base de données PostgreSQL
- Logs du script de suppression
