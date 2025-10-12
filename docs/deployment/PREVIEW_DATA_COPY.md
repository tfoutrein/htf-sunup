# Copie des données de production vers les previews

## 🎯 Objectif

Les environnements de preview Render copient automatiquement les données de production pour permettre des tests iso-prod avant déploiement.

## 🔧 Fonctionnement

### Déclenchement automatique

Le script `copy-prod-to-preview.ts` s'exécute **automatiquement** lors de la **première création** d'un preview environment grâce au `initialDeployHook` configuré dans `render.yaml`.

### Processus de copie

1. **Création du preview** : Render crée un nouveau service et une nouvelle base de données vierge
2. **Migrations** : Les migrations Drizzle créent toutes les tables
3. **initialDeployHook** : Le script de copie s'exécute automatiquement
4. **Copie des données** : Toutes les tables sont copiées de prod vers preview
5. **Preview prêt** : L'environnement contient maintenant les données de production

### Tables copiées (dans l'ordre)

1. `users`
2. `campaigns`
3. `actions`
4. `challenges`
5. `campaign_bonus_config`
6. `campaign_unlock_conditions`
7. `campaign_validation_conditions`
8. `campaign_validations`
9. `user_actions`
10. `daily_bonus`
11. `proofs`
12. `user_version_tracking`
13. `app_versions`

## 📝 Configuration

### render.yaml

```yaml
services:
  - type: web
    name: htf-sunup-backend
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: htf-sunup-postgres
          property: connectionString
      - key: PRODUCTION_DATABASE_URL
        fromDatabase:
          name: htf-sunup-postgres # Pointe vers la prod
          property: connectionString
    initialDeployHook: cd apps/backend && pnpm preview:copy-prod:prod
```

### Variables d'environnement

| Variable                  | Preview            | Production         | Description                 |
| ------------------------- | ------------------ | ------------------ | --------------------------- |
| `DATABASE_URL`            | Base de preview    | Base de production | Base de données cible       |
| `PRODUCTION_DATABASE_URL` | Base de production | Base de production | Source des données à copier |

## ⚠️ Considérations importantes

### 1. Données sensibles

**⚠️ RGPD / Données personnelles**

Les données de production contiennent des informations personnelles réelles :

- Emails des utilisateurs
- Tokens Facebook
- Photos de preuve
- Données d'utilisation

**Recommandations** :

- Ajouter une anonymisation dans le script si nécessaire
- Limiter l'accès aux previews aux personnes autorisées
- Configurer l'expiration automatique (`expireAfterDays: 1`)

### 2. Performance et coût

- **Temps de copie** : Dépend de la taille de la base (~30s à 2min)
- **Coût** : Les bases de preview sont facturées (plan `basic-256mb`)
- **Expiration** : Configurée à 1 jour pour limiter les coûts
- **Stockage S3** : Les previews partagent le même bucket S3 que la prod

### 3. Taille des données

Si la base de production devient très volumineuse :

- Envisager de ne copier qu'un échantillon de données
- Filtrer les données anciennes
- Utiliser un plan preview plus petit si possible

## 🔒 Anonymisation (optionnel)

Pour anonymiser les données sensibles, modifiez le script `copy-prod-to-preview.ts` :

```typescript
// Après la copie des données
await previewSql`
  -- Anonymiser les emails
  UPDATE users 
  SET email = 'test_' || id || '@preview.local'
  WHERE email NOT LIKE '%@example.com'
`;

await previewSql`
  -- Supprimer les tokens Facebook
  UPDATE users 
  SET facebook_id = NULL, 
      facebook_access_token = NULL
`;
```

## 🚀 Exécution manuelle

Pour tester le script localement ou l'exécuter manuellement :

```bash
# En local (avec connexions configurées)
cd apps/backend
pnpm preview:copy-prod

# En production (compilé)
pnpm preview:copy-prod:prod
```

## 📊 Monitoring

Les logs du script affichent :

- ✅ Nombre de lignes copiées par table
- ✅ Total de lignes copiées
- ✅ Résumé des données copiées
- ❌ Erreurs éventuelles (mais la copie continue)

## 🐛 Troubleshooting

### Le script ne s'exécute pas

1. Vérifier que `initialDeployHook` est bien dans `render.yaml`
2. Vérifier que le script est compilé dans `dist/`
3. Regarder les logs Render du déploiement

### Erreur "PRODUCTION_DATABASE_URL non définie"

La variable doit être configurée dans le service :

- En preview : pointe automatiquement vers la base de prod
- En prod : inutilisée (le script ne s'exécute pas)

### Timeout ou erreur de connexion

- Augmenter les timeouts dans le script
- Vérifier que les IP rules autorisent les connexions inter-services

### Données non copiées

- Vérifier l'ordre des tables (contraintes FK)
- Regarder les logs pour voir quelle table a échoué
- Le script continue même si une table échoue

## 📚 Références

- [Render Preview Environments](https://render.com/docs/preview-environments)
- [initialDeployHook Documentation](https://render.com/docs/preview-environments#preview-environment-initialization)
- [Script source](../../apps/backend/src/db/copy-prod-to-preview.ts)
