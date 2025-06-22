'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/types/campaigns';
import { campaignService } from '@/services/campaigns';
import { Card, Button, Badge, Progress } from '@/components/ui';
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
      <div className="space-y-4 p-4 sm:p-0">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-3 sm:flex sm:items-start sm:justify-between sm:space-y-0">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-2 sm:ml-4">
                <div className="h-8 bg-gray-200 rounded w-full sm:w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-full sm:w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-full sm:w-24"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-0">
        <Card className="p-6 border-red-200 bg-red-50 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Button
            onClick={fetchCampaigns}
            size="sm"
            className="w-full sm:w-auto"
          >
            🔄 Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-0">
      {/* Header responsive mobile-first */}
      <div className="space-y-3 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Gestion des campagnes
        </h2>
        <Button
          onClick={handleCreateClick}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <span className="sm:hidden">+ Nouvelle campagne</span>
          <span className="hidden sm:inline">Nouvelle campagne</span>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg
              className="mx-auto h-16 w-16 sm:h-12 sm:w-12 text-gray-400"
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
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            Aucune campagne
          </h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6 max-w-sm mx-auto">
            Commencez par créer votre première campagne de défis.
          </p>
          <Button
            onClick={handleCreateClick}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            🚀 Créer une campagne
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              {/* Layout mobile-first : vertical sur mobile, horizontal sur desktop */}
              <div className="space-y-3 sm:flex sm:items-start sm:justify-between sm:space-y-0 sm:relative">
                <div className="flex-1">
                  {/* Titre et badge responsive */}
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:gap-2 mb-3">
                    <h3 className="font-medium text-gray-900 text-base sm:text-lg">
                      {campaign.name}
                    </h3>
                    <Badge
                      color={getStatusColor(campaign.status)}
                      size="sm"
                      className="self-start sm:self-auto"
                    >
                      {getStatusLabel(campaign.status)}
                    </Badge>
                  </div>

                  {/* Description */}
                  {campaign.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Progress des défis - Mobile uniquement */}
                  {campaign.challengeCount !== undefined &&
                    campaign.totalDays !== undefined && (
                      <div className="mb-3 sm:hidden">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Défis créés</span>
                          <span>
                            {campaign.challengeCount}/{campaign.totalDays}
                          </span>
                        </div>
                        <Progress
                          value={
                            (campaign.challengeCount / campaign.totalDays) * 100
                          }
                          size="sm"
                          aria-label={`${campaign.challengeCount} défis créés sur ${campaign.totalDays} jours`}
                          classNames={{
                            indicator:
                              campaign.challengeCount === campaign.totalDays
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : campaign.challengeCount / campaign.totalDays >
                                    0.7
                                  ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                  : campaign.challengeCount /
                                        campaign.totalDays >
                                      0.3
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                    : 'bg-gradient-to-r from-red-400 to-rose-500',
                          }}
                        />
                      </div>
                    )}

                  {/* Dates plus lisibles sur mobile */}
                  <div className="text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:gap-1">
                      <span className="font-medium">Début:</span>
                      <span>
                        {new Date(campaign.startDate).toLocaleDateString(
                          'fr-FR',
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-1">
                      <span className="font-medium">Fin:</span>
                      <span>
                        {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions responsives : vertical sur mobile, horizontal sur desktop */}
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-2 sm:ml-4">
                  <Button
                    size="sm"
                    variant="bordered"
                    onClick={() =>
                      onCampaignSelect
                        ? onCampaignSelect(campaign)
                        : (window.location.href = `/campaigns/${campaign.id}`)
                    }
                    className="w-full sm:w-auto text-blue-600 hover:text-blue-700 hover:border-blue-300"
                  >
                    📊 Gérer
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    onClick={() => handleEditClick(campaign)}
                    className="w-full sm:w-auto"
                  >
                    ✏️ Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    onClick={() => handleDeleteClick(campaign)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    🗑️ Supprimer
                  </Button>
                </div>

                {/* Progress des défis - Desktop uniquement, en bas à droite */}
                {campaign.challengeCount !== undefined &&
                  campaign.totalDays !== undefined && (
                    <div className="hidden sm:block absolute bottom-0 right-0 w-48">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Défis créés</span>
                        <span>
                          {campaign.challengeCount}/{campaign.totalDays}
                        </span>
                      </div>
                      <Progress
                        value={
                          (campaign.challengeCount / campaign.totalDays) * 100
                        }
                        size="sm"
                        aria-label={`${campaign.challengeCount} défis créés sur ${campaign.totalDays} jours`}
                        classNames={{
                          indicator:
                            campaign.challengeCount === campaign.totalDays
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : campaign.challengeCount / campaign.totalDays >
                                  0.7
                                ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                : campaign.challengeCount / campaign.totalDays >
                                    0.3
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                  : 'bg-gradient-to-r from-red-400 to-rose-500',
                        }}
                      />
                    </div>
                  )}
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
