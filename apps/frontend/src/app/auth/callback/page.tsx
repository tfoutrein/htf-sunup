'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { setToken, setUser } from '@/utils/auth';
import { Spinner, AuroraBackground } from '@/components/ui';

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
  }, [searchParams, router, refetchUser, invalidateAuth]);

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <AuroraBackground
          colorStops={['#FF4500', '#FF6B00', '#FFD700']}
          blend={0.6}
          amplitude={1.2}
          speed={1.0}
        />
      </div>

      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 z-10"></div>

      <div className="text-center relative z-20">
        <Spinner size="lg" color="warning" />
        <p className="mt-4 text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
}
