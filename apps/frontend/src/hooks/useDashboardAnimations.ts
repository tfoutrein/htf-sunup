import { useState, useEffect, useRef } from 'react';
import { ANIMATION_DURATIONS } from '@/constants/dashboard';

export const useDashboardAnimations = (
  totalEarnings: number,
  isLoading: boolean = false,
) => {
  // États pour les animations
  const [isMobile, setIsMobile] = useState(false);
  const [isMoneyUpdated, setIsMoneyUpdated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [nextChallengeAnimated, setNextChallengeAnimated] = useState(false);
  const [showNextChallengeEmphasis, setShowNextChallengeEmphasis] =
    useState(false);
  const [completedActionsCollapsed, setCompletedActionsCollapsed] =
    useState(true);

  // Refs pour détecter les changements
  const previousEarnedAmountRef = useRef<number | null>(null);
  const previousShouldShowNextRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animation des gains
  useEffect(() => {
    if (totalEarnings !== undefined && !isLoading) {
      const currentAmount = totalEarnings;
      const previousAmount = previousEarnedAmountRef.current;

      console.log('💰 Détection changement cagnotte:', {
        currentAmount,
        previousAmount,
        isLoading,
        isInitialized: isInitializedRef.current,
        hasIncrease: previousAmount !== null && currentAmount > previousAmount,
        isFirstLoad: previousAmount === null,
      });

      // Si c'est la première initialisation avec des données chargées, on marque comme initialisé sans animation
      if (!isInitializedRef.current && previousAmount === null) {
        console.log("🔄 Initialisation des données - pas d'animation");
        previousEarnedAmountRef.current = currentAmount;
        isInitializedRef.current = true;
        return;
      }

      // Si le montant a augmenté ET que nous sommes initialisés ET pas en chargement
      if (
        isInitializedRef.current &&
        previousAmount !== null &&
        currentAmount > previousAmount
      ) {
        console.log(
          '🎉 Animation déclenchée - montant augmenté de',
          previousAmount,
          'à',
          currentAmount,
        );

        // Déclencher l'animation
        setIsMoneyUpdated(true);
        setShowConfetti(true);

        // Revenir à la normale après le délai configuré
        setTimeout(() => {
          setIsMoneyUpdated(false);
        }, ANIMATION_DURATIONS.MONEY_UPDATE);

        // Arrêter les confettis après le délai configuré
        setTimeout(() => {
          setShowConfetti(false);
        }, ANIMATION_DURATIONS.CONFETTI);
      }

      // Mettre à jour la valeur précédente seulement si initialisé
      if (isInitializedRef.current) {
        previousEarnedAmountRef.current = currentAmount;
      }
    }
  }, [totalEarnings, isLoading]);

  // Animation pour l'apparition du bloc "prochains défis"
  const triggerNextChallengeAnimation = (shouldShowNextChallenges: boolean) => {
    const currentShouldShow = shouldShowNextChallenges;
    const previousShouldShow = previousShouldShowNextRef.current;

    // Si le bloc prochains défis vient d'apparaître (transition false -> true)
    if (currentShouldShow && !previousShouldShow && !nextChallengeAnimated) {
      console.log('🌟 Animation prochains défis déclenchée!');

      // Déclencher l'animation d'emphase
      setShowNextChallengeEmphasis(true);
      setNextChallengeAnimated(true);

      // Revenir à la taille normale après le délai configuré
      setTimeout(() => {
        setShowNextChallengeEmphasis(false);
      }, ANIMATION_DURATIONS.NEXT_CHALLENGE_EMPHASIS);
    }

    // Si toutes les actions sont terminées, fermer l'accordéon des actions
    if (currentShouldShow) {
      setCompletedActionsCollapsed(true);
    }

    // Mettre à jour la valeur précédente
    previousShouldShowNextRef.current = currentShouldShow;
  };

  // Fonction pour déclencher manuellement l'animation des gains (pour test)
  const triggerTestAnimation = () => {
    console.log("🧪 Test manuel de l'animation avec confettis");
    setIsMoneyUpdated(true);
    setShowConfetti(true);
    setTimeout(
      () => setIsMoneyUpdated(false),
      ANIMATION_DURATIONS.MONEY_UPDATE,
    );
    setTimeout(() => setShowConfetti(false), ANIMATION_DURATIONS.CONFETTI);
  };

  return {
    // États d'animation
    isMobile,
    isMoneyUpdated,
    showConfetti,
    nextChallengeAnimated,
    showNextChallengeEmphasis,
    completedActionsCollapsed,

    // Actions
    setCompletedActionsCollapsed,
    triggerNextChallengeAnimation,
    triggerTestAnimation,
  };
};
