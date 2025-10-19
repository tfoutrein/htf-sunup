'use client';

import { useState } from 'react';
import { Card, CardBody, Badge } from '@/components/ui';
import {
  CalendarIcon,
  ClockIcon,
  TrophyIcon,
  LockClosedIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useUnlockConditions } from '@/hooks/useUnlockConditions';

interface CampaignDetailsAccordionProps {
  campaign: {
    id: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    bonusesEnabled: boolean;
  };
  challengeCount?: number;
}

export default function CampaignDetailsAccordion({
  campaign,
  challengeCount = 0,
}: CampaignDetailsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Utiliser le hook pour récupérer les conditions
  const { data: unlockConditions = [], isLoading: loading } =
    useUnlockConditions(campaign.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateDuration = () => {
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const duration = calculateDuration();

  return (
    <Card className="mb-8 sm:mb-10 bg-white/80 backdrop-blur-sm shadow-lg border-0">
      <CardBody className="p-0">
        {/* Header cliquable */}
        <div
          className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <InformationCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Détails de la campagne
                </h3>
                <p className="text-sm text-gray-600">
                  {campaign.name}
                </p>
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
          <div className="p-4 sm:p-6 space-y-6">
            {/* Description */}
            {campaign.description && (
              <div>
                <p className="text-gray-700 leading-relaxed">
                  {campaign.description}
                </p>
              </div>
            )}

            {/* Informations principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date de début */}
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      Date de début
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {formatDate(campaign.startDate)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Date de fin */}
              <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
                      Date de fin
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {formatDate(campaign.endDate)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Durée et défis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Durée */}
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      Durée
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {duration} jour{duration > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Nombre de défis */}
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrophyIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                      Défis à réaliser
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {challengeCount} défi{challengeCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bonus */}
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Bonus quotidiens
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {campaign.bonusesEnabled
                      ? 'Tu peux déclarer des bonus (paniers, parrainages) en plus des défis'
                      : 'Seuls les défis quotidiens sont disponibles pour cette campagne'}
                  </p>
                </div>
                <Badge
                  className={
                    campaign.bonusesEnabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }
                >
                  {campaign.bonusesEnabled ? 'Activés' : 'Désactivés'}
                </Badge>
              </div>
            </Card>

            {/* Conditions de déblocage */}
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement...</p>
              </div>
            ) : unlockConditions.length > 0 ? (
              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-amber-300">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <LockClosedIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      🎯 Conditions pour débloquer ta cagnotte
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Tu dois remplir ces conditions pour valider ta cagnotte à la
                      fin de la campagne :
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mt-4">
                  {unlockConditions
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((condition, index) => (
                      <li
                        key={condition.id}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700 flex-1">
                          {condition.description}
                        </p>
                      </li>
                    ))}
                </ul>

                <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800">
                    ⚠️ <strong>Important :</strong> Ces conditions seront vérifiées
                    par ton manager à la fin de la campagne pour valider ta
                    cagnotte.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-4 bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Aucune condition de déblocage définie pour cette campagne. 🎉
                </p>
              </Card>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

