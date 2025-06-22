'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@/components/ui';
import { getUser, logout } from '@/utils/auth';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const userData = getUser();

    if (userData) {
      // Redirect based on role
      if (userData.role === 'marraine') {
        router.push('/marraine/dashboard');
      } else if (userData.role === 'manager') {
        router.push('/manager/dashboard');
      } else {
        router.push('/fbo/dashboard');
      }
    } else {
      // User not logged in, show the page
      setIsChecking(false);
    }
  }, [router]);

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 flex items-center justify-center px-4">
        <div className="text-center">
          <Spinner size="lg" color="warning" />
          <p className="mt-4 text-gray-600">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-200 rounded-full opacity-20"></div>
        <div className="absolute top-1/4 -left-8 w-16 h-16 bg-yellow-200 rounded-full opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-amber-200 rounded-full opacity-25"></div>
      </div>

      <div className="text-center relative max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
            ☀️ Les défis de l'été
          </h1>
          <h2 className="text-lg text-gray-500 mb-4">by Happy Team Factory</h2>
          <p className="text-lg text-gray-600 mb-4">
            Des défis quotidiens qui boostent ton équipe !
          </p>
          <p className="text-gray-500 max-w-lg mx-auto">
            Relevez des défis quotidiens en vente, recrutement et réseaux
            sociaux. Progressez ensemble dans une ambiance estivale et
            décontractée ! 🌻
          </p>
        </div>

        <div className="space-y-4">
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] w-full sm:w-auto px-8"
            onPress={() => router.push('/login')}
          >
            Se connecter
          </Button>

          <div className="text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <button
              onClick={() => router.push('/register')}
              className="text-orange-500 hover:text-orange-600 font-medium underline"
            >
              Inscris-toi ici
            </button>
          </div>
        </div>

        <div className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🎯 Tes défis quotidiens
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">💰</span>
              <span>Vente</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">🤝</span>
              <span>Recrutement</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-lg">📱</span>
              <span>Réseaux sociaux</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          Une initiative de la Happy Team Factory 🌻
        </div>
      </div>
    </div>
  );
}
