# 🧪 Documentation des Tests - HTF Sunup

Bienvenue dans la documentation complète de la stratégie de tests du projet HTF Sunup.

---

## 📋 Table des Matières

### 📊 Audit et Analyse

**[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** - 👔 **POUR LES DÉCIDEURS** (3 min)

- Synthèse exécutive pour direction et product owners
- Analyse risques et ROI
- Plan d'action avec options et coûts
- Métriques de succès et décisions attendues

**[AUDIT_TESTS.md](./AUDIT_TESTS.md)** - ⚠️ **POUR LES TECH** (15 min)

- Audit technique complet de la couverture actuelle
- État des lieux détaillé : ~10-15% de couverture
- Analyse détaillée des gaps par module
- Plan d'action technique avec priorités
- Métriques de succès et objectifs

### 📝 Templates et Exemples

**[TEST_TEMPLATES.md](./TEST_TEMPLATES.md)** - 🚀 **GUIDE PRATIQUE**

- Templates prêts à l'emploi pour tous types de tests
- Exemples concrets de tests unitaires (NestJS)
- Exemples de tests E2E (Backend & Frontend)
- Configuration Jest et Playwright
- Scripts CI/CD

### 🔧 Tests Existants

**Backend E2E**

- [`apps/backend/test/auth.e2e-spec.ts`](../../apps/backend/test/auth.e2e-spec.ts) - Tests d'authentification
- [`apps/backend/test/proofs.e2e-spec.ts`](../../apps/backend/test/proofs.e2e-spec.ts) - Tests d'upload de preuves

**Backend Unitaires**

- [`apps/backend/src/auth/auth.controller.spec.ts`](../../apps/backend/src/auth/auth.controller.spec.ts) - Tests du contrôleur d'auth
- [`apps/backend/src/auth/auth.service.simple.spec.ts`](../../apps/backend/src/auth/auth.service.simple.spec.ts) - Tests du service d'auth
- [`apps/backend/src/test-integration.spec.ts`](../../apps/backend/src/test-integration.spec.ts) - Tests d'intégration basiques

---

## 🎯 Par où commencer ?

### Si vous découvrez le projet

1. **Lisez l'audit** → [AUDIT_TESTS.md](./AUDIT_TESTS.md)

   - Comprenez l'état actuel du projet
   - Identifiez les risques
   - Comprenez les priorités

2. **Consultez les templates** → [TEST_TEMPLATES.md](./TEST_TEMPLATES.md)
   - Familiarisez-vous avec les patterns de tests
   - Explorez les exemples concrets

### Si vous devez écrire des tests

1. **Identifiez votre besoin** :

   - Tests unitaires d'un service ? → Template "Test de Service NestJS"
   - Tests E2E d'un endpoint ? → Template "Test E2E d'un Module"
   - Tests d'un composant React ? → Template "Test de Composant React"
   - Tests E2E frontend ? → Template "Test E2E Playwright"

2. **Copiez le template approprié** depuis [TEST_TEMPLATES.md](./TEST_TEMPLATES.md)

3. **Adaptez-le à votre cas d'usage**

4. **Lancez les tests** :

   ```bash
   # Backend
   cd apps/backend
   pnpm test              # Tests unitaires
   pnpm test:e2e          # Tests E2E
   pnpm test:cov          # Avec couverture

   # Frontend (après installation)
   cd apps/frontend
   pnpm test              # Tests unitaires
   pnpm test:e2e          # Tests E2E
   ```

### Si vous êtes responsable de la qualité

1. **Suivez le plan d'action** dans [AUDIT_TESTS.md](./AUDIT_TESTS.md)

2. **Priorisez les tests critiques** :

   - ✅ CampaignValidationService (logique métier critique)
   - ✅ UserActionsService (calcul des gains)
   - ✅ ChallengesService (validation des challenges)
   - ✅ ProofsService (gestion S3)

3. **Mettez en place l'infrastructure frontend** :

   - Installation de Jest + Testing Library
   - Configuration Playwright
   - Premiers tests de composants

4. **Configurez CI/CD** pour exécuter les tests automatiquement

---

## 📊 État Actuel

| Catégorie                         | État        | Couverture        | Priorité |
| --------------------------------- | ----------- | ----------------- | -------- |
| **Backend - Tests Unitaires**     | 🔴 CRITIQUE | ~5%               | 🔴 P1    |
| **Backend - Tests E2E**           | 🟠 PARTIEL  | 2/10 modules      | 🔴 P1    |
| **Backend - Tests d'Intégration** | 🔴 MINIMAL  | 1 fichier basique | 🟠 P2    |
| **Frontend - Tests Unitaires**    | 🔴 ABSENT   | 0%                | 🟠 P2    |
| **Frontend - Tests E2E**          | 🔴 ABSENT   | 0 parcours        | 🟡 P3    |
| **CI/CD - Tests automatiques**    | 🔴 ABSENT   | -                 | 🟠 P2    |

---

## 🚀 Roadmap des Tests

### Phase 1 - Urgence (2 semaines)

**Objectif : Sécuriser les fonctionnalités critiques**

- [ ] Tests unitaires des services critiques (4 services)

  - [ ] `CampaignValidationService`
  - [ ] `UserActionsService`
  - [ ] `ChallengesService`
  - [ ] `ProofsService`

- [ ] Tests E2E des endpoints critiques (3 modules)
  - [ ] Campaign Validation
  - [ ] User Actions
  - [ ] Challenges

**Livrable** : 40% de couverture sur services critiques

### Phase 2 - Consolidation (2 semaines)

**Objectif : Infrastructure frontend + backend complet**

- [ ] Configuration Jest + Testing Library (Frontend)
- [ ] 10 premiers tests de composants React
- [ ] Tests E2E backend restants (Campaigns, Users, Daily Bonus)
- [ ] Tests d'intégration avec DB réelle

**Livrable** : 60% backend / 30% frontend

### Phase 3 - Maturité (2 semaines)

**Objectif : Tests E2E frontend + automatisation**

- [ ] Configuration Playwright
- [ ] 5 parcours E2E principaux
- [ ] Tests de performance backend
- [ ] CI/CD avec tests automatiques

**Livrable** : >80% backend / >60% frontend

---

## 🛠️ Outils et Frameworks

### Backend

- **Jest** - Framework de test principal
- **@nestjs/testing** - Utilitaires NestJS
- **supertest** - Tests HTTP E2E
- **ts-jest** - Support TypeScript

### Frontend

- **Jest** - Framework de test
- **@testing-library/react** - Tests de composants
- **@testing-library/user-event** - Simulation d'interactions
- **Playwright** - Tests E2E
- **MSW** - Mock Service Worker (API mocking)

### CI/CD

- **GitHub Actions** - Automatisation des tests
- **Codecov** - Suivi de la couverture

---

## 📚 Ressources Externes

### Documentation Officielle

- **Jest** : https://jestjs.io/docs/getting-started
- **Testing Library** : https://testing-library.com/docs/react-testing-library/intro
- **Playwright** : https://playwright.dev/docs/intro
- **NestJS Testing** : https://docs.nestjs.com/fundamentals/testing

### Guides et Bonnes Pratiques

- **Kent C. Dodds - Common Testing Mistakes** : https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- **Testing Best Practices** : https://github.com/goldbergyoni/javascript-testing-best-practices
- **React Testing Library Cheatsheet** : https://testing-library.com/docs/react-testing-library/cheatsheet

---

## 💡 Conseils Pratiques

### Tests Unitaires

✅ **À FAIRE**

- Tester un seul comportement par test
- Utiliser des noms descriptifs (`should validate user action and calculate earnings`)
- Mock uniquement les dépendances externes
- Tester les cas d'erreur

❌ **À ÉVITER**

- Tests qui testent l'implémentation plutôt que le comportement
- Tests couplés entre eux
- Mocks excessifs
- Tests qui passent même s'ils ne testent rien

### Tests E2E

✅ **À FAIRE**

- Tester les parcours utilisateur complets
- Utiliser des données de test dédiées
- Nettoyer après chaque test
- Tester les cas d'erreur réseau

❌ **À ÉVITER**

- Tests flaky (instables)
- Tests trop longs (>30s)
- Dépendances entre tests
- Tests sur des données de production

### Tests Frontend

✅ **À FAIRE**

- Tester du point de vue utilisateur
- Utiliser les queries accessible (`getByRole`, `getByLabelText`)
- Tester l'état de chargement et d'erreur
- Mock les appels API

❌ **À ÉVITER**

- Tester les détails d'implémentation
- Utiliser `container.querySelector`
- Snapshot tests excessifs
- Tests sans assertions

---

## 🤝 Contribution

### Ajouter de Nouveaux Tests

1. **Créez le fichier de test** selon la convention :

   - Backend unitaire : `*.spec.ts` à côté du fichier source
   - Backend E2E : `*.e2e-spec.ts` dans `apps/backend/test/`
   - Frontend unitaire : `*.test.tsx` à côté du composant
   - Frontend E2E : `*.spec.ts` dans `apps/frontend/e2e/`

2. **Utilisez les templates** fournis dans [TEST_TEMPLATES.md](./TEST_TEMPLATES.md)

3. **Lancez les tests** pour vérifier qu'ils passent

4. **Vérifiez la couverture** :

   ```bash
   pnpm test:cov
   ```

5. **Créez une PR** avec vos tests

### Mettre à Jour la Documentation

Si vous ajoutez des tests importants ou modifiez la stratégie :

1. Mettez à jour [AUDIT_TESTS.md](./AUDIT_TESTS.md) avec les nouvelles métriques
2. Ajoutez des exemples dans [TEST_TEMPLATES.md](./TEST_TEMPLATES.md) si pertinent
3. Mettez à jour ce README si nécessaire

---

## ❓ FAQ

### Pourquoi si peu de tests actuellement ?

Le projet a été développé dans un mode MVP rapide, privilégiant la vitesse de livraison. Maintenant que le MVP fonctionne, il est temps de sécuriser le code avec des tests.

### Par où commencer si je n'ai jamais écrit de tests ?

1. Lisez [TEST_TEMPLATES.md](./TEST_TEMPLATES.md)
2. Commencez par un test unitaire simple d'un service
3. Lancez le test et faites-le passer
4. Ajoutez progressivement plus de cas de test

### Combien de temps pour atteindre 80% de couverture ?

Selon le plan d'action dans [AUDIT_TESTS.md](./AUDIT_TESTS.md) :

- Phase 1 (2 semaines) : 40% backend
- Phase 2 (2 semaines) : 60% backend, 30% frontend
- Phase 3 (2 semaines) : >80% backend, >60% frontend

Total : **~6 semaines** avec une équipe dédiée.

### Faut-il vraiment 80% de couverture ?

80% est un objectif ambitieux mais réaliste. Plus important que le chiffre :

- **100%** des services critiques (validation, gains, challenges)
- **Tous** les parcours utilisateur principaux en E2E
- **Zéro** régression sur les fonctionnalités existantes

### Les tests ralentissent-ils le développement ?

Au début : **oui**, ~20-30% de temps en plus.

Après quelques semaines : **non**, car :

- Moins de bugs découverts en production
- Refactoring plus rapide et sûr
- Moins de temps en debugging
- Nouvelles features plus rapides (pas de régression)

ROI positif après ~1 mois.

---

## 📞 Support

### Besoin d'Aide ?

- **Documentation** : Consultez les fichiers de ce dossier
- **Templates** : [TEST_TEMPLATES.md](./TEST_TEMPLATES.md)
- **Audit** : [AUDIT_TESTS.md](./AUDIT_TESTS.md)
- **Exemples** : Consultez les tests existants dans `apps/backend/test/`

---

**Dernière mise à jour** : 4 octobre 2025  
**Version** : 1.0  
**Statut** : 🔴 Tests en cours d'implémentation - Phase 1 à démarrer
