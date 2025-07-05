'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/services/api';
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
} from '@/utils/auth';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: 'manager' | 'fbo';
  managerId?: number;
  profilePicture?: string;
  authProvider?: 'local' | 'facebook';
  facebookId?: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LinkFacebookData {
  facebookId: string;
  accessToken: string;
  profilePicture?: string;
}

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Query Functions
const fetchCurrentUser = async (): Promise<User | null> => {
  const token = getToken();
  if (!token) return null;

  const response = await ApiClient.get('/auth/me');
  if (!response.ok) {
    if (response.status === 401) {
      // Token invalide, nettoyer le localStorage
      removeToken();
      removeUser();
      return null;
    }
    throw new Error('Failed to fetch current user');
  }

  const user = await response.json();
  // Synchroniser avec le localStorage
  setUser(user);
  return user;
};

const loginUser = async (
  credentials: LoginCredentials,
): Promise<{ user: User; access_token: string }> => {
  const response = await ApiClient.post('/auth/login', credentials);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }

  const data = await response.json();

  // Stocker les données d'authentification
  setToken(data.access_token);
  setUser(data.user);

  // Déclencher un événement pour notifier les autres composants
  window.dispatchEvent(new CustomEvent('user-login'));

  return data;
};

const linkFacebook = async (
  data: LinkFacebookData,
): Promise<{ user: User; access_token: string }> => {
  const response = await ApiClient.post('/auth/link-facebook', data);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to link Facebook account');
  }

  const responseData = await response.json();

  // Stocker les nouvelles données
  setToken(responseData.access_token);
  setUser(responseData.user);

  // Déclencher un événement pour notifier les autres composants
  window.dispatchEvent(new CustomEvent('user-login'));

  return responseData;
};

const logoutUser = async (): Promise<void> => {
  // Nettoyer le localStorage
  removeToken();
  removeUser();

  // Déclencher un événement pour notifier les autres composants
  window.dispatchEvent(new CustomEvent('user-logout'));
};

// Hooks
export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: authKeys.user(),
    queryFn: fetchCurrentUser,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Ne pas retry si c'est une erreur 401 (non autorisé)
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: true, // Refetch quand on revient sur l'app
    refetchOnMount: true, // Refetch au montage
  });

  // Écouter les événements de connexion/déconnexion pour synchroniser le cache
  React.useEffect(() => {
    const handleUserLogin = () => {
      // Forcer un refetch des données utilisateur après connexion
      userQuery.refetch();
    };

    const handleUserLogout = () => {
      // Nettoyer le cache après déconnexion
      queryClient.setQueryData(authKeys.user(), null);
    };

    const handleStorageChange = (e: StorageEvent) => {
      // Refetch si le token ou l'utilisateur change dans le localStorage
      if (e.key === 'user' || e.key === 'token') {
        userQuery.refetch();
      }
    };

    // Écouter les événements personnalisés
    window.addEventListener('user-login', handleUserLogin);
    window.addEventListener('user-logout', handleUserLogout);
    // Écouter les changements du localStorage (cross-tab)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('user-login', handleUserLogin);
      window.removeEventListener('user-logout', handleUserLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userQuery, queryClient]);

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Mettre à jour le cache avec les nouvelles données
      queryClient.setQueryData(authKeys.user(), data.user);

      // Forcer un refetch immédiat pour s'assurer de la synchronisation
      userQuery.refetch();

      // Invalider les queries qui dépendent de l'utilisateur
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (error) => {
      // Nettoyer le cache en cas d'erreur
      queryClient.setQueryData(authKeys.user(), null);
    },
  });

  const linkFacebookMutation = useMutation({
    mutationFn: linkFacebook,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: authKeys.user() });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(authKeys.user());

      // Optimistically update the user with Facebook info
      queryClient.setQueryData(authKeys.user(), (old: User | null) => {
        if (!old) return old;
        return {
          ...old,
          facebookId: variables.facebookId,
          profilePicture: variables.profilePicture,
          authProvider: 'facebook' as const,
        };
      });

      return { previousUser };
    },
    onError: (err, variables, context) => {
      // On error, rollback to previous value
      if (context?.previousUser) {
        queryClient.setQueryData(authKeys.user(), context.previousUser);
      }
    },
    onSuccess: (data) => {
      // Mettre à jour le cache avec les données serveur
      queryClient.setQueryData(authKeys.user(), data.user);

      // Forcer un refetch immédiat pour s'assurer de la synchronisation
      userQuery.refetch();

      // Invalider les queries qui dépendent de l'utilisateur
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Nettoyer tout le cache
      queryClient.clear();

      // Remettre l'utilisateur à null
      queryClient.setQueryData(authKeys.user(), null);
    },
  });

  return {
    // État
    user: userQuery.data || null,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userQuery.data,
    error: userQuery.error,

    // Actions
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    linkFacebook: linkFacebookMutation.mutate,
    linkFacebookAsync: linkFacebookMutation.mutateAsync,
    logout: logoutMutation.mutate,

    // États des mutations
    isLoggingIn: loginMutation.isPending,
    isLinkingFacebook: linkFacebookMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Erreurs des mutations
    loginError: loginMutation.error,
    linkFacebookError: linkFacebookMutation.error,
    logoutError: logoutMutation.error,

    // Fonctions utilitaires
    refetchUser: userQuery.refetch,
    invalidateAuth: () =>
      queryClient.invalidateQueries({ queryKey: authKeys.user() }),
  };
}

// Hook pour vérifier si l'utilisateur est connecté (version simple)
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}

// Hook pour obtenir uniquement l'utilisateur courant (version simple)
export function useCurrentUser() {
  const { user, isLoading, error } = useAuth();
  return { user, isLoading, error };
}
