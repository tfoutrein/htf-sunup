'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService } from '@/services/campaigns';
import { Action } from '@/types/campaigns';
import { challengeKeys } from './useChallenges';

// Query Keys
export const actionKeys = {
  all: ['actions'] as const,
  lists: () => [...actionKeys.all, 'list'] as const,
  list: (challengeId: number) =>
    [...actionKeys.lists(), { challengeId }] as const,
  details: () => [...actionKeys.all, 'detail'] as const,
  detail: (id: number) => [...actionKeys.details(), id] as const,
};

// Queries
export function useChallengeActions(challengeId: number) {
  return useQuery({
    queryKey: actionKeys.list(challengeId),
    queryFn: () => campaignService.getChallengeActions(challengeId),
    enabled: !!challengeId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Mutations
export function useCreateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (actionData: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>) =>
      campaignService.createAction(actionData),
    onSuccess: (newAction) => {
      // Invalidate actions list for this challenge
      queryClient.invalidateQueries({
        queryKey: actionKeys.list(newAction.challengeId),
      });

      // Add the new action to cache
      queryClient.setQueryData(actionKeys.detail(newAction.id), newAction);

      // Invalidate challenge with actions if it exists
      queryClient.invalidateQueries({
        queryKey: challengeKeys.withActions(newAction.challengeId),
      });
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Action> }) =>
      campaignService.updateAction(id, data),
    onSuccess: (updatedAction) => {
      // Update the specific action in cache
      queryClient.setQueryData(
        actionKeys.detail(updatedAction.id),
        updatedAction,
      );

      // Invalidate actions list for this challenge
      queryClient.invalidateQueries({
        queryKey: actionKeys.list(updatedAction.challengeId),
      });

      // Invalidate challenge with actions
      queryClient.invalidateQueries({
        queryKey: challengeKeys.withActions(updatedAction.challengeId),
      });
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => campaignService.deleteAction(id),
    onSuccess: (_, deletedId) => {
      // Remove the action from cache
      queryClient.removeQueries({ queryKey: actionKeys.detail(deletedId) });

      // Invalidate all action lists
      queryClient.invalidateQueries({ queryKey: actionKeys.lists() });

      // Invalidate challenge with actions cache
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}
