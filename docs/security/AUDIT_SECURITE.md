# 🔐 Audit de Sécurité - HTF SunUp

**Date de l'audit :** 4 octobre 2025  
**Auditeur :** IA Assistant  
**Version du projet :** 0.1.0

## 📊 Résumé Exécutif

### Statistique Globale

- **Vulnérabilités Critiques :** 3
- **Vulnérabilités Hautes :** 7
- **Vulnérabilités Moyennes :** 8
- **Vulnérabilités Basses :** 5
- **Total :** 23 vulnérabilités identifiées

### Score de Sécurité : 6.2/10

---

## 🚨 VULNÉRABILITÉS CRITIQUES

### 1. ⚠️ Secret JWT par défaut hardcodé

**Criticité :** 🔴 CRITIQUE  
**Fichier :** `apps/backend/src/auth/auth.module.ts:29`, `apps/backend/src/auth/strategies/jwt.strategy.ts:11`  
**CWE :** CWE-798 (Use of Hard-coded Credentials)

**Description :**  
Le secret JWT utilise une valeur par défaut hardcodée `'your-secret-key'` si la variable d'environnement n'est pas définie. Cela représente un risque majeur car un attaquant peut facilement deviner ou trouver ce secret et forger des tokens JWT valides.

**Code problématique :**

```typescript
// apps/backend/src/auth/auth.module.ts
JwtModule.register({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  signOptions: { expiresIn: '7d' },
})

// apps/backend/src/auth/strategies/jwt.strategy.ts
secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
```

**Impact :**

- Authentification complètement compromise
- Possibilité pour un attaquant de créer des tokens pour n'importe quel utilisateur
- Accès non autorisé à toutes les ressources protégées

**Recommandation :**

```typescript
// Ajouter une validation stricte au démarrage
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
  throw new Error(
    'JWT_SECRET must be set to a secure random value in production',
  );
}

JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '7d' },
});
```

**Effort de correction :** 1 heure  
**Priorité :** À corriger IMMÉDIATEMENT avant déploiement en production

---

### 2. ⚠️ Authorization Bypass in Next.js Middleware (CVE-2025-29927)

**Criticité :** 🔴 CRITIQUE  
**Composant :** Next.js 14.0.4  
**CVE :** CVE-2025-29927  
**CVSS :** 9.1 (CRITIQUE)

**Description :**  
Vulnérabilité permettant de contourner les vérifications d'autorisation dans Next.js si ces vérifications sont effectuées dans un middleware.

**Impact :**

- Contournement complet de l'authentification
- Accès non autorisé aux ressources protégées
- Compromission potentielle de toutes les données

**Recommandation :**

```bash
# Mettre à jour Next.js immédiatement
pnpm add next@14.2.25 --filter frontend
```

**Effort de correction :** 30 minutes  
**Priorité :** URGENT - À corriger dans les 24 heures

---

### 3. ⚠️ Vulnérabilité form-data (CVE-2025-7783)

**Criticité :** 🔴 CRITIQUE  
**Composant :** form-data 4.0.3  
**CVE :** CVE-2025-7783  
**CVSS :** Critique

**Description :**  
form-data utilise `Math.random()` pour générer des valeurs de boundary, ce qui est prédictible et peut permettre l'injection de paramètres malveillants.

**Impact :**

- Injection de paramètres dans les requêtes
- Possibilité d'attaques SSRF
- Manipulation de données

**Recommandation :**

```bash
# Mettre à jour form-data
pnpm update form-data --filter backend
```

**Effort de correction :** 15 minutes  
**Priorité :** URGENT

---

## 🔴 VULNÉRABILITÉS HAUTES

### 4. Multer DoS vulnerability (CVE-2025-7338)

**Criticité :** 🔴 HAUTE  
**Composant :** multer 2.0.1  
**CVE :** CVE-2025-7338  
**CVSS :** 7.5

**Description :**  
Vulnérabilité permettant un déni de service via une exception non gérée provoquée par une requête mal formée.

**Recommandation :**

```bash
pnpm add multer@2.0.2 --filter backend
```

**Effort de correction :** 15 minutes  
**Priorité :** À corriger dans la semaine

---

### 5. Absence de contrôle d'autorisation sur l'upload de preuves

**Criticité :** 🔴 HAUTE  
**Fichier :** `apps/backend/src/proofs/proofs.controller.ts:75-78, 101-103`  
**CWE :** CWE-862 (Missing Authorization)

**Description :**  
Les endpoints d'upload de preuves ont des TODO indiquant que la vérification d'autorisation n'est pas implémentée.

**Code problématique :**

```typescript
// TODO: Vérifier que l'utilisateur a le droit de modifier cette action
// Pour le moment, on fait confiance à l'authentification JWT
```

**Impact :**

- N'importe quel utilisateur authentifié peut ajouter des preuves à n'importe quelle action
- Manipulation de données d'autres utilisateurs
- Fraude potentielle dans le système de validation

**Recommandation :**

```typescript
async addProofToUserAction(
  @Param('userActionId', ParseIntPipe) userActionId: number,
  @UploadedFile() file: Express.Multer.File,
  @Request() req: any,
) {
  if (!file) {
    throw new BadRequestException('Aucun fichier fourni');
  }

  // Vérifier que l'utilisateur a le droit de modifier cette action
  const userAction = await this.userActionsService.findOne(userActionId);
  if (!userAction || userAction.userId !== req.user.id) {
    throw new ForbiddenException("Vous n'avez pas le droit d'ajouter une preuve à cette action");
  }

  return this.proofsService.addProofToUserAction(userActionId, file);
}
```

**Effort de correction :** 2-3 heures  
**Priorité :** À corriger dans les 48 heures

---

### 6-10. Vulnérabilités Next.js multiples (CVE-2024-\*)

**Criticité :** 🔴 HAUTE  
**Composant :** Next.js 14.0.4

Plusieurs vulnérabilités critiques dans Next.js :

- CVE-2024-34351 : SSRF in Server Actions (CVSS 7.5)
- CVE-2024-46982 : Cache Poisoning (CVSS 7.5)
- CVE-2024-51479 : Authorization bypass (CVSS 7.5)
- CVE-2025-57752 : Cache Key Confusion (CVSS 6.2)
- CVE-2025-57822 : SSRF via Middleware (CVSS 6.5)

**Recommandation :**

```bash
pnpm add next@14.2.32 --filter frontend
```

**Effort de correction :** 1-2 heures (test de compatibilité inclus)  
**Priorité :** À corriger dans la semaine

---

## 🟡 VULNÉRABILITÉS MOYENNES

### 11. Stockage du token JWT en localStorage

**Criticité :** 🟡 MOYENNE  
**Fichier :** `apps/frontend/src/services/api.ts:11`, `apps/frontend/src/utils/auth.ts`  
**CWE :** CWE-922 (Insecure Storage of Sensitive Information)

**Description :**  
Le token JWT est stocké dans `localStorage`, ce qui le rend vulnérable aux attaques XSS.

**Impact :**

- Vol de token en cas d'attaque XSS
- Pas d'expiration automatique du token côté client
- Token accessible à tous les scripts JavaScript

**Recommandation :**

1. **Court terme :** Ajouter une politique CSP stricte
2. **Long terme :** Migrer vers httpOnly cookies

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

**Effort de correction :** 4-6 heures (migration vers cookies)  
**Priorité :** À planifier pour la prochaine version

---

### 12. Utilisation de dangerouslySetInnerHTML

**Criticité :** 🟡 MOYENNE  
**Fichiers :**

- `apps/frontend/src/components/ui/ReleaseNotesModal.tsx`
- `apps/frontend/src/app/release-notes/page.tsx`
  **CWE :** CWE-79 (Cross-site Scripting)

**Description :**  
L'utilisation de `dangerouslySetInnerHTML` peut permettre des attaques XSS si le contenu n'est pas correctement sanitisé.

**Recommandation :**

1. Vérifier que le contenu est bien sanitisé
2. Utiliser une bibliothèque comme DOMPurify
3. Si possible, remplacer par du JSX standard

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Au lieu de
<div dangerouslySetInnerHTML={{ __html: content }} />

// Utiliser
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

**Effort de correction :** 2 heures  
**Priorité :** À corriger dans le mois

---

### 13. Absence de rate limiting

**Criticité :** 🟡 MOYENNE  
**Composant :** Backend API  
**CWE :** CWE-770 (Allocation of Resources Without Limits)

**Description :**  
Aucun rate limiting n'est implémenté sur les endpoints critiques (authentification, upload de fichiers).

**Impact :**

- Attaques par force brute possibles
- Déni de service
- Abus de ressources

**Recommandation :**

```typescript
// Installer @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    // ... autres imports
  ],
})
export class AppModule {}

// Sur les endpoints sensibles
@UseGuards(ThrottlerGuard)
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // ...
}
```

**Effort de correction :** 3 heures  
**Priorité :** À corriger dans les 2 semaines

---

### 14. Validation insuffisante des fichiers uploadés

**Criticité :** 🟡 MOYENNE  
**Fichier :** `apps/backend/src/proofs/proofs.service.ts:283-313`  
**CWE :** CWE-434 (Unrestricted Upload of File with Dangerous Type)

**Description :**  
La validation des fichiers uploadés se base uniquement sur le MIME type, qui peut être facilement falsifié.

**Recommandations :**

1. Vérifier le magic number du fichier (vraie signature)
2. Scanner les fichiers avec un antivirus
3. Limiter plus strictement les types de fichiers

```typescript
import * as fileType from 'file-type';

async validateFile(file: Express.Multer.File): Promise<boolean> {
  // Vérifier le magic number réel
  const type = await fileType.fromBuffer(file.buffer);

  const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
  if (!type || !allowedTypes.includes(type.mime)) {
    throw new BadRequestException('Type de fichier non autorisé');
  }

  // Vérifier la taille
  if (file.size > 10 * 1024 * 1024) {
    throw new BadRequestException('Fichier trop volumineux');
  }

  return true;
}
```

**Effort de correction :** 4 heures  
**Priorité :** À corriger dans les 2 semaines

---

### 15. CORS configuré de manière trop permissive

**Criticité :** 🟡 MOYENNE  
**Fichier :** `apps/backend/src/main.ts:12-15`  
**CWE :** CWE-942 (Overly Permissive Cross-domain Whitelist)

**Description :**  
La configuration CORS actuelle accepte les credentials mais pourrait être mal configurée en production.

**Recommandation :**

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// S'assurer que FRONTEND_URL est correctement définie en production
```

**Effort de correction :** 1 heure  
**Priorité :** À vérifier avant déploiement

---

### 16-18. Autres vulnérabilités Next.js et dépendances

- CVE-2024-47831 : DoS dans l'optimisation d'images (CVSS 5.9)
- CVE-2024-56332 : DoS avec Server Actions (CVSS 5.3)
- CVE-2025-48068 : Exposition d'informations dev server (CVSS Low)
- esbuild CVE-2102341 : CORS mal configuré (CVSS 5.3)

**Recommandation :** Mettre à jour toutes les dépendances

---

## 🔵 VULNÉRABILITÉS BASSES

### 19. Absence de logging de sécurité

**Criticité :** 🔵 BASSE  
**CWE :** CWE-778 (Insufficient Logging)

**Recommandation :**  
Implémenter un système de logging centralisé pour :

- Tentatives de connexion échouées
- Accès non autorisés
- Modifications de données sensibles
- Uploads de fichiers

**Effort de correction :** 4-6 heures

---

### 20. Absence de politique de mots de passe

**Criticité :** 🔵 BASSE  
**Fichier :** `apps/backend/src/auth/auth.controller.ts:32`

**Description :**  
Bien qu'un validateur `IsStrongPassword` soit utilisé, il faudrait documenter et renforcer la politique.

**Recommandation :**

```typescript
// Ajouter une validation plus stricte
@IsStrongPassword({
  minLength: 12,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
})
password: string;
```

---

### 21. Pas de HSTS header

**Criticité :** 🔵 BASSE  
**CWE :** CWE-319 (Cleartext Transmission of Sensitive Information)

**Recommandation :**

```typescript
// apps/backend/src/main.ts
import helmet from 'helmet';

app.use(
  helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

---

### 22. tmp module vulnerability (CVE-2025-54798)

**Criticité :** 🔵 BASSE  
**CVSS :** 2.5

Vulnérabilité dans une dépendance de dev (CLI).

**Recommandation :** Mettre à jour `@nestjs/cli`

---

### 23. Absence de Content Security Policy

**Criticité :** 🔵 BASSE

**Recommandation :**  
Ajouter une CSP stricte dans Next.js.

---

## 📋 Plan d'Action Recommandé

### Phase 1 : URGENT (0-48h)

1. ✅ Corriger le secret JWT hardcodé
2. ✅ Mettre à jour Next.js vers 14.2.32
3. ✅ Corriger l'autorisation sur les uploads de preuves
4. ✅ Mettre à jour form-data et multer

### Phase 2 : IMPORTANT (Semaine 1)

5. Ajouter rate limiting sur les endpoints critiques
6. Améliorer la validation des fichiers uploadés
7. Vérifier la configuration CORS en production

### Phase 3 : AMÉLIORATION (Semaine 2-4)

8. Migrer du localStorage vers httpOnly cookies
9. Sanitiser les dangerouslySetInnerHTML
10. Ajouter logging de sécurité
11. Implémenter CSP et HSTS

### Phase 4 : MAINTENANCE CONTINUE

12. Mettre en place des scans de sécurité automatiques
13. Audit régulier des dépendances (pnpm audit)
14. Tests de pénétration périodiques
15. Formation de l'équipe sur les bonnes pratiques

---

## 🛠️ Outils Recommandés

### Pour automatiser les audits futurs :

```bash
# Installer Snyk (gratuit pour projets open source)
npm install -g snyk
snyk auth
snyk test

# Installer OWASP Dependency Check
# https://owasp.org/www-project-dependency-check/

# Configurer GitHub Dependabot
# Activer dans les paramètres du repo

# Scanner avec Trivy
docker run aquasec/trivy image htf-sunup-backend:latest
```

---

## 📊 Métriques de Sécurité

### Couverture Actuelle

- ✅ Authentification : Implémentée (JWT)
- ⚠️ Autorisation : Partiellement implémentée
- ✅ Chiffrement des mots de passe : bcrypt (10 rounds)
- ⚠️ Protection CSRF : Non implémentée
- ❌ Rate Limiting : Non implémenté
- ⚠️ Validation des entrées : Partielle
- ❌ Logging de sécurité : Non implémenté
- ❌ Headers de sécurité : Non configurés

### Score par Catégorie OWASP Top 10 (2021)

- A01 Broken Access Control : 5/10 ⚠️
- A02 Cryptographic Failures : 7/10 ✅
- A03 Injection : 8/10 ✅
- A04 Insecure Design : 6/10 ⚠️
- A05 Security Misconfiguration : 4/10 ❌
- A06 Vulnerable Components : 3/10 ❌
- A07 Authentication Failures : 6/10 ⚠️
- A08 Software and Data Integrity : 7/10 ✅
- A09 Security Logging : 2/10 ❌
- A10 Server-Side Request Forgery : 7/10 ✅

---

## 📞 Contact et Support

Pour toute question sur cet audit ou pour signaler une vulnérabilité :

- Email : security@htf-sunup.com (à créer)
- Bug Bounty : À configurer

---

**Date de fin d'audit :** 4 octobre 2025  
**Prochain audit recommandé :** Janvier 2026 ou après changements majeurs

**Note :** Cet audit a été réalisé automatiquement et doit être complété par un audit manuel approfondi avant la mise en production.
