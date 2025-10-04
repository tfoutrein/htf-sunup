# Guide de Test - Affichage Conditionnel Facebook

Ce guide explique comment tester que le "ou" disparaît bien quand l'authentification Facebook est désactivée.

## 🎯 Problème Résolu

**Avant :** Le "ou" s'affichait même quand le bouton Facebook était masqué, créant une interface incohérente.

**Après :** Le "ou" et le bouton Facebook s'affichent ou se masquent ensemble selon la configuration.

## 🧪 Test Automatisé

### Démarrer le test interactif

```bash
./scripts/test-facebook-ui.sh
```

Ce script vous propose un menu pour :

1. Tester Facebook ACTIVÉ
2. Tester Facebook DÉSACTIVÉ
3. Restaurer la configuration par défaut
4. Vérifier l'état du frontend

## 🔍 Test Manuel

### 1. Prérequis

Assurez-vous que le frontend est démarré :

```bash
npm run front:dev
```

### 2. Test avec Facebook Désactivé

1. **Créer/modifier** `apps/frontend/.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=false
NEXT_PUBLIC_FACEBOOK_APP_ID=disabled-for-testing
```

2. **Redémarrer** le frontend
3. **Visiter** http://localhost:3000/login
4. **Vérifier** :
   - ❌ Pas de bouton "Continuer avec Facebook"
   - ❌ Pas de séparateur "ou"
   - ✅ Interface propre avec seulement le formulaire de connexion

### 3. Test avec Facebook Activé

1. **Modifier** `apps/frontend/.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=true
NEXT_PUBLIC_FACEBOOK_APP_ID=test-app-id
```

2. **Redémarrer** le frontend
3. **Visiter** http://localhost:3000/login
4. **Vérifier** :
   - ✅ Bouton "Continuer avec Facebook" visible
   - ✅ Séparateur "ou" visible
   - ✅ Interface complète avec les deux options de connexion

## 📊 Résultats Attendus

| Configuration                 | Bouton Facebook | Séparateur "ou" | Interface                    |
| ----------------------------- | --------------- | --------------- | ---------------------------- |
| `FACEBOOK_AUTH_ENABLED=true`  | ✅ Visible      | ✅ Visible      | Formulaire + "ou" + Facebook |
| `FACEBOOK_AUTH_ENABLED=false` | ❌ Masqué       | ❌ Masqué       | Formulaire uniquement        |

## 🔄 Code Implémenté

### Import ajouté

```typescript
import { isFacebookAuthEnabled } from '@/utils/facebook';
```

### Section conditionnelle

```typescript
{/* Facebook Login Section - only show if Facebook is enabled */}
{isFacebookAuthEnabled() && (
  <>
    <div className="my-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white/20 text-gray-500">ou</span>
        </div>
      </div>
    </div>

    <FacebookLoginButton
      onSuccess={handleFacebookSuccess}
      onError={handleFacebookError}
      className="w-full"
    />
  </>
)}
```

## 🐛 Dépannage

### Le "ou" s'affiche toujours

- Vérifiez que `NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED=false`
- Redémarrez complètement le frontend
- Vérifiez le cache du navigateur (F5 ou Ctrl+F5)

### Le frontend ne redémarre pas

```bash
# Arrêter les processus
lsof -ti:3000 | xargs kill -9

# Redémarrer
npm run front:dev
```

### Variables d'environnement non prises en compte

- Les variables `NEXT_PUBLIC_*` nécessitent un redémarrage
- Vérifiez que le fichier `.env.local` est dans `apps/frontend/`

## ✅ Checklist de Validation

- [ ] Frontend démarré sur http://localhost:3000
- [ ] Test Facebook désactivé : pas de "ou", pas de bouton
- [ ] Test Facebook activé : "ou" et bouton visibles
- [ ] Interface cohérente dans les deux cas
- [ ] Transitions fluides entre les états

---

💡 **Note** : Cette amélioration garantit une interface utilisateur cohérente selon la configuration Facebook.
