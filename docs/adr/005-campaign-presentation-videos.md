# ADR-005: Vidéos de présentation pour les campagnes

- **Statut**: Accepté
- **Date**: 2025-01-12
- **Date d'acceptation**: 2025-01-12
- **Décideurs**: tfoutrein

## Contexte et énoncé du problème

Actuellement, les campagnes HTF Sunup disposent d'un champ textuel `description` pour présenter les objectifs et le contexte aux FBOs. Cette description textuelle peut être insuffisante pour :

1. **Engagement**: Difficile de créer de l'enthousiasme avec du texte seul
2. **Clarté**: Certaines mécaniques de campagne sont complexes à expliquer par écrit
3. **Motivation**: Une vidéo du manager peut créer un lien personnel et motiver les équipes
4. **Accessibilité**: Tous les FBOs ne prennent pas le temps de lire de longues descriptions

**Besoin utilisateur**: Les managers souhaitent pouvoir ajouter une **vidéo de présentation** (2-5 minutes) lors de la création d'une campagne pour mieux expliquer les objectifs, créer de l'engagement et motiver leurs équipes.

**Question principale**: Comment intégrer un système de vidéos de présentation dans le modèle de campagne existant, avec upload, stockage et lecture optimisés ?

## Facteurs de décision

- **Expérience utilisateur**: Lecture fluide des vidéos sans latence
- **Taille des fichiers**: Vidéos potentiellement volumineuses (50-200 MB)
- **Stockage**: Coûts S3 et organisation des fichiers
- **Performance**: Ne pas impacter le chargement des listes de campagnes
- **Optionalité**: Les vidéos doivent rester optionnelles (pas obligatoires)
- **Compatibilité**: Formats vidéo supportés par tous les navigateurs
- **Upload**: Interface intuitive pour les managers
- **Sécurité**: Contrôle d'accès approprié (seuls les FBOs autorisés)

## Options considérées

### Option 1: Champ direct dans la table campaigns

- **Description**: Ajouter un champ `presentationVideoUrl` (varchar) dans la table `campaigns`
- **Avantages**:
  - Implémentation très simple et rapide
  - Pas de jointure SQL nécessaire
  - Migration minimale
  - Logique centralisée dans une seule table
- **Inconvénients**:
  - Pas de métadonnées (durée, taille, format)
  - Difficile d'ajouter des fonctionnalités futures (miniature, sous-titres)
  - Pas de traçabilité de l'upload
  - Moins flexible pour gérer plusieurs versions

### Option 2: Table dédiée campaign_videos avec relations

- **Description**: Créer une table `campaign_videos` avec relation one-to-one vers `campaigns`
- **Avantages**:
  - Architecture extensible pour futures fonctionnalités
  - Métadonnées riches (durée, taille, format, miniature)
  - Possibilité d'historique de versions
  - Traçabilité complète (uploadedAt, uploadedBy)
  - Facilite l'ajout de miniatures auto-générées
- **Inconvénients**:
  - Architecture plus complexe pour une fonctionnalité simple
  - Jointure supplémentaire dans les requêtes
  - Over-engineering potentiel

### Option 3: Service externe de streaming (YouTube, Vimeo)

- **Description**: Les managers uploadent sur YouTube/Vimeo et collent le lien dans la campagne
- **Avantages**:
  - Pas de coûts de stockage vidéo
  - Streaming optimisé par des experts
  - Pas de gestion de l'encodage
  - Lecteurs vidéo professionnels
- **Inconvénients**:
  - Dépendance à un service tiers
  - Complexité pour les managers (compte YouTube requis)
  - Problèmes de confidentialité potentiels
  - Moins de contrôle sur l'expérience utilisateur
  - Pas d'uniformité avec le système de preuves existant

### Option 4: Réutilisation du système de preuves existant

- **Description**: Utiliser la table `proofs` existante avec une relation vers `campaigns` et un type spécifique
- **Avantages**:
  - Réutilise l'infrastructure existante (upload, stockage, validation)
  - Pas de duplication de code
  - Système de preuves déjà testé et en production
  - Métadonnées déjà présentes (type, url, fileSize, mimeType)
- **Inconvénients**:
  - Table `proofs` actuellement liée à `userActions` et `dailyBonus` seulement
  - Nécessite de rendre les relations optionnelles
  - Peut créer de la confusion sémantique (une vidéo de présentation n'est pas une "preuve")

## Décision

**Solution choisie**: Option 1 - Champ direct `presentationVideoUrl` dans la table campaigns

**Justification**:

1. **KISS Principle**: Pour un MVP, garder l'architecture simple est préférable
2. **Besoins actuels**: Les fonctionnalités avancées (versions, miniatures) ne sont pas requises maintenant
3. **Cohérence**: Aligné avec l'approche actuelle des campagnes (description textuelle simple)
4. **Rapidité**: Implémentation en 1-2 jours vs 1 semaine pour Option 2
5. **Évolutivité**: Si besoin futur de métadonnées, migration facile vers Option 2
6. **Réutilisation**: Le système de stockage S3 existant peut être réutilisé sans modification

**Contraintes techniques**:

- Formats supportés: MP4, WebM (compatibilité navigateurs)
- Taille maximale: 100 MB (compressible par les managers)
- Durée recommandée: 2-5 minutes
- Stockage: iDrive e2 S3 (infrastructure existante)

## Conséquences attendues

### Positives:

- **Engagement accru**: Vidéos personnalisées du manager pour motiver les équipes
- **Clarté**: Explications visuelles des mécaniques de campagne
- **Accessibilité**: Alternative à la lecture pour les FBOs pressés
- **Implémentation rapide**: Feature déployable en quelques jours
- **Faible complexité**: Maintenance minimale
- **Coûts maîtrisés**: Stockage S3 uniquement (estimé 5-10 GB/an)

### Négatives (ou risques):

- **Taille de fichiers**: Bande passante importante pour upload/lecture
- **Pas de miniatures auto**: Les managers devront créer des aperçus visuels manuellement si besoin
- **Pas de contrôle de durée**: Risque de vidéos trop longues (mais recommandations dans l'UI)
- **Pas de transcoding**: Les vidéos doivent être au bon format avant upload
- **Pas de sous-titres**: Accessibilité limitée pour les personnes malentendantes

## Implémentation proposée

### Phase 1 - Backend (1 jour)

1. **Migration base de données**

   ```sql
   ALTER TABLE campaigns ADD COLUMN presentation_video_url VARCHAR(500);
   ```

2. **Ajout au schéma Drizzle**

   ```typescript
   export const campaigns = pgTable('campaigns', {
     // ... existing fields
     presentationVideoUrl: varchar('presentation_video_url', { length: 500 }),
   });
   ```

3. **Endpoint upload vidéo**

   - `POST /campaigns/:id/presentation-video`
   - Validation: formats MP4/WebM, max 100MB
   - Utilisation du `StorageService` existant
   - Stockage: `campaign-videos/{campaignId}/{timestamp}.{ext}`

4. **Endpoint suppression vidéo**

   - `DELETE /campaigns/:id/presentation-video`
   - Suppression du fichier S3 + mise à NULL du champ

5. **Mise à jour endpoints existants**
   - Inclure `presentationVideoUrl` dans les réponses GET

### Phase 2 - Frontend (1-2 jours)

1. **Composant CampaignVideoUpload**

   - Drag & drop ou sélection de fichier
   - Preview avant upload
   - Barre de progression
   - Validation client (format, taille)
   - Indication de durée recommandée (2-5 min)

2. **Composant CampaignVideoPlayer**

   - Lecteur HTML5 `<video>` natif
   - Contrôles standards (play, pause, fullscreen, volume)
   - Responsive (mobile/desktop)
   - Loading state élégant

3. **Intégration dans CampaignForm**

   - Section "Vidéo de présentation (optionnel)"
   - Upload pour les managers lors de création/édition
   - Aperçu de la vidéo existante

4. **Affichage dans CampaignDetails (FBO)**
   - Section dédiée en haut de la page
   - Thumbnail avec bouton play
   - Lecture en modal ou inline

### Phase 3 - Tests et Déploiement (0.5 jour)

1. **Tests backend**

   - Upload vidéo valide
   - Rejet formats non supportés
   - Rejet fichiers trop volumineux
   - Suppression de vidéo

2. **Tests frontend**

   - Upload et lecture sur mobile
   - Upload et lecture sur desktop
   - Gestion des erreurs réseau

3. **Documentation**
   - Guide manager: "Comment créer une vidéo de présentation"
   - Recommandations techniques (compression, formats)

## Alternatives pour évolutions futures

Si les besoins évoluent, voici les chemins de migration possibles :

1. **Migration vers Option 2** (table dédiée):

   - Script de migration automatique
   - Pas de perte de données
   - Ajout de métadonnées progressif

2. **Intégration transcoding**:

   - Service AWS MediaConvert ou CloudFlare Stream
   - Génération automatique de miniatures
   - Formats optimisés par device

3. **Sous-titres automatiques**:
   - API de transcription (AWS Transcribe, Deepgram)
   - Génération de fichiers .srt/.vtt

## Métriques de succès

- **Adoption**: 60%+ des campagnes avec vidéo dans les 3 mois
- **Engagement**: Augmentation du taux de participation aux campagnes avec vidéo
- **Performance**: Temps de chargement vidéo < 3 secondes
- **Satisfaction**: Feedback positif des managers sur l'upload
- **Coûts**: Stockage S3 < 20€/mois

## Liens

- [Schéma actuel de la base de données](../../apps/backend/src/db/schema.ts)
- [Service de stockage actuel](../../apps/backend/src/storage/storage.service.ts)
- [Système de preuves avec vidéos](../../apps/backend/src/proofs/proofs.service.ts)
- [Documentation API campagnes](../api/API_DOCUMENTATION.md#campagnes)

---

_ADR-005 pour le projet HTF Sunup - Vidéos de présentation de campagne_
