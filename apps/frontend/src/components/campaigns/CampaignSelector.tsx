'use client';

import { Campaign } from '@/types/campaigns';
import { useCampaigns, useActiveCampaigns } from '@/hooks/useCampaigns';
import { Card, Badge } from '@/components/ui';

interface CampaignSelectorProps {
  selectedCampaign?: Campaign | null;
  onCampaignSelect: (campaign: Campaign | null) => void;
  showInactive?: boolean;
}

export default function CampaignSelector({
  selectedCampaign,
  onCampaignSelect,
  showInactive = false,
}: CampaignSelectorProps) {
  const {
    data: campaigns = [],
    isLoading: loading,
    error,
  } = showInactive ? useCampaigns() : useActiveCampaigns();

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'draft':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Terminée';
      case 'draft':
        return 'Brouillon';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <p className="text-red-600 text-sm">
          {error instanceof Error
            ? error.message
            : 'Erreur lors du chargement des campagnes'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Campagnes</h3>
        {selectedCampaign && (
          <button
            onClick={() => onCampaignSelect(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Désélectionner
          </button>
        )}
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-4 text-center text-gray-500">
          Aucune campagne disponible
        </Card>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCampaign?.id === campaign.id
                  ? 'ring-2 ring-amber-500 bg-amber-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onCampaignSelect(campaign)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {campaign.name}
                    </h4>
                    <Badge color={getStatusColor(campaign.status)} size="sm">
                      {getStatusLabel(campaign.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {campaign.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    Du{' '}
                    {new Date(campaign.startDate).toLocaleDateString('fr-FR')}{' '}
                    au {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
