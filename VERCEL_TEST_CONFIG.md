# Configuration Vercel pour les tests HTF SunUp

## Variables d'environnement à définir sur Vercel

Pour activer les boutons de test sur Vercel, ajoute ces variables d'environnement dans les paramètres de ton projet Vercel :

### 1. Variable pour activer les boutons de test

```
NEXT_PUBLIC_ENABLE_TEST_BUTTONS=true
```

### 2. API URL (pointe vers ton backend Render)

```
NEXT_PUBLIC_API_URL=https://ton-backend-render.onrender.com
```

## Comment configurer sur Vercel

1. Va sur https://vercel.com/dashboard
2. Sélectionne ton projet HTF SunUp
3. Va dans **Settings** > **Environment Variables**
4. Ajoute les variables ci-dessus

## Comptes de test disponibles

### 👑 Marraine

- **Email**: aurelia@htf.com
- **Password**: password

### 👥 Managers

- **Jéromine**: jeromine@htf.com / password
- **Gaëlle**: gaelle@htf.com / password
- **Audrey**: audrey@htf.com / password

### 🎯 FBOs

- **Marie**: marie@htf.com / password
- **Pierre**: pierre@htf.com / password
- **Sophie**: sophie@htf.com / password

## Types de boutons

Chaque profil a 2 boutons :

- **Bouton gauche**: Remplit automatiquement le formulaire
- **⚡ Direct**: Connexion immédiate

## Désactivation des boutons

Pour désactiver les boutons de test sur Vercel :

- Supprime ou met la variable `NEXT_PUBLIC_ENABLE_TEST_BUTTONS` à `false`
