import { SunIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { EarningsDisplay } from './EarningsDisplay';
import {
  DashboardUser,
  Campaign,
  Challenge,
  EarningsData,
} from '@/types/dashboard';

interface DashboardHeaderProps {
  user: DashboardUser | null;
  activeCampaign: Campaign | null;
  todayChallenge: Challenge | null;
  earningsData: EarningsData;
  isMoneyUpdated: boolean;
  showConfetti: boolean;
  isMobile: boolean;
  triggerTestAnimation: () => void;
  onLogout: () => void;
}

export const DashboardHeader = ({
  user,
  activeCampaign,
  todayChallenge,
  earningsData,
  isMoneyUpdated,
  showConfetti,
  isMobile,
  triggerTestAnimation,
  onLogout,
}: DashboardHeaderProps) => {
  return (
    <>
      {/* Header - Mobile First */}
      <div className="bg-gradient-to-r from-orange-400 to-amber-400 text-white p-4 sm:p-6 shadow-lg relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <SunIcon className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              <span className="truncate">
                Salut {user?.name?.split(' ')[0]} ! ☀️
              </span>
              {/* Bouton de test temporaire - masqué sur mobile */}
              <button
                onClick={triggerTestAnimation}
                className="hidden sm:inline-block ml-2 text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                title="Test animation cagnotte"
              >
                🎉
              </button>
            </h1>
            <p className="text-orange-100 text-sm sm:text-base">
              {activeCampaign ? activeCampaign.name : "Tes défis t'attendent"}
            </p>
            {activeCampaign && (
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="animate-pulse">🟢</span>
                  Campagne Active
                </span>
              </div>
            )}
            {todayChallenge && (
              <div className="flex items-center gap-2 mt-1">
                <CalendarDaysIcon className="w-4 h-4" />
                <span className="text-orange-100 text-xs">
                  Défi du jour : {todayChallenge.title}
                </span>
              </div>
            )}
          </div>

          {/* Gains totaux - Desktop uniquement dans le header */}
          <EarningsDisplay
            earningsData={earningsData}
            isMoneyUpdated={isMoneyUpdated}
            showConfetti={showConfetti}
            isMobile={false}
            triggerTestAnimation={triggerTestAnimation}
            campaignName={activeCampaign?.name}
          />
        </div>
      </div>

      {/* Mobile Sticky Cagnotte - Version mobile séparée */}
      <EarningsDisplay
        earningsData={earningsData}
        isMoneyUpdated={isMoneyUpdated}
        showConfetti={showConfetti}
        isMobile={true}
        triggerTestAnimation={triggerTestAnimation}
        campaignName={activeCampaign?.name}
      />
    </>
  );
};
