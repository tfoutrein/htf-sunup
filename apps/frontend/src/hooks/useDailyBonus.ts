'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyBonusService } from '@/services/daily-bonus';
import {
  DailyBonus,
  CampaignBonusConfig,
  CreateDailyBonusDto,
  UpdateDailyBonusDto,
  CreateCampaignBonusConfigDto,
  DailyBonusStats,
} from '@/types/daily-bonus';

// Query Keys
export const dailyBonusKeys = {
  all: ['daily-bonus'] as const,
  myBonuses: () => [...dailyBonusKeys.all, 'my-bonuses'] as const,
  myStats: () => [...dailyBonusKeys.all, 'my-stats'] as const,
  myStat: (campaignId: number) =>
    [...dailyBonusKeys.myStats(), campaignId] as const,
  details: () => [...dailyBonusKeys.all, 'detail'] as const,
  detail: (id: number) => [...dailyBonusKeys.details(), id] as const,
  campaignBonuses: () => [...dailyBonusKeys.all, 'campaign-bonuses'] as const,
  campaignBonus: (campaignId: number) =>
    [...dailyBonusKeys.campaignBonuses(), campaignId] as const,
  userCampaignBonuses: () =>
    [...dailyBonusKeys.all, 'user-campaign-bonuses'] as const,
  userCampaignBonus: (userId: number, campaignId: number) =>
    [...dailyBonusKeys.userCampaignBonuses(), userId, campaignId] as const,
  configs: () => [...dailyBonusKeys.all, 'configs'] as const,
  config: (campaignId: number) =>
    [...dailyBonusKeys.configs(), campaignId] as const,
};

// Queries - FBO Functions
export function useMyBonuses() {
  return useQuery({
    queryKey: dailyBonusKeys.myBonuses(),
    queryFn: () => dailyBonusService.getMyBonuses(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useMyBonusStats(campaignId: number) {
  return useQuery({
    queryKey: dailyBonusKeys.myStat(campaignId),
    queryFn: () => dailyBonusService.getMyStats(campaignId),
    enabled: !!campaignId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useDailyBonus(id: number) {
  return useQuery({
    queryKey: dailyBonusKeys.detail(id),
    queryFn: () => dailyBonusService.getDailyBonus(id),
    enabled: !!id,
  });
}

// Queries - Manager Functions
export function useCampaignBonuses(campaignId: number) {
  return useQuery({
    queryKey: dailyBonusKeys.campaignBonus(campaignId),
    queryFn: () => dailyBonusService.getCampaignBonuses(campaignId),
    enabled: !!campaignId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useBonusConfig(campaignId: number) {
  return useQuery({
    queryKey: dailyBonusKeys.config(campaignId),
    queryFn: () => dailyBonusService.getBonusConfig(campaignId),
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000, // 5 minutes - config changes less frequently
  });
}

// Queries - User Campaign Bonuses
export function useUserCampaignBonuses(userId: number, campaignId: number) {
  return useQuery({
    queryKey: dailyBonusKeys.userCampaignBonus(userId, campaignId),
    queryFn: () => dailyBonusService.getUserCampaignBonuses(userId, campaignId),
    enabled: !!userId && !!campaignId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Mutations - Daily Bonus CRUD
export function useCreateDailyBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bonusData: CreateDailyBonusDto) =>
      dailyBonusService.createDailyBonus(bonusData),
    onMutate: async (newBonusData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dailyBonusKeys.myBonuses() });

      // Snapshot the previous bonuses
      const previousBonuses = queryClient.getQueryData(
        dailyBonusKeys.myBonuses(),
      );

      // Optimistically update bonuses list with temporary bonus
      const tempBonus: DailyBonus = {
        id: Date.now(), // temporary ID
        userId: 0, // will be set by server
        ...newBonusData,
        amount: newBonusData.amount || '0.00',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        dailyBonusKeys.myBonuses(),
        (old: DailyBonus[] | undefined) => {
          return old ? [tempBonus, ...old] : [tempBonus];
        },
      );

      return { previousBonuses, tempBonus };
    },
    onError: (err, newBonusData, context) => {
      // On error, rollback to previous bonuses
      if (context?.previousBonuses) {
        queryClient.setQueryData(
          dailyBonusKeys.myBonuses(),
          context.previousBonuses,
        );
      }
    },
    onSuccess: (newBonus, variables, context) => {
      // Replace temporary bonus with real one
      queryClient.setQueryData(
        dailyBonusKeys.myBonuses(),
        (old: DailyBonus[] | undefined) => {
          if (!old) return [newBonus];
          return old.map((bonus) =>
            bonus.id === context?.tempBonus?.id ? newBonus : bonus,
          );
        },
      );

      // Add the new bonus to cache
      queryClient.setQueryData(dailyBonusKeys.detail(newBonus.id), newBonus);

      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: dailyBonusKeys.myStat(newBonus.campaignId),
      });
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: dailyBonusKeys.myBonuses() });
    },
  });
}

export function useUpdateDailyBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDailyBonusDto }) =>
      dailyBonusService.updateDailyBonus(id, data),
    onSuccess: (updatedBonus) => {
      // Update the specific bonus in cache
      queryClient.setQueryData(
        dailyBonusKeys.detail(updatedBonus.id),
        updatedBonus,
      );

      // Update in my bonuses list
      queryClient.setQueryData(
        dailyBonusKeys.myBonuses(),
        (old: DailyBonus[] | undefined) => {
          if (!old) return [updatedBonus];
          return old.map((bonus) =>
            bonus.id === updatedBonus.id ? updatedBonus : bonus,
          );
        },
      );

      // Update in campaign bonuses list (for managers)
      queryClient.setQueryData(
        dailyBonusKeys.campaignBonus(updatedBonus.campaignId),
        (old: DailyBonus[] | undefined) => {
          if (!old) return [updatedBonus];
          return old.map((bonus) =>
            bonus.id === updatedBonus.id ? updatedBonus : bonus,
          );
        },
      );

      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: dailyBonusKeys.myStat(updatedBonus.campaignId),
      });
    },
  });
}

export function useDeleteDailyBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dailyBonusService.deleteDailyBonus(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dailyBonusKeys.myBonuses() });

      // Snapshot previous data
      const previousBonuses = queryClient.getQueryData(
        dailyBonusKeys.myBonuses(),
      );

      // Optimistically remove bonus from list
      queryClient.setQueryData(
        dailyBonusKeys.myBonuses(),
        (old: DailyBonus[] | undefined) => {
          return old ? old.filter((bonus) => bonus.id !== deletedId) : [];
        },
      );

      return { previousBonuses };
    },
    onError: (err, deletedId, context) => {
      // On error, rollback to previous data
      if (context?.previousBonuses) {
        queryClient.setQueryData(
          dailyBonusKeys.myBonuses(),
          context.previousBonuses,
        );
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the bonus from cache
      queryClient.removeQueries({ queryKey: dailyBonusKeys.detail(deletedId) });
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: dailyBonusKeys.myBonuses() });
    },
  });
}

// Mutations - Proof upload
export function useUploadProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      dailyBonusService.uploadProof(id, file),
    onSuccess: (result, variables) => {
      // Invalidate the specific bonus to refetch updated data
      queryClient.invalidateQueries({
        queryKey: dailyBonusKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: dailyBonusKeys.myBonuses(),
      });
    },
  });
}

// Mutations - Bonus Configuration (Manager only)
export function useCreateBonusConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configData: CreateCampaignBonusConfigDto) =>
      dailyBonusService.createBonusConfig(configData),
    onSuccess: (newConfig) => {
      // Update config cache
      queryClient.setQueryData(
        dailyBonusKeys.config(newConfig.campaignId),
        newConfig,
      );
    },
  });
}

export function useUpdateBonusConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      configId,
      campaignId,
      data,
    }: {
      configId: number;
      campaignId: number;
      data: Partial<CreateCampaignBonusConfigDto>;
    }) => dailyBonusService.updateBonusConfig(configId, data),
    onSuccess: (updatedConfig, variables) => {
      // Update config cache
      queryClient.setQueryData(
        dailyBonusKeys.config(variables.campaignId),
        updatedConfig,
      );
    },
  });
}

// Main hook combining all daily bonus functionality
export function useDailyBonusActions() {
  const createBonus = useCreateDailyBonus();
  const updateBonus = useUpdateDailyBonus();
  const deleteBonus = useDeleteDailyBonus();
  const uploadProof = useUploadProof();
  const createConfig = useCreateBonusConfig();
  const updateConfig = useUpdateBonusConfig();

  return {
    // Data fetching
    useMyBonuses,
    useMyBonusStats,
    useDailyBonus,
    useCampaignBonuses,
    useUserCampaignBonuses,
    useBonusConfig,

    // Data fetching functions
    getUserCampaignBonuses:
      dailyBonusService.getUserCampaignBonuses.bind(dailyBonusService),

    // Mutations
    createBonus,
    updateBonus,
    deleteBonus,
    uploadProof,
    createConfig,
    updateConfig,

    // Computed states
    isLoading:
      createBonus.isPending ||
      updateBonus.isPending ||
      deleteBonus.isPending ||
      uploadProof.isPending,
    error:
      createBonus.error ||
      updateBonus.error ||
      deleteBonus.error ||
      uploadProof.error,
  };
}
