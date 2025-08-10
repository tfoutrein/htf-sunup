// Utilitaires pour le tracking des versions vues par l'utilisateur
// En développement, utilise localStorage
// En production, sera remplacé par les appels API

const STORAGE_KEY = 'htf-sunup-seen-versions';

export interface SeenVersionData {
  version: string;
  seenAt: string;
  userId?: number; // Pour une future intégration avec l'API
}

export const versionTrackingService = {
  // Récupérer les versions vues
  getSeenVersions: (): SeenVersionData[] => {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des versions vues:', error);
      return [];
    }
  },

  // Vérifier si une version a été vue
  hasSeenVersion: (version: string): boolean => {
    const seenVersions = versionTrackingService.getSeenVersions();
    return seenVersions.some((v) => v.version === version);
  },

  // Marquer une version comme vue
  markVersionAsSeen: (version: string, userId?: number): void => {
    if (typeof window === 'undefined') return;

    try {
      const seenVersions = versionTrackingService.getSeenVersions();

      // Éviter les doublons
      if (!versionTrackingService.hasSeenVersion(version)) {
        const newEntry: SeenVersionData = {
          version,
          seenAt: new Date().toISOString(),
          userId,
        };

        const updatedVersions = [...seenVersions, newEntry];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVersions));
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la version comme vue:', error);
    }
  },

  // Nettoyer les anciennes entrées (optionnel)
  cleanOldEntries: (daysToKeep: number = 90): void => {
    if (typeof window === 'undefined') return;

    try {
      const seenVersions = versionTrackingService.getSeenVersions();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const filteredVersions = seenVersions.filter((v) => {
        const seenDate = new Date(v.seenAt);
        return seenDate >= cutoffDate;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredVersions));
    } catch (error) {
      console.error('Erreur lors du nettoyage des versions anciennes:', error);
    }
  },

  // Réinitialiser le tracking (dev/debug)
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },

  // Statistiques de debug
  getStats: () => {
    const seenVersions = versionTrackingService.getSeenVersions();
    return {
      totalVersionsSeen: seenVersions.length,
      oldestSeen: seenVersions.length > 0 ? seenVersions[0]?.seenAt : null,
      mostRecentSeen:
        seenVersions.length > 0
          ? seenVersions[seenVersions.length - 1]?.seenAt
          : null,
    };
  },
};
