'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService } from '@/services/campaigns';
import { Campaign, CampaignWithChallenges } from '@/types/campaigns';

// Query Keys
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

// Queries
export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.lists(),
    queryFn: () => campaignService.getCampaigns(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useActiveCampaigns() {
  return useQuery({
    queryKey: campaignKeys.active(),
    queryFn: () => campaignService.getActiveCampaigns(),
    staleTime: 5 * 60 * 1000, // 5 minutes (plus stable)
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    refetchOnWindowFocus: false, // Éviter les refetch intempestifs
    refetchOnMount: false, // Ne pas refetch au mount si en cache
    retry: 2, // Limite les retry en cas d'erreur
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCampaign(id: number) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignService.getCampaign(id),
    enabled: !!id,
  });
}

export function useCampaignWithChallenges(id: number) {
  return useQuery({
    queryKey: campaignKeys.withChallenges(id),
    queryFn: () => campaignService.getCampaignWithChallenges(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      campaignData: Omit<
        Campaign,
        'id' | 'createdBy' | 'createdAt' | 'updatedAt'
      >,
    ) => campaignService.createCampaign(campaignData),
    onMutate: async (newCampaignData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });

      // Snapshot the previous campaigns
      const previousCampaigns = queryClient.getQueryData(campaignKeys.lists());

      // Optimistically update campaigns list with temporary campaign
      const tempCampaign: Campaign = {
        id: Date.now(), // temporary ID
        ...newCampaignData,
        createdBy: 1, // will be set by server
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        challengeCount: 0,
        totalDays: 0,
      };

      queryClient.setQueryData(
        campaignKeys.lists(),
        (old: Campaign[] | undefined) => {
          return old ? [...old, tempCampaign] : [tempCampaign];
        },
      );

      return { previousCampaigns, tempCampaign };
    },
    onError: (err, newCampaignData, context) => {
      // On error, rollback to previous campaigns
      if (context?.previousCampaigns) {
        queryClient.setQueryData(
          campaignKeys.lists(),
          context.previousCampaigns,
        );
      }
    },
    onSuccess: (newCampaign, variables, context) => {
      // Replace temporary campaign with real one
      queryClient.setQueryData(
        campaignKeys.lists(),
        (old: Campaign[] | undefined) => {
          if (!old) return [newCampaign];
          return old.map((campaign) =>
            campaign.id === context?.tempCampaign?.id ? newCampaign : campaign,
          );
        },
      );

      // Add the new campaign to cache
      queryClient.setQueryData(
        campaignKeys.detail(newCampaign.id),
        newCampaign,
      );

      // Only invalidate active campaigns if the new campaign is active
      if (newCampaign.status === 'active') {
        queryClient.invalidateQueries({ queryKey: campaignKeys.active() });
      }
    },
    onSettled: () => {
      // More selective invalidation - only refetch lists
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Campaign> }) =>
      campaignService.updateCampaign(id, data),
    onSuccess: (updatedCampaign) => {
      // Update the specific campaign in cache
      queryClient.setQueryData(
        campaignKeys.detail(updatedCampaign.id),
        updatedCampaign,
      );

      // Update the campaign in lists cache directly
      queryClient.setQueryData(
        campaignKeys.lists(),
        (old: Campaign[] | undefined) => {
          if (!old) return [updatedCampaign];
          return old.map((campaign) =>
            campaign.id === updatedCampaign.id ? updatedCampaign : campaign,
          );
        },
      );

      // Only invalidate active campaigns if status changed to/from active
      queryClient.invalidateQueries({ queryKey: campaignKeys.active() });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => campaignService.deleteCampaign(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });
      await queryClient.cancelQueries({ queryKey: campaignKeys.active() });

      // Snapshot previous data
      const previousCampaigns = queryClient.getQueryData(campaignKeys.lists());
      const previousActiveCampaigns = queryClient.getQueryData(
        campaignKeys.active(),
      );

      // Optimistically remove campaign from lists
      queryClient.setQueryData(
        campaignKeys.lists(),
        (old: Campaign[] | undefined) => {
          return old ? old.filter((campaign) => campaign.id !== deletedId) : [];
        },
      );

      queryClient.setQueryData(
        campaignKeys.active(),
        (old: Campaign[] | undefined) => {
          return old ? old.filter((campaign) => campaign.id !== deletedId) : [];
        },
      );

      return { previousCampaigns, previousActiveCampaigns };
    },
    onError: (err, deletedId, context) => {
      // On error, rollback to previous data
      if (context?.previousCampaigns) {
        queryClient.setQueryData(
          campaignKeys.lists(),
          context.previousCampaigns,
        );
      }
      if (context?.previousActiveCampaigns) {
        queryClient.setQueryData(
          campaignKeys.active(),
          context.previousActiveCampaigns,
        );
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the campaign from cache
      queryClient.removeQueries({ queryKey: campaignKeys.detail(deletedId) });
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.active() });
    },
  });
}

// Presentation Video Mutations
export function useUploadPresentationVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, file }: { campaignId: number; file: File }) =>
      campaignService.uploadPresentationVideo(campaignId, file),
    onSuccess: (updatedCampaign) => {
      // Update the campaign in cache
      queryClient.setQueryData(
        campaignKeys.detail(updatedCampaign.id),
        updatedCampaign,
      );

      // Update the campaign in lists cache
      queryClient.setQueryData(
        campaignKeys.lists(),
        (old: Campaign[] | undefined) => {
          if (!old) return [updatedCampaign];
          return old.map((campaign) =>
            campaign.id === updatedCampaign.id ? updatedCampaign : campaign,
          );
        },
      );

      // Invalidate active campaigns if needed
      if (updatedCampaign.status === 'active') {
        queryClient.invalidateQueries({ queryKey: campaignKeys.active() });
      }
    },
  });
}

export function useDeletePresentationVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: number) =>
      campaignService.deletePresentationVideo(campaignId),
    onSuccess: (updatedCampaign) => {
      // Update the campaign in cache
      queryClient.setQueryData(
        campaignKeys.detail(updatedCampaign.id),
        updatedCampaign,
      );

      // Update the campaign in lists cache
      queryClient.setQueryData(
        campaignKeys.lists(),
        (old: Campaign[] | undefined) => {
          if (!old) return [updatedCampaign];
          return old.map((campaign) =>
            campaign.id === updatedCampaign.id ? updatedCampaign : campaign,
          );
        },
      );

      // Invalidate active campaigns if needed
      if (updatedCampaign.status === 'active') {
        queryClient.invalidateQueries({ queryKey: campaignKeys.active() });
      }
    },
  });
}
