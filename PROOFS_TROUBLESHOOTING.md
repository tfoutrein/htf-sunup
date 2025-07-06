# Guide de Dépannage - Système de Preuves

Ce guide vous aide à diagnostiquer et résoudre les problèmes liés au système de preuves multiples.

## 🚨 Problèmes Courants

### Erreur : "Failed query: select count(\*) from proofs where user_action_id = $1"

Cette erreur peut avoir plusieurs causes :

1. **Table `proofs` manquante** - Les migrations n'ont pas été exécutées
2. **Preuves orphelines** - Références vers des actions utilisateur supprimées
3. **Problèmes de contraintes** - Intégrité des clés étrangères compromise

## 🔧 Outils de Diagnostic

### 1. Script de Diagnostic

Exécutez le script de diagnostic pour identifier les problèmes :

```bash
cd apps/backend
node src/db/diagnose-proofs.ts
```

**Ce que fait ce script :**

- ✅ Vérifie l'existence de la table `proofs`
- 🏗️ Examine la structure de la table
- 🔗 Valide les contraintes de clé étrangère
- 📊 Affiche les statistiques générales
- 🔍 Recherche les preuves orphelines
- 🧪 Teste la requête problématique

### 2. Script de Réparation

Si des problèmes sont détectés, utilisez le script de réparation :

```bash
cd apps/backend
node src/db/fix-proofs-issues.ts
```

**Ce que fait ce script :**

- 🧹 Nettoie les preuves orphelines (mode sécurisé)
- 🔗 Vérifie les URLs invalides
- ⚡ Crée des index manquants pour les performances
- 📊 Met à jour les statistiques de la table
- 🔗 Valide l'intégrité des contraintes

## 🛠️ Solutions par Problème

### Table `proofs` manquante

```bash
cd apps/backend
pnpm db:migrate
```

### Preuves orphelines détectées

1. **Exécuter le diagnostic :**

   ```bash
   node src/db/diagnose-proofs.ts
   ```

2. **Si des orphelines sont trouvées :**
   - Éditez `fix-proofs-issues.ts`
   - Décommentez les lignes de suppression
   - Exécutez le script de réparation

### Problèmes de performances

Le script de réparation crée automatiquement ces index :

- `idx_proofs_user_action_id`
- `idx_proofs_daily_bonus_id`
- `idx_proofs_created_at`

## 🔄 Gestion d'Erreur Améliorée

Le service des preuves a été amélioré avec :

### Logs de Debug

```
🎯 [ProofsService] Adding proof to userActionId: 24
🔍 [ProofsService] Checking if userAction 24 exists...
✅ [ProofsService] UserAction 24 exists: {...}
📊 [ProofsService] Checking proof count for userActionId: 24
📊 [ProofsService] Current proof count: 2/5
✅ [ProofsService] Proof count OK (2/5), proceeding with upload...
```

### Fallback Robuste

- Si le comptage échoue, retourne 0 au lieu de planter
- Logs détaillés des erreurs pour le debugging
- Validation préalable de l'existence des entités

## 🚀 Commandes de Maintenance

### Diagnostic Rapide

```bash
# Vérifier l'état général du système
cd apps/backend && node src/db/diagnose-proofs.ts
```

### Réparation Complète

```bash
# Nettoyer et optimiser
cd apps/backend && node src/db/fix-proofs-issues.ts
```

### Migrations

```bash
# Appliquer les migrations manquantes
cd apps/backend && pnpm db:migrate
```

### Reset Complet (DEV SEULEMENT)

```bash
# ⚠️ ATTENTION : Supprime toutes les données
cd apps/backend && pnpm db:reset
```

## 📋 Checklist de Résolution

### Étape 1 : Diagnostic

- [ ] Table `proofs` existe
- [ ] Structure de table correcte
- [ ] Contraintes de clé étrangère valides
- [ ] Pas de preuves orphelines

### Étape 2 : Réparation

- [ ] Nettoyage des données corrompues
- [ ] Création des index manquants
- [ ] Mise à jour des statistiques

### Étape 3 : Validation

- [ ] Test de la requête problématique
- [ ] Vérification des logs applicatifs
- [ ] Test d'ajout de nouvelles preuves

## 🔐 Mode Sécurisé

Les scripts de réparation fonctionnent en **mode sécurisé** par défaut :

- **Logs seulement** - Pas de suppression automatique
- **Confirmation requise** - Pour les opérations destructives
- **Sauvegarde recommandée** - Avant toute réparation

## 📞 Support

Si les problèmes persistent :

1. **Vérifiez les logs** - Consultez les logs Docker
2. **Mode debug** - Activez les logs détaillés
3. **Sauvegarde DB** - Créez un dump avant réparation
4. **Test local** - Reproduisez en local si possible

## 🎯 Prévention

### Monitoring

- Surveillez les logs d'erreur de ProofsService
- Alertes sur les échecs de requêtes COUNT
- Métriques de performance des uploads

### Maintenance

- Exécutez le diagnostic hebdomadairement
- Nettoyage mensuel des preuves orphelines
- Mise à jour régulière des statistiques DB

---

💡 **Astuce :** En cas de doute, toujours exécuter le diagnostic avant toute action corrective.
