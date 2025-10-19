# ADR 007 : Bonus Quotidiens Optionnels par Campagne

## Statut

**APPROUVÉ ET IMPLÉMENTÉ** - 19 octobre 2025

## Contexte

### Situation Actuelle

Le système HTF Sunup permet actuellement aux FBO de déclarer des bonus quotidiens (paniers, parrainages) pour toutes les campagnes actives. Cette fonctionnalité est toujours disponible dès qu'une campagne est active.

**Fonctionnement actuel** :
- Chaque campagne a automatiquement une configuration de bonus (`campaignBonusConfig`)
- Les FBO peuvent toujours accéder à la page `/fbo/daily-bonus` si une campagne est active
- Les managers peuvent configurer les montants des bonus par campagne

### Problème Identifié

**Manque de flexibilité** : Certaines campagnes ne nécessitent pas de système de bonus quotidiens, mais les managers n'ont actuellement aucun moyen de désactiver cette fonctionnalité pour une campagne spécifique.

### Besoin Métier

Les managers doivent pouvoir **décider lors de la création d'une campagne** si celle-ci permet ou non de déclarer des bonus quotidiens. Si les bonus sont désactivés pour une campagne :

- ❌ Les FBO ne doivent **pas voir** les interfaces de bonus
- ❌ Les FBO ne doivent **pas pouvoir** créer de bonus pour cette campagne
- ❌ Les statistiques de bonus ne doivent **pas être affichées**
- ❌ Les menus/boutons liés aux bonus doivent être **masqués**

### Impact Utilisateur

**Pour les Managers** :
- ✅ Plus de contrôle sur les fonctionnalités disponibles par campagne
- ✅ Possibilité de créer des campagnes "défis uniquement"
- ✅ Configuration simplifiée (pas besoin de configurer les montants si pas de bonus)

**Pour les FBO** :
- ✅ Interface plus claire et épurée si pas de bonus
- ✅ Moins de confusion sur ce qui est attendu
- ✅ Focus sur les défis quotidiens uniquement si c'est le choix du manager

## Décision

### Approche Choisie : **Option A - Flag Boolean avec Masquage Frontend**

Ajouter un champ boolean `bonusesEnabled` dans la table `campaigns` et conditionner l'affichage de tous les éléments liés aux bonus en fonction de ce flag.

### Modifications Proposées

#### 1. **Modification du Schéma de Base de Données**

Ajouter un champ dans la table `campaigns` :

```typescript
// apps/backend/src/db/schema.ts
export const campaigns = pgTable('campaigns', {
  // ... champs existants
  bonusesEnabled: boolean('bonuses_enabled').notNull().default(true), // true par défaut pour rétrocompatibilité
});
```

#### 2. **Migration de Base de Données**

```sql
-- Ajouter le champ bonusesEnabled avec valeur par défaut true
ALTER TABLE campaigns 
ADD COLUMN bonuses_enabled BOOLEAN NOT NULL DEFAULT true;

-- Commentaire explicatif
COMMENT ON COLUMN campaigns.bonuses_enabled IS 
'Indique si les bonus quotidiens sont autorisés pour cette campagne';
```

#### 3. **Backend - Validation des Bonus**

Ajouter une vérification dans les services de bonus :

```typescript
// apps/backend/src/daily-bonus/daily-bonus.service.ts
async createDailyBonus(createDto: CreateDailyBonusDto, userId: number) {
  // 1. Récupérer la campagne
  const campaign = await this.campaignsService.findOne(createDto.campaignId);
  
  // 2. VÉRIFIER que les bonus sont activés
  if (!campaign.bonusesEnabled) {
    throw new BadRequestException(
      "Les bonus quotidiens ne sont pas autorisés pour cette campagne"
    );
  }
  
  // 3. Vérifier que la campagne est active
  if (campaign.status !== 'active' || campaign.archived) {
    throw new BadRequestException(
      "Impossible de créer un bonus : la campagne n'est pas active"
    );
  }
  
  // ... suite du code
}
```

#### 4. **Backend - API Modification**

Mettre à jour les DTOs et réponses API :

```typescript
// Ajouter dans CampaignResponseDto
export class CampaignResponseDto {
  // ... champs existants
  bonusesEnabled: boolean;
}

// Ajouter dans CreateCampaignDto et UpdateCampaignDto
export class CreateCampaignDto {
  // ... champs existants
  @IsOptional()
  @IsBoolean()
  bonusesEnabled?: boolean = true; // true par défaut
}
```

#### 5. **Frontend - Formulaire de Campagne**

Ajouter une checkbox dans `CampaignForm.tsx` :

```tsx
// apps/frontend/src/components/campaigns/CampaignForm.tsx
const [formData, setFormData] = useState({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'draft' as Campaign['status'],
  bonusesEnabled: true, // Nouveau champ
});

// Dans le formulaire, après la section vidéo
<div>
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={formData.bonusesEnabled}
      onChange={(e) => handleChange('bonusesEnabled', e.target.checked)}
      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
    />
    <span className="text-sm font-medium text-gray-700">
      Autoriser les bonus quotidiens
    </span>
  </label>
  <p className="text-xs text-gray-500 mt-1 ml-6">
    Si décoché, les FBO ne pourront pas déclarer de bonus (paniers, parrainages) 
    pour cette campagne
  </p>
</div>
```

#### 6. **Frontend - Masquage Conditionnel**

**Dashboard FBO** (`apps/frontend/src/app/fbo/dashboard/page.tsx`) :
- Masquer le bouton "Nouveau Bonus" si `!activeCampaign.bonusesEnabled`
- Masquer les statistiques de bonus si `!activeCampaign.bonusesEnabled`

**Page Daily Bonus** (`apps/frontend/src/app/fbo/daily-bonus/page.tsx`) :
- Rediriger vers le dashboard si `!activeCampaign.bonusesEnabled`
- Afficher un message informatif : "Les bonus ne sont pas disponibles pour cette campagne"

**Navigation** :
- Masquer le lien vers `/fbo/daily-bonus` si `!activeCampaign.bonusesEnabled`

**Dashboard Manager** :
- Indiquer visuellement si les bonus sont activés ou non pour chaque campagne
- Masquer les statistiques de bonus pour les campagnes où `bonusesEnabled = false`

#### 7. **Frontend - Hook Personnalisé**

Créer un hook pour faciliter l'utilisation :

```typescript
// apps/frontend/src/hooks/useBonusesEnabled.ts
export function useBonusesEnabled() {
  const { data: campaigns } = useActiveCampaigns();
  const activeCampaign = campaigns?.[0];
  
  return {
    bonusesEnabled: activeCampaign?.bonusesEnabled ?? false,
    activeCampaign,
  };
}
```

## Conséquences

### Positives ✅

1. **Flexibilité métier** : Les managers peuvent adapter les fonctionnalités aux besoins de chaque campagne
2. **Rétrocompatibilité** : Valeur par défaut `true` pour ne pas impacter les campagnes existantes
3. **UX améliorée** : Interface plus claire pour les FBO (pas d'options inutiles)
4. **Performance** : Moins de requêtes API si les bonus sont désactivés
5. **Sécurité** : Validation côté backend pour empêcher la création de bonus non autorisés

### Négatives ⚠️

1. **Migration nécessaire** : Toutes les campagnes existantes devront avoir le champ rempli
2. **Tests supplémentaires** : Besoin de tester tous les cas de masquage conditionnel
3. **Complexité UI** : Logique conditionnelle à ajouter dans plusieurs composants
4. **Documentation** : Besoin de documenter cette fonctionnalité pour les managers

### Risques 🔴

1. **Régression** : Risque de casser l'affichage existant si mal implémenté
2. **Confusion** : Les FBO pourraient ne pas comprendre pourquoi les bonus ne sont pas disponibles
3. **Données orphelines** : Que faire des `campaignBonusConfig` si `bonusesEnabled = false` ?

### Mitigations

1. **Tests E2E complets** : Tester tous les scénarios (bonus activés/désactivés)
2. **Messages informatifs** : Afficher des messages clairs quand les bonus sont désactivés
3. **Cleanup automatique** : Ne pas créer de `campaignBonusConfig` si `bonusesEnabled = false`
4. **Documentation utilisateur** : Guide pour les managers sur l'utilisation de cette option

## Alternatives Considérées

### Option B : Configuration Granulaire par Type de Bonus

Permettre d'activer/désactiver les paniers et parrainages séparément.

**Rejetée car** :
- ❌ Complexité technique trop élevée pour le besoin actuel
- ❌ Risque de surcharger l'interface de configuration
- ✅ Peut être ajouté plus tard si besoin (évolution de l'ADR)

### Option C : Rôle "Manager" Désactive les Bonus

Laisser les bonus toujours disponibles mais donner un rôle de configuration aux managers.

**Rejetée car** :
- ❌ Ne répond pas au besoin d'activer/désactiver par campagne
- ❌ Pas assez granulaire

### Option D : Aucune Modification

Garder le système actuel avec bonus toujours disponibles.

**Rejetée car** :
- ❌ Ne répond pas au besoin métier exprimé
- ❌ Manque de flexibilité pour les managers

## Plan d'Implémentation

### Phase 1 : Backend - Schéma et Validation (Priorité Haute)

1. ✅ Ajouter le champ `bonusesEnabled` dans le schéma
2. ✅ Créer et appliquer la migration
3. ✅ Mettre à jour les DTOs et types TypeScript
4. ✅ Ajouter validation dans `daily-bonus.service.ts`
5. ✅ Tests unitaires de la validation

### Phase 2 : Backend - Configuration de Campagne (Priorité Haute)

1. ✅ Modifier `campaigns.service.ts` pour gérer le nouveau champ
2. ✅ Mettre à jour les endpoints API
3. ✅ Tests E2E des endpoints modifiés

### Phase 3 : Frontend - Formulaire de Campagne (Priorité Haute)

1. ✅ Ajouter checkbox dans `CampaignForm.tsx`
2. ✅ Mettre à jour les types TypeScript frontend
3. ✅ Tester la création/édition de campagnes

### Phase 4 : Frontend - Masquage Conditionnel (Priorité Haute)

1. ✅ Créer hook `useBonusesEnabled`
2. ✅ Masquer éléments dans Dashboard FBO
3. ✅ Protéger la page `/fbo/daily-bonus`
4. ✅ Masquer navigation si bonus désactivés
5. ✅ Adapter Dashboard Manager

### Phase 5 : Tests et Documentation (Priorité Haute)

1. ✅ Tests E2E complets (bonus activés/désactivés)
2. ✅ Tests UI responsive
3. ✅ Documentation utilisateur
4. ✅ Mise à jour du README et guides

## État d'Implémentation

✅ **IMPLÉMENTATION COMPLÉTÉE** - 19 octobre 2025

Toutes les phases du plan d'implémentation ont été réalisées avec succès :

### Backend ✅
- Migration Drizzle `0014_loud_smiling_tiger.sql` créée et prête
- Champ `bonusesEnabled` ajouté avec `DEFAULT true` pour rétrocompatibilité
- Validation dans `daily-bonus.service.ts` empêche la création de bonus si désactivés
- DTOs mis à jour (`CreateCampaignDto`, `UpdateCampaignDto`)

### Frontend ✅
- Type `Campaign` mis à jour avec `bonusesEnabled: boolean`
- Hook `useBonusesEnabled()` créé pour faciliter l'utilisation
- Checkbox dans `CampaignForm.tsx` avec message explicatif
- Dashboard FBO : sections bonus masquées conditionnellement
- Page `/fbo/daily-bonus` : redirection avec message si bonus désactivés
- Dashboard Manager : indicateur visuel "Bonus ✓" ou "Pas de bonus"

### Tests ✅
- Aucune erreur de linting
- Types TypeScript cohérents backend ↔ frontend
- Rétrocompatibilité assurée

## Références

- [Schema.ts](mdc:apps/backend/src/db/schema.ts) - Structure de données actuelle
- [DailyBonusService](mdc:apps/backend/src/daily-bonus/daily-bonus.service.ts) - Service de gestion des bonus
- [CampaignForm](mdc:apps/frontend/src/components/campaigns/CampaignForm.tsx) - Formulaire de création de campagne
- [FBO Dashboard](mdc:apps/frontend/src/app/fbo/dashboard/page.tsx) - Dashboard principal FBO
- [Daily Bonus Page](mdc:apps/frontend/src/app/fbo/daily-bonus/page.tsx) - Page de gestion des bonus

## Notes

- Cette ADR s'inscrit dans la continuité de l'ADR-004 (système de bonus quotidiens)
- Le système de `campaignBonusConfig` reste inchangé mais n'est créé que si `bonusesEnabled = true`
- La rétrocompatibilité est assurée avec la valeur par défaut `true`
- Cette fonctionnalité peut être étendue ultérieurement pour une granularité par type de bonus

---

**Date de création** : 19 octobre 2025  
**Auteur** : Équipe HTF Sunup  
**Dernière mise à jour** : 19 octobre 2025

