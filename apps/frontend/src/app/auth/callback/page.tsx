'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/utils/auth';
import { Spinner } from '@/components/ui';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

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
        };

        // Store token and user info
        login(token, user);

        // Redirect based on role
        if (user.role === 'manager') {
          router.push('/manager/dashboard');
        } else {
          router.push('/fbo/dashboard');
        }
      } catch (error) {
        console.error('Error processing token:', error);
        router.push('/login?error=token-invalid');
      }
    } else {
      // No token, redirect to login
      router.push('/login?error=no-token');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Finalisation de la connexion...</p>
      </div>
    </div>
  );
}
