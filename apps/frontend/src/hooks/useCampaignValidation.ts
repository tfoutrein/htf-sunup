import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignValidationService } from '@/services/campaign-validation';
import {
  CampaignValidation,
  UpdateCampaignValidationRequest,
} from '@/types/campaign-validation';
import { toast } from 'sonner';

export const useCampaignValidation = (campaignId: number) => {
  const queryClient = useQueryClient();

  const {
    data: validations,
    isLoading,
    error,
  } = useQuery<CampaignValidation[], Error>({
    queryKey: ['campaignValidations', campaignId],
    queryFn: () => campaignValidationService.getCampaignValidations(campaignId),
    enabled: !!campaignId,
  });

  const updateValidationMutation = useMutation<
    CampaignValidation,
    Error,
    { userId: number; data: UpdateCampaignValidationRequest }
  >({
    mutationFn: ({ userId, data }) =>
      campaignValidationService.updateCampaignValidation(
        userId,
        campaignId,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['campaignValidations', campaignId],
      });
      toast.success('Validation de campagne mise à jour !');
    },
    onError: (err) => {
      toast.error(`Erreur lors de la mise à jour: ${err.message}`);
    },
  });

  return {
    validations,
    isLoading,
    error,
    updateValidation: updateValidationMutation.mutate,
    isUpdating: updateValidationMutation.isPending,
  };
};
