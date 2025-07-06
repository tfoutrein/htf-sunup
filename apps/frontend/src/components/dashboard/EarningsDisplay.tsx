import { Counter } from '@/components/ui';
import { EarningsData } from '@/types/dashboard';
import { CONFETTI_COLORS } from '@/constants/dashboard';
import ConfettiExplosion from 'react-confetti-explosion';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface EarningsDisplayProps {
  earningsData: EarningsData;
  isMoneyUpdated: boolean;
  showConfetti: boolean;
  isMobile?: boolean;
  triggerTestAnimation: () => void;
}

interface ConfettiPortalProps {
  show: boolean;
  isMobile: boolean;
}

const ConfettiPortal = ({ show, isMobile }: ConfettiPortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const confettiConfig = {
    particleCount: isMobile ? 60 : 80,
    force: isMobile ? 0.8 : 1.0,
    duration: isMobile ? 4000 : 4500,
    width: isMobile ? 500 : 800,
    height: isMobile ? 800 : 1000,
    colors: CONFETTI_COLORS,
  };

  if (!mounted || typeof window === 'undefined') return null;

  return show
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <ConfettiExplosion {...confettiConfig} />
        </div>,
        document.body,
      )
    : null;
};

export const EarningsDisplay = ({
  earningsData,
  isMoneyUpdated,
  showConfetti,
  isMobile = false,
  triggerTestAnimation,
}: EarningsDisplayProps) => {
  const {
    campaignEarnings,
    totalBonusAmount,
    totalEarnings,
    maxPossibleEarnings,
  } = earningsData;

  const commonClasses = `transition-all duration-700 relative ${
    isMoneyUpdated
      ? 'scale-125 shadow-2xl bg-gradient-to-r from-green-400/30 to-emerald-400/30 border-2 border-yellow-300'
      : ''
  }`;

  if (isMobile) {
    return (
      <>
        <ConfettiPortal show={showConfetti} isMobile={true} />
        <div
          className={`sm:hidden sticky top-0 z-50 bg-gradient-to-r from-orange-400 to-amber-400 px-4 py-2 shadow-md ${
            isMoneyUpdated
              ? 'scale-125 shadow-2xl bg-gradient-to-r from-green-400 to-emerald-400 border-b-4 border-yellow-300'
              : ''
          } transition-all duration-700 relative`}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-yellow-200 text-lg transition-all duration-700 ${
                  isMoneyUpdated ? 'animate-bounce text-3xl' : ''
                }`}
              >
                💰
              </span>

              <div className="flex items-center gap-2 text-white">
                <div className="flex items-center -space-x-1">
                  <Counter
                    value={Math.floor(totalEarnings)}
                    places={[10, 1]}
                    fontSize={isMoneyUpdated ? 28 : 20}
                    padding={3}
                    gap={0}
                    textColor="white"
                    fontWeight={800}
                    gradientHeight={6}
                    gradientFrom="transparent"
                    gradientTo="transparent"
                  />
                  <span
                    className={`text-white font-bold transition-all duration-700 ${
                      isMoneyUpdated ? 'text-3xl' : 'text-xl'
                    }`}
                  >
                    .
                  </span>
                  <Counter
                    value={Math.floor((totalEarnings * 100) % 100)}
                    places={[10, 1]}
                    fontSize={isMoneyUpdated ? 28 : 20}
                    padding={3}
                    gap={0}
                    textColor="white"
                    fontWeight={800}
                    gradientHeight={6}
                    gradientFrom="transparent"
                    gradientTo="transparent"
                  />
                </div>
                <span
                  className={`text-white font-bold transition-all duration-700 ${
                    isMoneyUpdated ? 'text-3xl' : 'text-xl'
                  }`}
                >
                  €
                </span>
              </div>

              {isMoneyUpdated && (
                <div className="absolute -top-2 -right-2">
                  <div className="text-yellow-300 animate-spin text-xl">⭐</div>
                  <div className="absolute top-0.5 right-0.5 text-yellow-200 animate-pulse">
                    ✨
                  </div>
                </div>
              )}
            </div>

            <div className="text-orange-100 text-xs text-center">
              <div className="flex justify-center gap-4">
                <span>Défis: {campaignEarnings.toFixed(2)}€</span>
                {totalBonusAmount > 0 && (
                  <span>Bonus: {totalBonusAmount.toFixed(2)}€</span>
                )}
              </div>
              <div>/ {maxPossibleEarnings.toFixed(2)} € possible</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConfettiPortal show={showConfetti} isMobile={false} />
      <div
        className={`hidden sm:flex bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 w-auto ${commonClasses}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-yellow-200 text-lg transition-all duration-700 ${
              isMoneyUpdated ? 'animate-bounce text-3xl' : ''
            }`}
          >
            💰
          </span>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1">
                <Counter
                  value={Math.floor(totalEarnings)}
                  places={[10, 1]}
                  fontSize={isMoneyUpdated ? 32 : 24}
                  padding={4}
                  gap={0}
                  textColor="white"
                  fontWeight={800}
                  gradientHeight={6}
                  gradientFrom="transparent"
                  gradientTo="transparent"
                />
                <span
                  className={`text-white font-bold transition-all duration-700 ${
                    isMoneyUpdated ? 'text-4xl' : 'text-2xl'
                  }`}
                >
                  .
                </span>
                <Counter
                  value={Math.floor((totalEarnings * 100) % 100)}
                  places={[10, 1]}
                  fontSize={isMoneyUpdated ? 32 : 24}
                  padding={4}
                  gap={0}
                  textColor="white"
                  fontWeight={800}
                  gradientHeight={6}
                  gradientFrom="transparent"
                  gradientTo="transparent"
                />
              </div>
              <span
                className={`text-white font-bold transition-all duration-700 ${
                  isMoneyUpdated ? 'text-4xl' : 'text-2xl'
                }`}
              >
                €
              </span>
            </div>

            <div className="text-orange-100 text-xs space-y-0.5">
              <div className="flex justify-between">
                <span>Défis: {campaignEarnings.toFixed(2)}€</span>
                {totalBonusAmount > 0 && (
                  <span>Bonus: {totalBonusAmount.toFixed(2)}€</span>
                )}
              </div>
              <div>sur {maxPossibleEarnings.toFixed(2)} € possible</div>
            </div>
          </div>

          {isMoneyUpdated && (
            <div className="absolute -top-2 -right-2">
              <div className="text-yellow-300 animate-spin text-2xl">⭐</div>
              <div className="absolute top-1 right-1 text-yellow-200 animate-pulse text-lg">
                ✨
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
