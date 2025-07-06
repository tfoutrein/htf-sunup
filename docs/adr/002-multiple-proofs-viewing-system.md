# ADR 002: Système de Visualisation des Preuves Multiples

## Statut

✅ **IMPLÉMENTÉ** - 2024-01-XX

## Contexte

Les utilisateurs FBO et les managers avaient besoin de pouvoir visualiser les preuves attachées aux bonus quotidiens et aux actions de défis. Le système précédent utilisait un champ `proofUrl` unique, mais le nouveau système de preuves multiples stocke les preuves dans une table séparée `proofs`.

### Problème identifié

- Les boutons "Voir preuves" n'apparaissaient plus après la migration vers le système de preuves multiples
- L'ancien code cherchait `bonus.proofUrl` qui n'existe plus
- Besoin d'un système pour naviguer entre plusieurs preuves par bonus/action

## Décision

Nous avons créé un système complet de visualisation des preuves multiples :

### 1. Nouveaux Hooks Spécialisés

#### `useProofs.ts`

- Hook de base pour gérer les preuves multiples
- Fonctions pour récupérer, compter et afficher les preuves
- Support pour les bonus quotidiens et actions utilisateur

#### `useBonusProofs.ts`

- Hook spécialisé pour les bonus avec comptage de preuves
- Enrichissement automatique des bonus avec `proofsCount` et `hasProofs`
- Interface simplifiée pour l'affichage des preuves de bonus

#### `useActionProofs.ts`

- Hook spécialisé pour les actions utilisateur
- Même principe que pour les bonus mais pour les actions
- Support pour les managers visualisant les preuves de leurs équipes

### 2. Composant de Visualisation

#### `MultiProofViewer.tsx`

- Modal pour afficher les preuves avec navigation
- Support images et vidéos
- Navigation entre preuves multiples (Précédent/Suivant)
- Affichage des métadonnées (nom, taille, type, date)

### 3. Intégration Dashboard FBO

- Remplacement de `bonus.proofUrl` par `bonus.hasProofs`
- Boutons "Voir preuves (X)" avec comptage dynamique
- Modal de visualisation intégrée

## Implémentation

### Structure des fichiers

```
apps/frontend/src/
├── hooks/
│   ├── useProofs.ts              # Hook base pour preuves multiples
│   ├── useBonusProofs.ts         # Hook spécialisé bonus
│   └── useActionProofs.ts        # Hook spécialisé actions
├── components/ui/
│   └── MultiProofViewer.tsx      # Composant de visualisation
└── app/fbo/dashboard/page.tsx    # Dashboard FBO mis à jour
```

### API Endpoints utilisés

- `GET /proofs/daily-bonus/:id` - Récupérer preuves d'un bonus
- `GET /proofs/daily-bonus/:id/count` - Compter preuves d'un bonus
- `GET /proofs/user-action/:id` - Récupérer preuves d'une action
- `GET /proofs/user-action/:id/count` - Compter preuves d'une action
- `GET /proofs/:id/signed-url` - URL signée pour affichage sécurisé

### Fonctionnalités

✅ Comptage automatique des preuves par bonus/action
✅ Affichage conditionnel des boutons "Voir preuves"
✅ Navigation entre preuves multiples
✅ Support images et vidéos
✅ URLs signées pour sécurité
✅ Cache des comptages pour performance
✅ Gestion d'erreurs et états de chargement

## Conséquences

### Positives

- Interface utilisateur améliorée pour la visualisation des preuves
- Support complet des preuves multiples
- Performance optimisée avec cache des comptages
- Code modulaire et réutilisable
- Sécurité maintenue avec URLs signées

### À implémenter ensuite

- [ ] Intégration dans les pages manager (team member details)
- [ ] Support pour la suppression de preuves individuelles
- [ ] Prévisualisation des miniatures dans les listes
- [ ] Filtrage par type de preuve (image/vidéo)

## Prochaines étapes

1. **Manager Team Pages** : Intégrer `useActionProofs` et `useBonusProofs` dans les pages de gestion d'équipe
2. **Manager Daily Bonus Page** : Mettre à jour pour utiliser le nouveau système
3. **Tests** : Vérifier le bon fonctionnement sur toutes les pages
4. **Documentation utilisateur** : Mettre à jour les guides d'utilisation

## Notes techniques

### Performance

- Cache des comptages de preuves pour éviter les appels API répétés
- Chargement à la demande des URLs signées
- Pagination possible pour grandes quantités de preuves

### Sécurité

- URLs signées avec expiration (1h)
- Vérification des permissions côté API
- Pas de stockage permanent des URLs

### Compatibilité

- Maintien du hook `useMultipleProofUpload` pour l'upload
- Migration progressive des anciens composants
- Fallback sur données non enrichies en cas d'erreur
