'use client';

import { useState, useEffect } from 'react';
import { useMarkVersionSeen } from './useAppVersions';
import { getLatestUnseenVersion } from '../data/release-notes';
import { versionTrackingService } from '../utils/versionTracking';
import type { AppVersion } from '../types/app-versions';

export const useReleaseNotesPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<AppVersion | null>(null);
  const markVersionSeenMutation = useMarkVersionSeen();

  // Pour le développement, utiliser les données mockées
  // En production, utiliser useLatestUnseenAppVersion() hook
  useEffect(() => {
    const checkForNewVersion = () => {
      // Temporairement utiliser les données mockées pour le développement
      const unseenVersion = getLatestUnseenVersion();

      if (unseenVersion) {
        // Vérifier si l'utilisateur a déjà vu cette version
        const hasSeenVersion = versionTrackingService.hasSeenVersion(
          unseenVersion.version,
        );

        if (!hasSeenVersion) {
          setCurrentVersion(unseenVersion);
          setIsOpen(true);
        }
      }
    };

    // Attendre un peu après le chargement initial pour ne pas bloquer l'interface
    const timer = setTimeout(checkForNewVersion, 2000);

    return () => clearTimeout(timer);
  }, []);

  const markAsSeen = async () => {
    if (!currentVersion) return;

    try {
      // En production, utiliser l'API
      // await markVersionSeenMutation.mutateAsync(currentVersion.id);

      // Pour le développement, utiliser le service de tracking
      versionTrackingService.markVersionAsSeen(currentVersion.version);

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
