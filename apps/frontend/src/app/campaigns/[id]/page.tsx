'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated, getUser } from '@/utils/auth';
import { Campaign, Challenge, CampaignWithChallenges } from '@/types/campaigns';
import { useCampaignWithChallenges } from '@/hooks/useCampaigns';
import { Card, Button, Badge } from '@/components/ui';
import { CampaignCalendar, CampaignVideoPlayer } from '@/components/campaigns';

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = parseInt(params.id as string);

  const [user, setUser] = useState<any>(null);

  // TanStack Query hook
  const {
    data: campaign,
    isLoading: loading,
    error,
  } = useCampaignWithChallenges(campaignId);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      const currentUser = getUser();
      if (!currentUser || currentUser.role !== 'manager') {
        if (currentUser?.role === 'fbo') {
          router.push('/fbo/dashboard');
        } else {
          router.push('/login');
        }
        return;
      }

      setUser(currentUser);
    };

    checkAuth();
  }, [campaignId, router]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || (!loading && !campaign)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center border-red-200 bg-red-50">
            <p className="text-red-600 mb-4">
              {error instanceof Error
                ? error.message
                : error || 'Campagne introuvable'}
            </p>
            <Button onClick={() => router.push('/campaigns')}>
              Retour aux campagnes
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="bordered"
                onClick={() => router.push('/campaigns')}
                className="p-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <Badge
                color={getStatusColor(campaign?.status || 'draft')}
                className="ml-auto"
              >
                {getStatusLabel(campaign?.status || 'draft')}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 drop-shadow-sm mb-4">
              {campaign?.name}
            </h1>

            <p className="text-gray-700 mb-4">{campaign?.description}</p>

            {/* Vidéo de présentation */}
            {campaign?.presentationVideoUrl && (
              <div className="mb-6">
                <CampaignVideoPlayer
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  showInModal={true}
                />
              </div>
            )}

            <div className="text-sm text-gray-600">
              Du{' '}
              {campaign?.startDate
                ? new Date(campaign.startDate).toLocaleDateString('fr-FR')
                : ''}{' '}
              au{' '}
              {campaign?.endDate
                ? new Date(campaign.endDate).toLocaleDateString('fr-FR')
                : ''}
            </div>
          </div>

          {/* Calendrier de campagne */}
          {campaign && (
            <CampaignCalendar
              campaign={campaign}
              challenges={campaign.challenges}
              onCreateChallenge={() => {}} // Fonction vide car maintenant géré via navigation directe
              onEditChallenge={() => {}} // Fonction vide car maintenant géré via navigation directe
            />
          )}
        </div>
      </div>
    </div>
  );
}
