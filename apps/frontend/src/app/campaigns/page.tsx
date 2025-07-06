'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CampaignList from '@/components/campaigns/CampaignList';
import { Campaign } from '@/types/campaigns';
import { useAuth } from '@/app/providers';
import { AuroraBackground } from '@/components/ui';

export default function CampaignsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Attendre que l'authentification soit vérifiée

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'manager') {
      // Rediriger vers le dashboard approprié
      router.push('/fbo/dashboard');
      return;
    }
  }, [user, isLoading, router]);

  // Afficher un loader pendant la vérification
  if (isLoading || !user) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4">
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0">
          <AuroraBackground
            colorStops={['#FF4500', '#FF6B00', '#FFD700']}
            blend={0.4}
            amplitude={1.0}
            speed={0.8}
          />
        </div>

        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 z-10"></div>

        <div className="text-center relative z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier les permissions
  if (user.role !== 'manager') {
    return null; // La redirection est gérée dans useEffect
  }

  return (
    <div className="min-h-screen relative">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <AuroraBackground
          colorStops={['#FF4500', '#FF6B00', '#FFD700']}
          blend={0.4}
          amplitude={1.0}
          speed={0.8}
        />
      </div>

      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Campagnes
          </h1>
          <p className="text-gray-600">
            Créez et gérez vos campagnes de défis d'été
          </p>
        </div>

        <CampaignList />
      </div>
    </div>
  );
}
