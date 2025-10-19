'use client';

import { useState, useEffect } from 'react';
import {
  useMarkVersionSeen,
  useLatestUnseenAppVersion,
} from './useAppVersions';
import type { AppVersion } from '../types/app-versions';
import { getToken } from '../utils/auth';

export const useReleaseNotesPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<AppVersion | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const markVersionSeenMutation = useMarkVersionSeen();

  // Vérifier l'authentification avant de faire la requête
  useEffect(() => {
    setIsAuthenticated(!!getToken());
  }, []);

  // Utiliser l'API réelle pour récupérer la dernière version non vue
  // Ne charger que si l'utilisateur est authentifié
  const {
    data: unseenVersion,
    isLoading,
    error,
  } = useLatestUnseenAppVersion(isAuthenticated);

  useEffect(() => {
    const checkForNewVersion = () => {
      // Si on a une version non vue et qu'elle n'est pas déjà affichée
      if (unseenVersion && !isLoading && !error) {
        setCurrentVersion(unseenVersion);
        setIsOpen(true);
      }
    };

    // Attendre un peu après le chargement initial pour ne pas bloquer l'interface
    const timer = setTimeout(checkForNewVersion, 2000);

    return () => clearTimeout(timer);
  }, [unseenVersion, isLoading, error]);

  const markAsSeen = async () => {
    if (!currentVersion) return;

    try {
      // Utiliser l'API pour marquer la version comme vue
      await markVersionSeenMutation.mutateAsync(currentVersion.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors du marquage de la version comme vue:', error);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    currentVersion,
    markAsSeen,
    closeModal,
    isLoading: markVersionSeenMutation.isPending,
  };
};
