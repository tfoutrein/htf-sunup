'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Campaign, Challenge } from '@/types/campaigns';
import { Card } from '@/components/ui';

interface CampaignCalendarProps {
  campaign: Campaign;
  challenges: Challenge[];
  onCreateChallenge: (date: string) => void;
  onEditChallenge: (challenge: Challenge) => void;
}

export default function CampaignCalendar({
  campaign,
  challenges,
  onCreateChallenge,
  onEditChallenge,
}: CampaignCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const startDate = new Date(campaign.startDate);
    return new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  });

  // Fonction utilitaire pour formater les dates en local (évite les problèmes de fuseau horaire)
  const formatDateToLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Récupérer les défis par date
  const challengesByDate = challenges.reduce(
    (acc, challenge) => {
      const date = challenge.date.split('T')[0];
      acc[date] = challenge;
      return acc;
    },
    {} as Record<string, Challenge>,
  );

  const isDateInCampaign = (date: Date) => {
    const dateStr = formatDateToLocal(date);
    const startDate = campaign.startDate.split('T')[0];
    const endDate = campaign.endDate.split('T')[0];
    return dateStr >= startDate && dateStr <= endDate;
  };

  const handleDateClick = (date: Date) => {
    if (!isDateInCampaign(date)) return;

    const dateStr = formatDateToLocal(date);
    const existingChallenge = challengesByDate[dateStr];

    if (existingChallenge) {
      // Naviguer vers la page de détail du défi pour gérer les actions
      router.push(
        `/campaigns/${campaign.id}/challenges/${existingChallenge.id}`,
      );
    } else {
      // Naviguer vers la page de création de défi avec la date présélectionnée
      router.push(`/campaigns/${campaign.id}/challenges/new?date=${dateStr}`);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Jours avant le premier du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Tous les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  // Vérifier si le mois courant contient des dates de campagne
  const monthHasCampaignDates = days.some(
    (date) => date && isDateInCampaign(date),
  );

  return (
    <Card className="p-3 sm:p-4 md:p-6">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Calendrier de la campagne
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Cliquez sur une date libre pour créer un défi, ou sur un défi existant
          pour le modifier
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className="p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
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
          </button>

          <h3 className="text-base sm:text-lg font-semibold capitalize text-gray-900 dark:text-gray-100">
            {monthYear}
          </h3>

          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className="p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(
            (day, index) => (
              <div
                key={day}
                className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'][index]}
                </span>
              </div>
            ),
          )}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={index}
                  className="h-16 sm:h-20 md:h-24 border-r border-b border-gray-100 dark:border-gray-700"
                ></div>
              );
            }

            const dateStr = formatDateToLocal(date);
            const isInCampaign = isDateInCampaign(date);
            const challenge = challengesByDate[dateStr];
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDateClick(date)}
                disabled={!isInCampaign}
                className={`
                  h-16 sm:h-20 md:h-24 p-1 sm:p-2 border-r border-b border-gray-100 dark:border-gray-700 text-left transition-colors
                  ${
                    isInCampaign
                      ? challenge
                        ? 'bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer'
                        : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                      : 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                  }
                  ${isToday ? 'ring-1 sm:ring-2 ring-amber-400 dark:ring-amber-600' : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  {/* Numéro du jour */}
                  <span
                    className={`
                    text-xs sm:text-sm font-medium mb-0.5 sm:mb-1
                    ${
                      isInCampaign
                        ? challenge
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-600'
                    }
                    ${isToday ? 'font-bold' : ''}
                  `}
                  >
                    {date.getDate()}
                  </span>

                  {/* Défi existant */}
                  {challenge && (
                    <div className="flex-1 min-h-0">
                      <div className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs sm:text-xs p-0.5 sm:p-1 rounded truncate leading-tight">
                        <span className="hidden sm:inline">
                          {challenge.title}
                        </span>
                        <span className="sm:hidden">Défi</span>
                      </div>
                    </div>
                  )}

                  {/* Indicateur pour les dates libres dans la campagne */}
                  {isInCampaign && !challenge && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                        <svg
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-amber-200 dark:bg-amber-800 rounded"></div>
          <span>Défi existant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
            <svg
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <span>Date libre (cliquer pour créer)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <span>Hors campagne</span>
        </div>
      </div>

      {!monthHasCampaignDates && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Ce mois ne contient aucune date de la campagne. La campagne se
            déroule du{' '}
            {new Date(campaign.startDate).toLocaleDateString('fr-FR')} au{' '}
            {new Date(campaign.endDate).toLocaleDateString('fr-FR')}.
          </p>
        </div>
      )}
    </Card>
  );
}
