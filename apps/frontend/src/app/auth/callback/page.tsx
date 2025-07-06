'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { setToken, setUser } from '@/utils/auth';
import { Spinner } from '@/components/ui';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchUser, invalidateAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const needsManager = searchParams.get('needsManager') === 'true';

    if (token) {
      // Token received from Facebook OAuth callback
      // Decode the token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          managerId: payload.managerId,
          profilePicture: payload.profilePicture,
          authProvider: payload.authProvider,
          facebookId: payload.facebookId,
          createdAt: payload.createdAt,
          updatedAt: payload.updatedAt,
        };

        // Store token and user info
        setToken(token);
        setUser(user);

        // Déclencher l'événement pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('user-login'));

        // Invalider et refetch le cache TanStack Query pour forcer la mise à jour
        invalidateAuth();
        refetchUser();

        // Vérifier si l'utilisateur a besoin d'un manager
        if (user.role === 'fbo' && !user.managerId) {
          router.push('/welcome');
          return;
        }

        // Tous les utilisateurs connectés vont vers la vue d'accueil
        router.push('/fbo/dashboard');
      } catch (error) {
        console.error('Error processing token:', error);
        router.push('/login?error=token-invalid');
      }
    } else {
      // No token, redirect to login
      router.push('/login?error=no-token');
    }
  }, [router, searchParams, refetchUser, invalidateAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Finalisation de la connexion...</p>
      </div>
    </div>
  );
}
