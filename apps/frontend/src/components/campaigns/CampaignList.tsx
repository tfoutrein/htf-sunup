'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/types/campaigns';
import { campaignService } from '@/services/campaigns';
import { Card, Button, Badge } from '@/components/ui';
import CampaignForm from './CampaignForm';

interface CampaignListProps {
  onCampaignSelect?: (campaign: Campaign) => void;
}

export default function CampaignList({ onCampaignSelect }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setSelectedCampaign(null);
    setShowForm(true);
  };

  const handleEditClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowForm(true);
  };

  const handleDeleteClick = async (campaign: Campaign) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer la campagne "${campaign.name}" ?`,
      )
    ) {
      return;
    }

    try {
      await campaignService.deleteCampaign(campaign.id);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Erreur lors de la suppression',
      );
    }
  };

  const handleFormSuccess = (campaign: Campaign) => {
    if (selectedCampaign) {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? campaign : c)),
      );
    } else {
      setCampaigns((prev) => [...prev, campaign]);
    }
  };

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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <p className="text-red-600 text-sm mb-2">{error}</p>
        <Button onClick={fetchCampaigns} size="sm">
          Réessayer
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Gestion des campagnes
        </h2>
        <Button
          onClick={handleCreateClick}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          Nouvelle campagne
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune campagne
          </h3>
          <p className="text-gray-500 mb-4">
            Commencez par créer votre première campagne de défis.
          </p>
          <Button
            onClick={handleCreateClick}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Créer une campagne
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {campaign.name}
                    </h3>
                    <Badge color={getStatusColor(campaign.status)} size="sm">
                      {getStatusLabel(campaign.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {campaign.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    Du{' '}
                    {new Date(campaign.startDate).toLocaleDateString('fr-FR')}{' '}
                    au {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="bordered"
                    onClick={() =>
                      onCampaignSelect
                        ? onCampaignSelect(campaign)
                        : (window.location.href = `/campaigns/${campaign.id}`)
                    }
                    className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                  >
                    Gérer
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    onClick={() => handleEditClick(campaign)}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    onClick={() => handleDeleteClick(campaign)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CampaignForm
        campaign={selectedCampaign}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
