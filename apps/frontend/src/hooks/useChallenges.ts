'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService } from '@/services/campaigns';
import { Challenge, ChallengeWithActions } from '@/types/campaigns';
import { campaignKeys } from './useCampaigns';

// Query Keys
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

// Queries
export function useChallenges(campaignId?: number, date?: string) {
  return useQuery({
    queryKey: challengeKeys.list({ campaignId, date }),
    queryFn: () => campaignService.getChallenges(campaignId, date),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useTodayChallenges() {
  return useQuery({
    queryKey: challengeKeys.today(),
    queryFn: () => campaignService.getTodayChallenges(),
    staleTime: 30 * 1000, // 30 seconds for today's challenges
  });
}

export function useChallenge(id: number) {
  return useQuery({
    queryKey: challengeKeys.detail(id),
    queryFn: () => campaignService.getChallenge(id),
    enabled: !!id,
  });
}

export function useChallengeWithActions(id: number) {
  return useQuery({
    queryKey: challengeKeys.withActions(id),
    queryFn: () => campaignService.getChallengeWithActions(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      challengeData: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>,
    ) => campaignService.createChallenge(challengeData),
    onSuccess: (newChallenge) => {
      // Invalidate challenges lists
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: challengeKeys.today() });

      // Add the new challenge to cache
      queryClient.setQueryData(
        challengeKeys.detail(newChallenge.id),
        newChallenge,
      );

      // Invalidate campaign with challenges if it exists
      if (newChallenge.campaignId) {
        queryClient.invalidateQueries({
          queryKey: campaignKeys.withChallenges(newChallenge.campaignId),
        });
      }
    },
  });
}

export function useUpdateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Challenge> }) =>
      campaignService.updateChallenge(id, data),
    onSuccess: (updatedChallenge) => {
      // Update the specific challenge in cache
      queryClient.setQueryData(
        challengeKeys.detail(updatedChallenge.id),
        updatedChallenge,
      );

      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: challengeKeys.today() });

      // Invalidate campaign with challenges if it exists
      if (updatedChallenge.campaignId) {
        queryClient.invalidateQueries({
          queryKey: campaignKeys.withChallenges(updatedChallenge.campaignId),
        });
      }
    },
  });
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => campaignService.deleteChallenge(id),
    onSuccess: (_, deletedId) => {
      // Remove the challenge from cache
      queryClient.removeQueries({ queryKey: challengeKeys.detail(deletedId) });

      // Invalidate all challenge lists
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: challengeKeys.today() });

      // Invalidate campaign with challenges cache
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}
