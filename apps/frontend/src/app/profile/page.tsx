'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Switch,
} from '@heroui/react';
import {
  UserIcon,
  LinkIcon,
  PhotoIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { AuroraBackground } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient } from '@/services/api';
import { isFacebookAuthEnabled } from '@/utils/facebook';

export default function ProfilePage() {
  const {
    user,
    isLoading: authLoading,
    linkFacebookAsync,
    isLinkingFacebook,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  const handleLinkFacebook = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Utiliser l'API Facebook directement pour l'authentification
      if (typeof window !== 'undefined' && (window as any).FB) {
        (window as any).FB.login(
          (response: any) => {
            if (response.authResponse) {
              // Récupérer les informations de l'utilisateur Facebook avec photo en haute qualité
              (window as any).FB.api(
                '/me',
                {
                  fields:
                    'id,name,email,picture.type(large).width(200).height(200)',
                },
                async (userInfo: any) => {
                  try {
                    // Utiliser le hook TanStack Query pour lier le compte Facebook
                    await linkFacebookAsync({
                      facebookId: userInfo.id,
                      accessToken: response.authResponse.accessToken,
                      profilePicture: userInfo.picture?.data?.url,
                    });

                    setSuccess(
                      'Compte Facebook lié avec succès ! Votre photo de profil a été synchronisée.',
                    );
                  } catch (err: any) {
                    setError(
                      err.message ||
                        'Erreur lors de la liaison du compte Facebook',
                    );
                  }
                  setIsLoading(false);
                },
              );
            } else {
              setError('Authentification Facebook annulée');
              setIsLoading(false);
            }
          },
          { scope: 'email' },
        );
      } else {
        // Charger le SDK Facebook si pas encore chargé
        await loadFacebookSDK();
        handleLinkFacebook(); // Réessayer après le chargement
      }
    } catch (err) {
      console.error('Erreur lors de la liaison Facebook:', err);
      setError('Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const loadFacebookSDK = (): Promise<void> => {
    return new Promise((resolve) => {
      if ((window as any).FB) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/fr_FR/sdk.js';
      script.onload = () => {
        (window as any).FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        });
        resolve();
      };
      document.head.appendChild(script);
    });
  };

  // Charger le SDK Facebook au montage du composant
  useEffect(() => {
    if (user && !user.facebookId && isFacebookAuthEnabled()) {
      loadFacebookSDK();
    }
  }, [user]);

  const handleUnlinkFacebook = async () => {
    // TODO: Implémenter la déconnexion Facebook
    // Pour l'instant, on affiche juste un message
    setError('Fonctionnalité de déconnexion Facebook pas encore implémentée');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative p-4">
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

      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles et vos comptes liés
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations personnelles avec avatar */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Informations personnelles
                </h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 p-4 bg-white/10 rounded-lg">
                <div className="relative">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={`Photo de profil de ${user.name}`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-orange-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {user.authProvider === 'facebook' && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-gray-600">
                    {user.role === 'fbo' ? "FBO (Membre d'équipe)" : 'Manager'}
                  </p>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="space-y-4">
                <Input
                  label="Nom"
                  value={user.name}
                  variant="bordered"
                  isReadOnly
                  classNames={{
                    input: 'text-gray-800',
                    label: 'text-gray-700',
                  }}
                />
                <Input
                  label="Email"
                  value={user.email}
                  variant="bordered"
                  isReadOnly
                  classNames={{
                    input: 'text-gray-800',
                    label: 'text-gray-700',
                  }}
                />
                <Input
                  label="Rôle"
                  value={
                    user.role === 'fbo' ? "FBO (Membre d'équipe)" : 'Manager'
                  }
                  variant="bordered"
                  isReadOnly
                  classNames={{
                    input: 'text-gray-800',
                    label: 'text-gray-700',
                  }}
                />
                <Input
                  label="Méthode d'authentification"
                  value={
                    user.authProvider === 'facebook'
                      ? 'Facebook'
                      : 'Email/Mot de passe'
                  }
                  variant="bordered"
                  isReadOnly
                  classNames={{
                    input: 'text-gray-800',
                    label: 'text-gray-700',
                  }}
                />
              </div>
            </CardBody>
          </Card>

          {/* Comptes liés */}
          {isFacebookAuthEnabled() && (
            <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <LinkIcon className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Comptes liés
                  </h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* Facebook */}
                <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          Facebook
                        </h3>
                        <p className="text-sm text-gray-600">
                          {user.facebookId ? 'Compte lié' : 'Non lié'}
                        </p>
                      </div>
                    </div>

                    {user.facebookId ? (
                      <Button
                        onClick={handleUnlinkFacebook}
                        color="danger"
                        variant="bordered"
                        size="sm"
                      >
                        Déconnecter
                      </Button>
                    ) : (
                      <Button
                        onClick={handleLinkFacebook}
                        isLoading={isLoading || isLinkingFacebook}
                        className="bg-blue-600 text-white"
                        size="sm"
                        startContent={
                          !isLoading && !isLinkingFacebook ? (
                            <LinkIcon className="w-4 h-4" />
                          ) : null
                        }
                      >
                        {isLoading || isLinkingFacebook ? 'Liaison...' : 'Lier'}
                      </Button>
                    )}
                  </div>

                  {user.facebookId && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Connecté avec Facebook</span>
                    </div>
                  )}
                </div>

                {/* Photo de profil */}
                {user.profilePicture && (
                  <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <PhotoIcon className="w-6 h-6 text-orange-500" />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            Photo de profil
                          </h3>
                          <p className="text-sm text-gray-600">
                            Photo depuis Facebook en haute qualité
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <img
                          src={user.profilePicture}
                          alt="Photo de profil"
                          className="w-12 h-12 rounded-full object-cover border-2 border-orange-200 shadow-sm"
                        />
                        <div className="text-xs text-green-600 font-medium">
                          ✓ Synchro
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                    {success}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="bordered"
            className="border-white/30 text-gray-800"
          >
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
}
