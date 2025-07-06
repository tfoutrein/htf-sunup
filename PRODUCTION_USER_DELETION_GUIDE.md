# Guide de Suppression d'Utilisateurs en Production

## Problème Identifié

L'erreur de suppression d'utilisateurs provient des contraintes de clés étrangères dans PostgreSQL. Les utilisateurs ne peuvent pas être supprimés s'ils ont des données liées dans d'autres tables.

## Solution Implémentée

### 1. Méthode de Diagnostic

Avant de supprimer un utilisateur, utilisez l'endpoint de diagnostic :

```bash
GET /users/{userId}/dependencies
```

Cet endpoint retourne :

- Nombre d'actions utilisateur liées
- Nombre de bonus quotidiens déclarés
- Nombre de bonus quotidiens reviewés
- Nombre de campagnes créées
- Nombre de membres d'équipe managés

### 2. Suppression Sécurisée

La méthode `remove` a été améliorée pour :

1. **Supprimer les actions utilisateur** complètement
2. **Supprimer les bonus quotidiens** où l'utilisateur est déclarant
3. **Mettre à null les bonus quotidiens** où l'utilisateur est reviewer
4. **Transférer les campagnes** vers le manager principal
5. **Réassigner les membres d'équipe** vers le manager principal

### 3. Logs Détaillés

La suppression affiche maintenant des logs détaillés :

- 🧹 Début du nettoyage
- 📊 Diagnostic des dépendances
- 🗑️ Éléments supprimés
- 🔄 Éléments transférés/mis à jour
- ✅ Confirmation de fin

## Utilisation en Production

### Pour Marie Dupont et Pierre Martin (ID 5)

1. **Diagnostic** (optionnel) :

```bash
curl -X GET "https://votre-api.com/users/5/dependencies" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Suppression** :

```bash
curl -X DELETE "https://votre-api.com/users/5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Vérification des Logs

Surveillez les logs de production pour voir :

- Les dépendances trouvées
- Les actions de nettoyage effectuées
- La confirmation de suppression

## Cas d'Usage

### Utilisateur Standard (FBO)

- Supprime ses actions complétées
- Supprime ses bonus quotidiens
- Met à jour les bonus qu'il a reviewés

### Utilisateur Manager

- Tout ce qui précède +
- Transfère ses campagnes créées
- Réassigne ses membres d'équipe

### Manager Principal

- Devient le propriétaire des campagnes orphelines
- Reçoit les membres d'équipe réassignés

## Prévention Future

1. **Toujours diagnostiquer** avant suppression en production
2. **Vérifier les logs** pour confirmer le nettoyage
3. **Tester d'abord** sur l'environnement de développement

## Rollback

Si un problème survient, les données peuvent être restaurées depuis le backup. Les IDs des éléments transférés sont loggés pour faciliter le rollback.
