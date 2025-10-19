import { useState } from 'react';
import { Card, CardBody } from '@/components/ui';
import {
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { UserStreaks, UserBadge, CampaignStats } from '@/types/dashboard';
import { StreaksCard } from './StreaksCard';
import { BadgesCard } from './BadgesCard';
import { ProgressCard } from './ProgressCard';

interface StatisticsSectionProps {
  campaignStats: CampaignStats | null;
  userStreaks: UserStreaks | null;
  userBadges: UserBadge[];
}

export const StatisticsSection = ({
  campaignStats,
  userStreaks,
  userBadges,
}: StatisticsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!campaignStats) {
    return null;
  }

  return (
    <Card className="mb-8 sm:mb-10 bg-white/80 backdrop-blur-sm shadow-lg border-0">
      <CardBody className="p-0">
        {/* Header cliquable */}
        <div
          className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Mes Statistiques
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>
        </div>

        {/* Contenu dépliable */}
        {isOpen && (
          <div className="p-4 sm:p-6 pt-0 border-t border-gray-100">
            <div className="space-y-6">
              {/* Cartes de Streaks et Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StreaksCard userStreaks={userStreaks} />
                <BadgesCard userBadges={userBadges} />
              </div>

              {/* Carte de Progression détaillée */}
              <ProgressCard campaignStats={campaignStats} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
