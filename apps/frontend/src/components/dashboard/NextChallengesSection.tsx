import { Accordion, AccordionItem, Chip } from '@heroui/react';
import { CalendarDaysIcon, CameraIcon } from '@heroicons/react/24/outline';
import { Challenge, Action } from '@/types/dashboard';
import { ACTION_TYPE_CONFIG } from '@/constants/dashboard';

interface NextChallengesSectionProps {
  nextChallenge: Challenge;
  nextChallengeActions: Action[];
  showNextChallengeEmphasis: boolean;
  onActionClick: (action: Action) => void;
}

export const NextChallengesSection = ({
  nextChallenge,
  nextChallengeActions,
  showNextChallengeEmphasis,
  onActionClick,
}: NextChallengesSectionProps) => {
  return (
    <div
      className={`mb-6 sm:mb-8 transition-all duration-1000 ${
        showNextChallengeEmphasis
          ? 'scale-105 shadow-2xl shadow-indigo-300/50 ring-4 ring-indigo-200 animate-pulse'
          : ''
      }`}
    >
      <Accordion variant="splitted" className="px-0">
        <AccordionItem
          key="next-challenge"
          aria-label="Prochain défi"
          title={
            <div className="flex items-center gap-3">
              <CalendarDaysIcon
                className={`w-5 h-5 text-indigo-600 ${showNextChallengeEmphasis ? 'animate-bounce' : ''}`}
              />
              <span
                className={`text-lg font-semibold text-indigo-900 ${showNextChallengeEmphasis ? 'text-xl' : ''} transition-all duration-500`}
              >
                🌟 Prochain défi -{' '}
                {new Date(nextChallenge.date).toLocaleDateString('fr-FR')}
              </span>
              {showNextChallengeEmphasis && (
                <span className="text-2xl animate-spin">✨</span>
              )}
            </div>
          }
          className={`bg-gradient-to-br from-indigo-50 to-purple-100 border-0 shadow-lg rounded-lg ${
            showNextChallengeEmphasis
              ? 'bg-gradient-to-br from-indigo-100 to-purple-200 border-2 border-indigo-300'
              : ''
          } transition-all duration-1000`}
          classNames={{
            trigger: 'py-4 px-6',
            content: 'px-6 pb-6',
            title: 'text-left',
          }}
        >
          <div className="bg-white/60 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-indigo-800 mb-2 text-sm sm:text-base">
              {nextChallenge.title}
            </h3>
            <p className="text-indigo-700 text-xs sm:text-sm">
              {nextChallenge.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                💰 {nextChallenge.valueInEuro} €
              </span>
              <span className="text-xs text-indigo-600">
                • Cliquez sur les actions pour les valider à l'avance !
              </span>
            </div>
          </div>

          {nextChallengeActions.length > 0 && (
            <div>
              <h4 className="font-medium text-indigo-800 mb-3 text-sm">
                Actions à préparer ({nextChallengeActions.length}) :
              </h4>
              <div className="grid gap-3">
                {nextChallengeActions
                  .sort((a, b) => a.order - b.order)
                  .map((action) => {
                    const config = ACTION_TYPE_CONFIG[action.type];

                    return (
                      <div
                        key={action.id}
                        className="bg-white/70 rounded-lg p-3 border border-indigo-200 hover:border-indigo-300 transition-all duration-200 cursor-pointer hover:shadow-md"
                        onClick={() => onActionClick(action)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">
                            {config.icon}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Chip
                                color={config.color}
                                variant="flat"
                                size="sm"
                                className="text-xs"
                              >
                                {config.label}
                              </Chip>
                              <span className="text-xs text-gray-500">
                                Action {action.order}
                              </span>
                            </div>
                            <h5 className="font-medium text-gray-800 text-sm mb-1">
                              {action.title}
                            </h5>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {action.description}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <CameraIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 text-sm">💡</span>
                  <div>
                    <p className="text-xs sm:text-sm text-amber-800 font-medium">
                      Astuce : Validez vos actions à l'avance !
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Vous pouvez déjà préparer et valider ces actions avec des
                      preuves. Elles seront comptabilisées le jour du défi ! 🚀
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  );
};
