import type { AppVersion } from '../types/app-versions';

// Données statiques des release notes pour développement/test
// En production, ces données viendraient de l'API
export const mockReleaseNotes: AppVersion[] = [
  {
    id: 1,
    version: '1.2.0',
    title: 'Nouveau système de bonus quotidiens',
    releaseDate: '2025-08-10',
    isActive: true,
    isMajor: true,
    shortDescription:
      '🎉 Nouvelle fonctionnalité : Déclarez vos paniers et parrainages quotidiens ! Système de validation par vos managers et suivi de vos gains en temps réel.',
    fullReleaseNotes: `## 🎉 Nouvelles fonctionnalités

- **Bonus quotidiens** : Déclarez facilement vos paniers et parrainages du jour
- **Upload de preuves** : Photos et vidéos pour valider vos bonus auprès de votre manager
- **Validation manager** : Workflow complet d'approbation des bonus par vos managers
- **Compteur de gains** : Suivez vos euros gagnés en temps réel avec des animations fun

## ✨ Améliorations

- Interface plus fluide et responsive sur mobile
- Animations et effets visuels améliorés pour une expérience plus engageante
- Performance optimisée pour un chargement plus rapide

## 🐛 Corrections

- Correction des problèmes de synchronisation des données
- Amélioration de la stabilité générale de l'application`,
    createdAt: '2025-08-10T00:00:00Z',
    updatedAt: '2025-08-10T00:00:00Z',
  },
  {
    id: 2,
    version: '1.1.0',
    title: 'Système de preuves multiples',
    releaseDate: '2025-07-15',
    isActive: true,
    isMajor: false,
    shortDescription:
      '📸 Vous pouvez maintenant uploader plusieurs preuves par action ! Photos et vidéos acceptées.',
    fullReleaseNotes: `## 🚀 Améliorations

- **Upload multiple** : Ajoutez plusieurs preuves par action pour plus de flexibilité
- **Support vidéos** : En plus des photos, vous pouvez maintenant uploader des vidéos
- **Visionneuse améliorée** : Interface repensée pour visualiser toutes vos preuves
- **Gestion d'erreur renforcée** : Messages plus clairs en cas de problème d'upload

## 🔧 Améliorations techniques

- Optimisation du stockage des fichiers
- Meilleure compression des images
- Validation renforcée des types de fichiers`,
    createdAt: '2025-07-15T00:00:00Z',
    updatedAt: '2025-07-15T00:00:00Z',
  },
  {
    id: 3,
    version: '1.0.1',
    title: 'Corrections et optimisations',
    releaseDate: '2025-06-20',
    isActive: false, // Version ancienne
    isMajor: false,
    shortDescription:
      '🔧 Corrections de bugs et améliorations de performance pour une meilleure expérience.',
    fullReleaseNotes: `## 🐛 Corrections

- Correction du problème de déconnexion automatique
- Fix des notifications qui ne s'affichaient pas correctement
- Résolution des problèmes de synchronisation sur mobile

## ⚡ Optimisations

- Temps de chargement réduit de 30%
- Amélioration de la réactivité de l'interface
- Optimisation de la consommation de données`,
    createdAt: '2025-06-20T00:00:00Z',
    updatedAt: '2025-06-20T00:00:00Z',
  },
];

// Version actuelle la plus récente non vue (pour les tests)
export const getLatestUnseenVersion = (): AppVersion | null => {
  const activeVersions = mockReleaseNotes.filter((v) => v.isActive);
  return activeVersions.length > 0 ? activeVersions[0] : null;
};
