import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getToken, logout } from '@/utils/auth';
import { ApiClient, API_ENDPOINTS } from '@/services/api';
import { useActiveCampaigns } from '@/hooks/useCampaigns';
import { useTodayChallenges, useNextChallenge } from '@/hooks/useChallenges';
import { useChallengeActions } from '@/hooks/useActions';
import { useMyBonuses } from '@/hooks/useDailyBonus';
import {
  DashboardUser,
  UserAction,
  CampaignStats,
  UserStreaks,
  UserBadge,
} from '@/types/dashboard';
import { calculateBonusStats, calculateEarningsData } from '@/utils/dashboard';

export const useDashboardData = () => {
  const router = useRouter();

  // États principaux
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(
    null,
  );
  const [userStreaks, setUserStreaks] = useState<UserStreaks | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // TanStack Query hooks
  const { data: activeCampaigns = [], isLoading: campaignsLoading } =
    useActiveCampaigns();
  const { data: todayChallenges = [], isLoading: challengesLoading } =
    useTodayChallenges();
  const { data: myBonuses = [], isLoading: bonusesLoading } = useMyBonuses();

  // Derived state
  const activeCampaign = activeCampaigns[0] || null;
  const todayChallenge = todayChallenges[0] || null;

  // Hooks pour les actions et défis suivants
  const { data: challengeActions = [] } = useChallengeActions(
    todayChallenge?.id,
  );
  const { data: nextChallenge, isLoading: nextChallengeLoading } =
    useNextChallenge(activeCampaign?.id);
  const { data: nextChallengeActions = [] } = useChallengeActions(
    nextChallenge?.id,
  );

  // Calculs dérivés
  const bonusStats = calculateBonusStats(myBonuses);
  const earningsData = calculateEarningsData(
    campaignStats?.stats.totalEarnedEuros || 0,
    bonusStats.totalBonusAmount,
    campaignStats?.stats.maxPossibleEuros || 0,
  );

  // Gestion de l'authentification et chargement initial
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userData = getUser();
        const token = getToken();

        if (!userData || !token) {
          router.push('/login');
          return;
        }

        setUser(userData);

        // Charger les données de l'utilisateur
        if (activeCampaign) {
          await Promise.all([
            fetchUserActionsForChallenge(todayChallenge?.id, userData),
            fetchGamificationData(activeCampaign.id, userData),
          ]);
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    if (!campaignsLoading && !challengesLoading) {
      initializeUser();
    }
  }, [
    activeCampaign?.id, // ✅ Utiliser seulement l'ID pour éviter les boucles
    todayChallenge?.id, // ✅ Utiliser seulement l'ID pour éviter les boucles
    campaignsLoading,
    challengesLoading,
    router,
  ]);

  // Fonctions de fetch des données
  const fetchUserActionsForChallenge = async (
    challengeId: number | undefined,
    userData?: DashboardUser,
  ) => {
    if (!challengeId) {
      setUserActions([]);
      return;
    }

    try {
      const currentUser = userData || user;
      if (!currentUser) return;

      const endpoint = API_ENDPOINTS.ACTIONS_USER_CHALLENGE(
        currentUser.id,
        challengeId!,
      );
      const response = await ApiClient.get(endpoint);

      if (response.ok) {
        const data = await response.json();
        setUserActions(data);
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement des actions utilisateur:',
        error,
      );
      setUserActions([]);
    }
  };

  const fetchGamificationData = async (
    campaignId: number,
    userData?: DashboardUser,
  ) => {
    try {
      const currentUser = userData || user;
      if (!currentUser) return;

      // Fetch campaign stats
      const statsEndpoint = API_ENDPOINTS.ACTIONS_USER_CAMPAIGN_STATS(
        currentUser.id,
        campaignId,
      );
      const statsResponse = await ApiClient.get(statsEndpoint);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCampaignStats(statsData);
      }

      // Fetch user streaks
      if (currentUser.id) {
        try {
          const streaksEndpoint = `/actions/user/${currentUser.id}/streaks`;
          const streaksResponse = await ApiClient.get(streaksEndpoint);
          if (streaksResponse.ok) {
            const streaksData = await streaksResponse.json();
            setUserStreaks(streaksData);
          }
        } catch (streaksError) {
          console.error('Erreur lors du chargement des streaks:', streaksError);
          setUserStreaks(null);
        }

        // Fetch user badges
        try {
          const badgesEndpoint = `/actions/user/${currentUser.id}/badges`;
          const badgesResponse = await ApiClient.get(badgesEndpoint);
          if (badgesResponse.ok) {
            const badgesData = await badgesResponse.json();
            setUserBadges(badgesData);
          }
        } catch (badgesError) {
          console.error('Erreur lors du chargement des badges:', badgesError);
          setUserBadges([]);
        }
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement des données de gamification:',
        error,
      );
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const refetchUserActions = () => {
    if (todayChallenge?.id) {
      fetchUserActionsForChallenge(todayChallenge.id);
    }
  };

  const refetchGamificationData = () => {
    if (activeCampaign?.id) {
      fetchGamificationData(activeCampaign.id);
    }
  };

  return {
    // États
    user,
    userActions,
    campaignStats,
    userStreaks,
    userBadges,
    loading,

    // Données dérivées
    activeCampaign,
    todayChallenge,
    nextChallenge,
    challengeActions,
    nextChallengeActions,
    bonusStats,
    earningsData,
    myBonuses,

    // États de chargement
    campaignsLoading,
    challengesLoading,
    nextChallengeLoading,
    bonusesLoading,

    // Actions
    handleLogout,
    refetchUserActions,
    refetchGamificationData,
  };
};
