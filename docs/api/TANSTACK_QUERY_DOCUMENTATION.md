# Documentation TanStack Query - HTF SunUp

> **Note** : Cette documentation contient des termes techniques anglais couramment utilisés en développement web (Query, Cache, Hook, etc.) qui sont conservés dans leur langue d'origine pour maintenir la cohérence avec la documentation officielle.

## Vue d'ensemble

HTF SunUp utilise **TanStack Query v5** (anciennement React Query) pour la gestion de l'état serveur, le cache et la synchronisation des données. Cette documentation explique notre implémentation, les patterns utilisés et les bonnes pratiques.

## Installation et Configuration

### Dépendances installées

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

### Configuration globale

Le QueryClient est configuré dans `/src/app/providers.tsx` :

```typescript
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          retry: 2,
          refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        },
      },
    }),
);
```

### Configuration expliquée

- **staleTime: 5 minutes** : Les données sont considérées comme "fraîches" pendant 5 minutes
- **gcTime: 10 minutes** : Les données en cache sont supprimées après 10 minutes d'inactivité
- **retry: 2** : En cas d'erreur, 2 tentatives de requête
- **refetchOnWindowFocus** : Revalidation automatique uniquement en production

## Structure des Hooks

### Organisation des fichiers

```
src/hooks/
├── useCampaigns.ts    # Gestion des campagnes
├── useChallenges.ts   # Gestion des défis
├── useActions.ts      # Gestion des actions
└── index.ts           # Exports centralisés
```

### Naming conventions des clés de cache

#### Campaigns (`useCampaigns.ts`)

```typescript
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: string) => [...campaignKeys.lists(), { filters }] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: number) => [...campaignKeys.details(), id] as const,
  active: () => [...campaignKeys.all, 'active'] as const,
  withChallenges: (id: number) =>
    [...campaignKeys.detail(id), 'challenges'] as const,
};
```

#### Challenges (`useChallenges.ts`)

```typescript
export const challengeKeys = {
  all: ['challenges'] as const,
  lists: () => [...challengeKeys.all, 'list'] as const,
  list: (filters: { campaignId?: number; date?: string }) =>
    [...challengeKeys.lists(), { filters }] as const,
  details: () => [...challengeKeys.all, 'detail'] as const,
  detail: (id: number) => [...challengeKeys.details(), id] as const,
  today: () => [...challengeKeys.all, 'today'] as const,
  withActions: (id: number) =>
    [...challengeKeys.detail(id), 'actions'] as const,
};
```

#### Actions (`useActions.ts`)

```typescript
export const actionKeys = {
  all: ['actions'] as const,
  lists: () => [...actionKeys.all, 'list'] as const,
  list: (challengeId: number) =>
    [...actionKeys.lists(), { challengeId }] as const,
  details: () => [...actionKeys.all, 'detail'] as const,
  detail: (id: number) => [...actionKeys.details(), id] as const,
};
```

## Hooks de Queries

### Exemples d'utilisation

#### Récupérer les campagnes actives

```typescript
import { useActiveCampaigns } from '@/hooks/useCampaigns';

function CampaignsList() {
  const { data: campaigns = [], isLoading, error } = useActiveCampaigns();

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      {campaigns.map(campaign => (
        <div key={campaign.id}>{campaign.name}</div>
      ))}
    </div>
  );
}
```

#### Récupérer une campagne avec ses défis

```typescript
import { useCampaignWithChallenges } from '@/hooks/useCampaigns';

function CampaignDetail({ campaignId }: { campaignId: number }) {
  const { data: campaign, isLoading, error } = useCampaignWithChallenges(campaignId);

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  if (!campaign) return <div>Campagne non trouvée</div>;

  return (
    <div>
      <h1>{campaign.name}</h1>
      <div>
        {campaign.challenges?.map(challenge => (
          <div key={challenge.id}>{challenge.title}</div>
        ))}
      </div>
    </div>
  );
}
```

## Hooks de Mutations

### Création avec Optimistic Updates

#### Créer une campagne

```typescript
import { useCreateCampaign } from '@/hooks/useCampaigns';

function CreateCampaignForm() {
  const createCampaign = useCreateCampaign();

  const handleSubmit = async (formData) => {
    try {
      const newCampaign = await createCampaign.mutateAsync({
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });

      // La campagne est automatiquement ajoutée au cache
      // et l'interface se met à jour instantanément
      console.log('Campagne créée:', newCampaign);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire */}
      <button
        type="submit"
        disabled={createCampaign.isPending}
      >
        {createCampaign.isPending ? 'Création...' : 'Créer'}
      </button>
    </form>
  );
}
```

### Optimistic Updates en détail

Les mutations utilisent des **optimistic updates** pour une meilleure UX :

#### Exemple : Suppression de campagne

```typescript
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => campaignService.deleteCampaign(id),

    // 1. Mise à jour optimiste AVANT l'API
    onMutate: async (deletedId) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });

      // Sauvegarder l'état précédent
      const previousCampaigns = queryClient.getQueryData(campaignKeys.lists());

      // Mise à jour optimiste du cache
      queryClient.setQueryData(campaignKeys.lists(), (old: Campaign[]) => {
        return old ? old.filter((campaign) => campaign.id !== deletedId) : [];
      });

      return { previousCampaigns };
    },

    // 2. En cas d'erreur, restaurer l'état précédent
    onError: (err, deletedId, context) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(
          campaignKeys.lists(),
          context.previousCampaigns,
        );
      }
    },

    // 3. En cas de succès, nettoyer le cache
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: campaignKeys.detail(deletedId) });
    },

    // 4. Toujours revalider à la fin
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}
```

## Gestion du Cache

### Stratégies de cache

#### 1. Données fréquemment utilisées

- **Campagnes actives** : `staleTime: 1 minute`
- **Défis du jour** : `staleTime: 30 secondes`

#### 2. Données statiques

- **Détails de campagne** : `staleTime: 2 minutes`
- **Actions d'un défi** : `staleTime: 30 secondes`

#### 3. Invalidation du cache

```typescript
// Invalider toutes les campagnes
queryClient.invalidateQueries({ queryKey: campaignKeys.all });

// Invalider une campagne spécifique
queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });

// Invalider et refetch immédiatement
queryClient.refetchQueries({ queryKey: campaignKeys.active() });
```

### Préchargement de données

```typescript
// Précharger une campagne au hover
const queryClient = useQueryClient();

const prefetchCampaign = (campaignId: number) => {
  queryClient.prefetchQuery({
    queryKey: campaignKeys.detail(campaignId),
    queryFn: () => campaignService.getCampaign(campaignId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

## Patterns d'utilisation

### 1. Loading States

```typescript
function Component() {
  const { data, isLoading, isFetching, error } = useQuery();

  // isLoading: première fois
  // isFetching: requête en cours (première fois OU revalidation)

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {isFetching && <LoadingIndicator />}
      {/* Contenu */}
    </div>
  );
}
```

### 2. Error Handling

```typescript
function Component() {
  const { data, error, isError } = useQuery();

  if (isError) {
    // error est typé automatiquement
    return (
      <ErrorBoundary>
        <p>Erreur: {error instanceof Error ? error.message : 'Erreur inconnue'}</p>
      </ErrorBoundary>
    );
  }

  return <div>{/* Contenu */}</div>;
}
```

### 3. Conditional Queries

```typescript
function UserDashboard({ userId }: { userId?: number }) {
  // La requête ne s'exécute que si userId existe
  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId, // 🔑 Condition importante
  });

  return <div>{/* Contenu */}</div>;
}
```

## DevTools

### Configuration en développement

```typescript
// Dans providers.tsx
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

### Utilisation des DevTools

1. **Ouvrir les DevTools** : Icône en bas à gauche de l'écran
2. **Explorer le cache** : Voir toutes les queries et leur état
3. **Invalider manuellement** : Bouton "Invalidate" pour tester
4. **Voir les mutations** : Historique des mutations et leur statut

## Debugging et Bonnes Pratiques

### 1. Logging des queries

```typescript
const { data, error } = useQuery({
  queryKey: campaignKeys.detail(id),
  queryFn: () => campaignService.getCampaign(id),
  meta: {
    errorMessage: `Impossible de charger la campagne ${id}`,
  },
});
```

### 2. Retry logic personnalisée

```typescript
const { data } = useQuery({
  queryKey: ['important-data'],
  queryFn: fetchImportantData,
  retry: (failureCount, error) => {
    // Ne pas retry sur les erreurs 404
    if (error.status === 404) return false;
    // Retry max 3 fois
    return failureCount < 3;
  },
});
```

### 3. Background refetch

```typescript
const { data } = useQuery({
  queryKey: campaignKeys.active(),
  queryFn: () => campaignService.getActiveCampaigns(),
  refetchInterval: 5 * 60 * 1000, // Refetch toutes les 5 minutes
  refetchIntervalInBackground: true,
});
```

## Migration depuis l'ancien système

### Avant (API manuelle)

```typescript
// ❌ Ancien pattern
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.getCampaigns();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### Après (TanStack Query)

```typescript
// ✅ Nouveau pattern
const { data, isLoading, error } = useCampaigns();

// C'est tout ! 🎉
```

### Avantages de la migration

1. **Moins de code** : 90% de réduction du boilerplate
2. **Cache automatique** : Pas de requêtes redondantes
3. **Synchronisation** : Données à jour entre les composants
4. **Optimistic updates** : UX plus fluide
5. **Error handling** : Gestion d'erreurs centralisée
6. **DevTools** : Debugging facilité

## Performance et Optimisations

### 1. Query Keys optimales

```typescript
// ✅ Bon : clés hiérarchiques
const campaignKeys = {
  all: ['campaigns'],
  detail: (id) => ['campaigns', id],
  challenges: (id) => ['campaigns', id, 'challenges'],
};

// ❌ Mauvais : clés plates
const campaignKeys = {
  campaigns: ['campaigns'],
  campaignDetail: (id) => [`campaign-${id}`],
};
```

### 2. Batch mutations

```typescript
// Pour les opérations en lot
const createMultipleActions = async (actions: Action[]) => {
  // Suspendre les mises à jour du cache
  queryClient.cancelQueries({ queryKey: actionKeys.all });

  // Effectuer toutes les mutations
  const results = await Promise.all(
    actions.map((action) => createActionMutation.mutateAsync(action)),
  );

  // Une seule invalidation à la fin
  queryClient.invalidateQueries({ queryKey: actionKeys.all });

  return results;
};
```

### 3. Selective re-renders

```typescript
// Éviter les re-renders inutiles
const { data: campaign } = useCampaign(id, {
  select: (data) => ({
    id: data.id,
    name: data.name,
    // Seulement les champs nécessaires
  }),
});
```

## Troubleshooting

### Problèmes courants

#### 1. "Query key not found"

```typescript
// ❌ Problème : clé incohérente
const { data } = useQuery({
  queryKey: ['campaign', id], // Différent de campaignKeys.detail(id)
});

// ✅ Solution : utiliser les clés définies
const { data } = useQuery({
  queryKey: campaignKeys.detail(id),
});
```

#### 2. "Stale data"

```typescript
// ✅ Solution : ajuster staleTime ou forcer le refetch
const { data } = useQuery({
  queryKey: campaignKeys.detail(id),
  staleTime: 0, // Toujours considérer comme stale
  // OU
  refetchOnMount: 'always',
});
```

#### 3. "Cache not updating"

```typescript
// ✅ Solution : vérifier les invalidations
queryClient.invalidateQueries({
  queryKey: campaignKeys.all,
  exact: false, // Invalider toutes les sous-clés
});
```

## Ressources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Query Key Best Practices](https://tkdodo.eu/blog/effective-react-query-keys)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)

---

_Cette documentation est maintenue par l'équipe de développement HTF SunUp. Pour toute question ou suggestion, consultez l'équipe technique._
