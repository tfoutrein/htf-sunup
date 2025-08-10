import { api } from './api';
import type {
  AppVersion,
  CreateAppVersionDto,
  MarkVersionSeenDto,
} from '../types/app-versions';

export const appVersionsService = {
  // Récupérer toutes les versions
  getAll: async (): Promise<AppVersion[]> => {
    const response = await api.get('/app-versions');
    return response.data;
  },

  // Récupérer les versions actives
  getActive: async (): Promise<AppVersion[]> => {
    const response = await api.get('/app-versions/active');
    return response.data;
  },

  // Récupérer la dernière version
  getLatest: async (): Promise<AppVersion | null> => {
    const response = await api.get('/app-versions/latest');
    return response.data;
  },

  // Récupérer les versions non vues par l'utilisateur actuel
  getUnseenVersions: async (): Promise<AppVersion[]> => {
    const response = await api.get('/app-versions/unseen');
    return response.data;
  },

  // Récupérer la dernière version non vue par l'utilisateur actuel
  getLatestUnseenVersion: async (): Promise<AppVersion | null> => {
    const response = await api.get('/app-versions/unseen/latest');
    return response.data;
  },

  // Marquer une version comme vue
  markVersionSeen: async (versionId: number): Promise<void> => {
    const data: MarkVersionSeenDto = { versionId };
    await api.post('/app-versions/mark-seen', data);
  },

  // Récupérer une version spécifique
  getById: async (id: number): Promise<AppVersion> => {
    const response = await api.get(`/app-versions/${id}`);
    return response.data;
  },

  // Créer une nouvelle version (dev uniquement)
  create: async (data: CreateAppVersionDto): Promise<AppVersion> => {
    const response = await api.post('/app-versions', data);
    return response.data;
  },

  // Mettre à jour une version (dev uniquement)
  update: async (
    id: number,
    data: Partial<CreateAppVersionDto>,
  ): Promise<AppVersion> => {
    const response = await api.patch(`/app-versions/${id}`, data);
    return response.data;
  },

  // Supprimer une version (dev uniquement)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/app-versions/${id}`);
  },
};
