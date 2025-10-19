import { Card, CardBody, CardHeader } from '@/components/ui';
import {
  CurrencyEuroIcon,
  TrophyIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { EarningsData } from '@/types/dashboard';

interface CampaignEarningsBreakdownProps {
  earningsData: EarningsData;
  campaignName?: string;
}

export const CampaignEarningsBreakdown = ({
  earningsData,
  campaignName,
}: CampaignEarningsBreakdownProps) => {
  const {
    campaignEarnings,
    totalBonusAmount,
    totalEarnings,
    maxPossibleEarnings,
  } = earningsData;

  const challengePercentage =
    maxPossibleEarnings > 0
      ? (campaignEarnings / maxPossibleEarnings) * 100
      : 0;

  const totalEarningsWithBonus = campaignEarnings + totalBonusAmount;
  const bonusPercentageOfTotal =
    totalEarningsWithBonus > 0
      ? (totalBonusAmount / totalEarningsWithBonus) * 100
      : 0;
  const challengePercentageOfTotal =
    totalEarningsWithBonus > 0
      ? (campaignEarnings / totalEarningsWithBonus) * 100
      : 0;

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CurrencyEuroIcon className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Ta Cagnotte {campaignName && `- ${campaignName}`}
            </h3>
            <p className="text-sm text-gray-600">
              Répartition de tes gains pour cette campagne
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Total de la cagnotte */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de la cagnotte</p>
              <p className="text-3xl font-bold text-amber-600">
                {totalEarnings.toFixed(2)} €
              </p>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </div>

        {/* Répartition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Défis complétés */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrophyIcon className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">
                Défis complétés
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-600 mb-1">
              {campaignEarnings.toFixed(2)} €
            </p>
            <div className="text-xs text-blue-600">
              {challengePercentageOfTotal.toFixed(0)}% du total
            </div>
            <div className="mt-2 bg-blue-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${challengePercentage}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {challengePercentage.toFixed(0)}% des défis complétés
            </p>
          </div>

          {/* Bonus quotidiens */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <GiftIcon className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-700">
                Bonus quotidiens
              </p>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-1">
              {totalBonusAmount.toFixed(2)} €
            </p>
            <div className="text-xs text-green-600">
              {bonusPercentageOfTotal.toFixed(0)}% du total
            </div>
            {totalBonusAmount > 0 && (
              <div className="mt-2 text-xs text-green-700">
                🎉 Super ! Continue comme ça !
              </div>
            )}
          </div>
        </div>

        {/* Message explicatif */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-700 mb-1">
                À savoir sur ta cagnotte
              </p>
              <ul className="text-xs text-purple-600 space-y-1">
                <li>✅ Cette cagnotte est spécifique à cette campagne</li>
                <li>
                  ✅ Chaque nouvelle campagne démarre avec une cagnotte à 0€
                </li>
                <li>
                  ✅ Tu peux gagner des euros en complétant les défis et en
                  déclarant des bonus
                </li>
                {maxPossibleEarnings > 0 && (
                  <li>
                    ✅ Objectif max possible : {maxPossibleEarnings.toFixed(2)}{' '}
                    € (défis uniquement)
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
