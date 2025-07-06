import { Card, CardBody, Progress } from '@/components/ui';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import { Action } from '@/types/dashboard';
import {
  calculateCompletionPercentage,
  getProgressMessage,
  allTodayActionsCompleted,
} from '@/utils/dashboard';
import { PROGRESS_MESSAGES } from '@/constants/dashboard';

interface ProgressSectionProps {
  challengeActions: Action[];
  userActions: any[];
}

export const ProgressSection = ({
  challengeActions,
  userActions,
}: ProgressSectionProps) => {
  const completionPercentage = calculateCompletionPercentage(
    challengeActions,
    userActions,
  );
  const completedCount = challengeActions.filter(
    (action) =>
      userActions.find((ua) => ua.actionId === action.id)?.completed || false,
  ).length;
  const totalCount = challengeActions.length;
  const allCompleted = allTodayActionsCompleted(challengeActions, userActions);
  const progressMessage = getProgressMessage(completionPercentage);

  return (
    <Card className="mb-6 sm:mb-8 bg-white/80 backdrop-blur-sm shadow-lg border-0">
      <CardBody className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Actions du défi d'aujourd'hui
          </h2>
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              {completedCount}/{totalCount} actions
            </span>
          </div>
        </div>

        <Progress
          value={completionPercentage}
          className="mb-3 sm:mb-4"
          aria-label="Progression des actions du défi d'aujourd'hui"
          classNames={{
            indicator: 'bg-gradient-to-r from-orange-400 to-amber-400',
          }}
        />

        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
          <span>{progressMessage}</span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>

        {/* Message de félicitations */}
        {allCompleted && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl text-center">
            <StarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-green-800 font-semibold text-sm sm:text-base">
              {PROGRESS_MESSAGES.COMPLETE}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
