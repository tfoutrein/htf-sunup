import { Card, CardBody } from '@/components/ui';
import { ClockIcon } from '@heroicons/react/24/outline';
import { CampaignStats } from '@/types/dashboard';

interface ProgressCardProps {
  campaignStats: CampaignStats;
}

export const ProgressCard = ({ campaignStats }: ProgressCardProps) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-gray-600" />
          Progression dans la campagne
        </h3>

        <div className="space-y-4">
          {/* Barre de progression générale */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progression générale</span>
              <span className="font-semibold">
                {Math.round(
                  (campaignStats.stats.totalEarnedEuros /
                    campaignStats.stats.maxPossibleEuros) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-400 to-amber-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (campaignStats.stats.totalEarnedEuros /
                      campaignStats.stats.maxPossibleEuros) *
                      100,
                    100,
                  )}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {campaignStats.stats.totalEarnedEuros.toFixed(2)}€ gagnés
              </span>
              <span>
                {campaignStats.stats.maxPossibleEuros.toFixed(2)}€ maximum
              </span>
            </div>
          </div>

          {/* Informations de la campagne */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">
              {campaignStats.campaign.name}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Début:</span>
                <br />
                <span className="font-medium">
                  {new Date(
                    campaignStats.campaign.startDate,
                  ).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Fin:</span>
                <br />
                <span className="font-medium">
                  {new Date(campaignStats.campaign.endDate).toLocaleDateString(
                    'fr-FR',
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
