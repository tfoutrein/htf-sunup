import { useQuery } from '@tanstack/react-query';
import { campaignValidationService } from '@/services/campaign-validation';
import { CampaignValidation } from '@/types/campaign-validation';

export const useMyCampaignValidation = (campaignId: number | null) => {
  const {
    data: validation,
    isLoading,
    error,
  } = useQuery<CampaignValidation, Error>({
    queryKey: ['myCampaignValidation', campaignId],
    queryFn: () =>
      campaignValidationService.getMyCampaignValidationStatus(campaignId!),
    enabled: !!campaignId,
  });

  return {
    validation,
    isLoading,
    error,
  };
};
