import { useState } from 'react';
import { Card, CardBody, Badge } from '@/components/ui';
import { Accordion, AccordionItem } from '@heroui/react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
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
    <div className="mt-8 sm:mt-12">
      <Accordion
        variant="splitted"
        className="px-0"
        selectedKeys={isOpen ? ['statistics'] : []}
        onSelectionChange={(keys) => {
          setIsOpen(Array.from(keys).includes('statistics'));
        }}
      >
        <AccordionItem
          key="statistics"
          aria-label="Mes Statistiques"
          title={
            <div className="flex items-center gap-3">
              <ChartBarIcon className="w-6 h-6 text-indigo-600" />
              <span className="text-xl font-bold text-gray-800">
                Mes Statistiques
              </span>
            </div>
          }
          className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg"
          classNames={{
            trigger: 'py-4 px-6 hover:bg-gray-50/50 transition-colors',
            content: 'px-6 pb-6',
            title: 'text-left',
          }}
        >
          <div className="space-y-6">
            {/* Cartes de Streaks et Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StreaksCard userStreaks={userStreaks} />
              <BadgesCard userBadges={userBadges} />
            </div>

            {/* Carte de Progression détaillée */}
            <ProgressCard campaignStats={campaignStats} />
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
