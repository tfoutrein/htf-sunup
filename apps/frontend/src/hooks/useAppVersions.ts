import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appVersionsService } from '../services/app-versions';
import type { AppVersion, CreateAppVersionDto } from '../types/app-versions';

// Query keys
export const appVersionKeys = {
  all: ['app-versions'] as const,
  lists: () => [...appVersionKeys.all, 'list'] as const,
  active: () => [...appVersionKeys.all, 'active'] as const,
  latest: () => [...appVersionKeys.all, 'latest'] as const,
  unseen: () => [...appVersionKeys.all, 'unseen'] as const,
  unseenLatest: () => [...appVersionKeys.all, 'unseen', 'latest'] as const,
  detail: (id: number) => [...appVersionKeys.all, 'detail', id] as const,
};

// Hook pour récupérer toutes les versions
export const useAppVersions = () => {
  return useQuery({
    queryKey: appVersionKeys.lists(),
    queryFn: appVersionsService.getAll,
  });
};

// Hook pour récupérer les versions actives
export const useActiveAppVersions = () => {
  return useQuery({
    queryKey: appVersionKeys.active(),
    queryFn: appVersionsService.getActive,
  });
};

// Hook pour récupérer la dernière version
export const useLatestAppVersion = () => {
  return useQuery({
    queryKey: appVersionKeys.latest(),
    queryFn: appVersionsService.getLatest,
  });
};

// Hook pour récupérer les versions non vues
export const useUnseenAppVersions = () => {
  return useQuery({
    queryKey: appVersionKeys.unseen(),
    queryFn: appVersionsService.getUnseenVersions,
  });
};

// Hook pour récupérer la dernière version non vue
export const useLatestUnseenAppVersion = () => {
  return useQuery({
    queryKey: appVersionKeys.unseenLatest(),
    queryFn: appVersionsService.getLatestUnseenVersion,
  });
};

// Hook pour récupérer une version spécifique
export const useAppVersion = (id: number) => {
  return useQuery({
    queryKey: appVersionKeys.detail(id),
    queryFn: () => appVersionsService.getById(id),
    enabled: !!id,
  });
};

// Hook pour marquer une version comme vue
export const useMarkVersionSeen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appVersionsService.markVersionSeen,
    onSuccess: () => {
      // Invalider les queries liées aux versions non vues
      queryClient.invalidateQueries({ queryKey: appVersionKeys.unseen() });
      queryClient.invalidateQueries({
        queryKey: appVersionKeys.unseenLatest(),
      });
    },
  });
};

// Hook pour créer une nouvelle version (dev)
export const useCreateAppVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appVersionsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appVersionKeys.all });
    },
  });
};

// Hook pour mettre à jour une version (dev)
export const useUpdateAppVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateAppVersionDto>;
    }) => appVersionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appVersionKeys.all });
    },
  });
};

// Hook pour supprimer une version (dev)
export const useDeleteAppVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appVersionsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appVersionKeys.all });
    },
  });
};
