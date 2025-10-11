import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/services/api';

// Types
export interface UnlockCondition {
  id: number;
  campaignId: number;
  description: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionFulfillment {
  condition: UnlockCondition;
  fulfillment: {
    id: number;
    validationId: number;
    conditionId: number;
    isFulfilled: boolean;
    fulfilledAt: string | null;
    fulfilledBy: number | null;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface CreateUnlockConditionDto {
  description: string;
  displayOrder?: number;
}

export interface UpdateConditionFulfillmentDto {
  isFulfilled: boolean;
  comment?: string;
}

// Hook pour récupérer les conditions d'une campagne
export function useUnlockConditions(campaignId: number | undefined) {
  return useQuery<UnlockCondition[]>({
    queryKey: ['unlock-conditions', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const response = await ApiClient.get(
        `/campaign-validation/campaigns/${campaignId}/conditions`,
      );
      if (!response.ok) throw new Error('Failed to fetch unlock conditions');
      return await response.json();
    },
    enabled: !!campaignId,
  });
}

// Hook pour créer des conditions de déblocage
export function useCreateUnlockConditions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      conditions,
    }: {
      campaignId: number;
      conditions: CreateUnlockConditionDto[];
    }) => {
      const response = await ApiClient.post(
        `/campaign-validation/campaigns/${campaignId}/conditions`,
        conditions,
      );
      if (!response.ok) throw new Error('Failed to create unlock conditions');
      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalider le cache pour cette campagne
      queryClient.invalidateQueries({
        queryKey: ['unlock-conditions', variables.campaignId],
      });
    },
  });
}

// Hook pour mettre à jour une condition
export function useUpdateUnlockCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conditionId,
      description,
      displayOrder,
    }: {
      conditionId: number;
      description?: string;
      displayOrder?: number;
    }) => {
      const response = await ApiClient.put(
        `/campaign-validation/conditions/${conditionId}`,
        { description, displayOrder },
      );
      if (!response.ok) throw new Error('Failed to update unlock condition');
      return await response.json();
    },
    onSuccess: () => {
      // Invalider toutes les conditions (on ne connaît pas forcément le campaignId)
      queryClient.invalidateQueries({
        queryKey: ['unlock-conditions'],
      });
    },
  });
}

// Hook pour supprimer une condition
export function useDeleteUnlockCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conditionId: number) => {
      const response = await ApiClient.delete(
        `/campaign-validation/conditions/${conditionId}`,
      );
      if (!response.ok) throw new Error('Failed to delete unlock condition');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['unlock-conditions'],
      });
    },
  });
}

// Hook pour récupérer les fulfillments d'une validation
export function useConditionFulfillments(validationId: number | undefined) {
  return useQuery<ConditionFulfillment[]>({
    queryKey: ['condition-fulfillments', validationId],
    queryFn: async () => {
      if (!validationId) return [];
      const response = await ApiClient.get(
        `/campaign-validation/${validationId}/condition-fulfillments`,
      );
      if (!response.ok)
        throw new Error('Failed to fetch condition fulfillments');
      return await response.json();
    },
    enabled: !!validationId,
  });
}

// Hook pour mettre à jour le fulfillment d'une condition
export function useUpdateConditionFulfillment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      validationId,
      conditionId,
      data,
    }: {
      validationId: number;
      conditionId: number;
      data: UpdateConditionFulfillmentDto;
    }) => {
      const response = await ApiClient.put(
        `/campaign-validation/${validationId}/conditions/${conditionId}/fulfill`,
        data,
      );
      if (!response.ok)
        throw new Error('Failed to update condition fulfillment');
      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalider les fulfillments de cette validation
      queryClient.invalidateQueries({
        queryKey: ['condition-fulfillments', variables.validationId],
      });
      // Aussi invalider les validations de campagne
      queryClient.invalidateQueries({
        queryKey: ['campaign-validations'],
      });
    },
  });
}
