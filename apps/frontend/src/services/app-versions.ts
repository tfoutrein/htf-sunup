import { ApiClient } from './api';
import type {
  AppVersion,
  CreateAppVersionDto,
  MarkVersionSeenDto,
} from '../types/app-versions';

export const appVersionsService = {
  // Récupérer toutes les versions
  getAll: async (): Promise<AppVersion[]> => {
    const response = await ApiClient.get('/app-versions');
    if (!response.ok) {
      throw new Error('Failed to fetch app versions');
    }
    return response.json();
  },

  // Récupérer les versions actives
  getActive: async (): Promise<AppVersion[]> => {
    const response = await ApiClient.get('/app-versions/active');
    if (!response.ok) {
      throw new Error('Failed to fetch active app versions');
    }
    return response.json();
  },

  // Récupérer la dernière version
  getLatest: async (): Promise<AppVersion | null> => {
    const response = await ApiClient.get('/app-versions/latest');
    if (!response.ok) {
      throw new Error('Failed to fetch latest app version');
    }
    return response.json();
  },

  // Récupérer les versions non vues par l'utilisateur actuel
  getUnseenVersions: async (): Promise<AppVersion[]> => {
    const response = await ApiClient.get('/app-versions/unseen');
    if (!response.ok) {
      throw new Error('Failed to fetch unseen app versions');
    }
    return response.json();
  },

  // Récupérer la dernière version non vue par l'utilisateur actuel
  getLatestUnseenVersion: async (): Promise<AppVersion | null> => {
    const response = await ApiClient.get('/app-versions/unseen/latest');
    if (!response.ok) {
      throw new Error('Failed to fetch latest unseen app version');
    }
    return response.json();
  },

  // Marquer une version comme vue
  markVersionSeen: async (versionId: number): Promise<void> => {
    const data: MarkVersionSeenDto = { versionId };
    const response = await ApiClient.post('/app-versions/mark-seen', data);
    if (!response.ok) {
      throw new Error('Failed to mark version as seen');
    }
  },

  // Récupérer une version spécifique
  getById: async (id: number): Promise<AppVersion> => {
    const response = await ApiClient.get(`/app-versions/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch app version ${id}`);
    }
    return response.json();
  },

  // Créer une nouvelle version (dev uniquement)
  create: async (data: CreateAppVersionDto): Promise<AppVersion> => {
    const response = await ApiClient.post('/app-versions', data);
    if (!response.ok) {
      throw new Error('Failed to create app version');
    }
    return response.json();
  },

  // Mettre à jour une version (dev uniquement)
  update: async (
    id: number,
    data: Partial<CreateAppVersionDto>,
  ): Promise<AppVersion> => {
    const response = await ApiClient.patch(`/app-versions/${id}`, data);
    if (!response.ok) {
      throw new Error(`Failed to update app version ${id}`);
    }
    return response.json();
  },

  // Supprimer une version (dev uniquement)
  delete: async (id: number): Promise<void> => {
    const response = await ApiClient.delete(`/app-versions/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to delete app version ${id}`);
    }
  },
};
