'use client';

import {
  Card,
  CardHeader,
  CardBody,
  Progress,
  Chip,
  Spinner,
} from '@heroui/react';
import {
  CurrencyEuroIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useMyBonusStats } from '@/hooks';
import { BONUS_TYPE_CONFIG } from '@/types/daily-bonus';

interface DailyBonusStatsProps {
  campaignId: number;
}

export function DailyBonusStats({ campaignId }: DailyBonusStatsProps) {
  const { data: stats, isLoading, error } = useMyBonusStats(campaignId);

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex justify-center items-center p-8">
          <Spinner size="lg" color="primary" />
        </CardBody>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-danger-200">
        <CardBody className="text-center p-6">
          <p className="text-danger-600">
            Erreur lors du chargement des statistiques
          </p>
        </CardBody>
      </Card>
    );
  }

  const approvalRate =
    stats.totalBonuses > 0
      ? Math.round((stats.approvedBonuses / stats.totalBonuses) * 100)
      : 0;

  const monthlyGrowth =
    stats.lastMonthAmount > 0
      ? Math.round(
          ((stats.thisMonthAmount - stats.lastMonthAmount) /
            stats.lastMonthAmount) *
            100,
        )
      : stats.thisMonthAmount > 0
        ? 100
        : 0;

  return (
    <div className="space-y-4">
      {/* Main Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Statistiques Bonus Quotidiens
            </h3>
          </div>
        </CardHeader>

        <CardBody className="pt-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Amount */}
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <CurrencyEuroIcon className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-700">
                {stats.totalAmount}€
              </div>
              <div className="text-xs text-amber-600">Total gagné</div>
            </div>

            {/* Total Bonuses */}
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <TrophyIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">
                {stats.totalBonuses}
              </div>
              <div className="text-xs text-blue-600">Bonus créés</div>
            </div>

            {/* Pending */}
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <ClockIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-700">
                {stats.pendingBonuses}
              </div>
              <div className="text-xs text-orange-600">En attente</div>
            </div>

            {/* Approved */}
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">
                {stats.approvedBonuses}
              </div>
              <div className="text-xs text-green-600">Approuvés</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bonus Types Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <h4 className="font-semibold text-gray-700">
              Répartition par type
            </h4>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="space-y-3">
              {/* Basket Bonuses */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {BONUS_TYPE_CONFIG.basket.emoji}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {BONUS_TYPE_CONFIG.basket.label}
                  </span>
                </div>
                <Chip size="sm" color="success" variant="flat">
                  {stats.basketBonuses}
                </Chip>
              </div>

              {/* Sponsorship Bonuses */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {BONUS_TYPE_CONFIG.sponsorship.emoji}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {BONUS_TYPE_CONFIG.sponsorship.label}
                  </span>
                </div>
                <Chip size="sm" color="primary" variant="flat">
                  {stats.sponsorshipBonuses}
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <h4 className="font-semibold text-gray-700">Performance</h4>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="space-y-4">
              {/* Approval Rate */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Taux d'approbation</span>
                  <span className="font-medium">{approvalRate}%</span>
                </div>
                <Progress
                  value={approvalRate}
                  color={
                    approvalRate >= 80
                      ? 'success'
                      : approvalRate >= 60
                        ? 'warning'
                        : 'danger'
                  }
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* Monthly Comparison */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Ce mois</div>
                  <div className="font-semibold text-gray-800">
                    {stats.thisMonthAmount}€
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Mois dernier</div>
                  <div className="font-semibold text-gray-800">
                    {stats.lastMonthAmount}€
                  </div>
                </div>
              </div>

              {/* Growth Indicator */}
              {monthlyGrowth !== 0 && (
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={`text-sm ${monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {monthlyGrowth > 0 ? '↗' : '↘'} {Math.abs(monthlyGrowth)}%
                  </span>
                  <span className="text-xs text-gray-500">vs mois dernier</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions Suggestions */}
      {stats.pendingBonuses > 0 && (
        <Card className="border-warning-200 bg-warning-50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-6 h-6 text-warning-600" />
              <div>
                <h4 className="font-medium text-warning-800">Action requise</h4>
                <p className="text-sm text-warning-700">
                  Vous avez {stats.pendingBonuses} bonus en attente. N'oubliez
                  pas d'ajouter vos preuves photo !
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {stats.rejectedBonuses > 0 && (
        <Card className="border-danger-200 bg-danger-50">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <XCircleIcon className="w-6 h-6 text-danger-600" />
              <div>
                <h4 className="font-medium text-danger-800">Bonus rejetés</h4>
                <p className="text-sm text-danger-700">
                  {stats.rejectedBonuses} bonus ont été rejetés. Consultez les
                  commentaires pour améliorer vos prochaines soumissions.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
