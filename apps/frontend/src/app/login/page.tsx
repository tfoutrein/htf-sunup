'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody, Input, Button } from '@heroui/react';
import { SunIcon } from '@heroicons/react/24/outline';
import { AuroraBackground } from '@/components/ui';
import { login } from '@/utils/auth';
import { useLogo } from '@/contexts/LogoContext';
import { ApiClient, API_ENDPOINTS } from '@/services/api';

export default function LoginPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const router = useRouter();
  const { logoChoice } = useLogo();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔥 DEBUT LOGIN - Utilisation ApiClient.postPublic');
      console.log('🔥 API_ENDPOINTS.LOGIN:', API_ENDPOINTS.LOGIN);
      const response = await ApiClient.postPublic(
        API_ENDPOINTS.LOGIN,
        formData,
      );
      console.log('🔥 Response reçue:', response.url);

      if (!response.ok) {
        throw new Error('Email ou mot de passe incorrect');
      }

      const data = await response.json();

      // Store token and user info
      login(data.access_token, data.user);

      // Redirect based on role
      if (data.user.role === 'marraine') {
        router.push('/marraine/dashboard');
      } else if (data.user.role === 'manager') {
        router.push('/manager/dashboard');
      } else {
        router.push('/fbo/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    const testData = { email, password };
    setFormData(testData);
    setError('');
    setIsLoading(true);

    try {
      console.log('🔥 QUICK LOGIN - Utilisation ApiClient.postPublic');
      console.log('🔥 API_ENDPOINTS.LOGIN:', API_ENDPOINTS.LOGIN);
      const response = await ApiClient.postPublic(
        API_ENDPOINTS.LOGIN,
        testData,
      );
      console.log('🔥 Quick login response URL:', response.url);

      if (!response.ok) {
        throw new Error('Erreur de connexion');
      }

      const data = await response.json();
      login(data.access_token, data.user);

      // Redirect based on role
      if (data.user.role === 'marraine') {
        router.push('/marraine/dashboard');
      } else if (data.user.role === 'manager') {
        router.push('/manager/dashboard');
      } else {
        router.push('/fbo/dashboard');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <AuroraBackground
          colorStops={['#FF4500', '#FF6B00', '#FFD700']}
          blend={0.6}
          amplitude={1.2}
          speed={1.0}
        />
      </div>

      {/* Background overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 z-10"></div>

      <div className="w-full max-w-md relative z-20">
        <Card className="bg-white/20 backdrop-blur-md shadow-2xl border border-white/30 shadow-orange-500/20">
          <CardBody className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              {logoChoice === 'sun' ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-[pulse-scale_1.5s_ease-in-out_1]">
                  <SunIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              ) : (
                <div className="flex items-center justify-center mx-auto mb-4">
                  {logoChoice === 'logo1' ? (
                    <img
                      src="/logo1.png"
                      alt="Logo 1"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-[pulse-scale_1.5s_ease-in-out_1]"
                    />
                  ) : (
                    <img
                      src="/logo2.png"
                      alt="Logo 2"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-[pulse-scale_1.5s_ease-in-out_1]"
                    />
                  )}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Les défis de l'été ☀️
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mb-2">
                by Happy Team Factory
              </p>
              <p className="text-gray-600 text-sm sm:text-base">
                Connecte-toi pour accéder à tes défis d'été
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <Input
                label="Email"
                placeholder="ton.email@exemple.com"
                value={formData.email}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, email: value }))
                }
                variant="bordered"
                isRequired
                size="lg"
                classNames={{
                  input: 'text-base',
                  label: 'text-sm sm:text-base',
                }}
              />

              <Input
                label="Mot de passe"
                placeholder="Ton mot de passe"
                value={formData.password}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, password: value }))
                }
                variant="bordered"
                isRequired
                type={isVisible ? 'text' : 'password'}
                size="lg"
                classNames={{
                  input: 'text-base',
                  label: 'text-sm sm:text-base',
                }}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    <span className="text-gray-400 text-lg cursor-pointer">
                      {isVisible ? '🙈' : '👁️'}
                    </span>
                  </button>
                }
              />

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold w-full"
                size="lg"
                isLoading={isLoading}
                disabled={!formData.email || !formData.password}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <div className="border-t border-gray-200 my-4 sm:my-6"></div>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Pas encore de compte ?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="text-orange-500 hover:text-orange-600 font-medium underline"
                >
                  Inscris-toi
                </button>
              </p>
            </div>

            {/* Development helpers */}
            {(process.env.NODE_ENV === 'development' ||
              process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
              process.env.NEXT_PUBLIC_ENABLE_TEST_BUTTONS === 'true') && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-xs sm:text-sm font-semibold text-blue-800 mb-2 sm:mb-3">
                  🔧 Comptes de test{' '}
                  {process.env.NODE_ENV === 'development'
                    ? '(dev only)'
                    : '(mode test)'}
                </h3>
                {process.env.NEXT_PUBLIC_VERCEL_ENV && (
                  <div className="text-xs text-blue-600 mb-2 bg-blue-100 px-2 py-1 rounded">
                    🌐 Environnement Vercel:{' '}
                    {process.env.NEXT_PUBLIC_VERCEL_ENV}
                  </div>
                )}
                <div className="space-y-2">
                  {/* Marraine */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          email: 'aurelia@htf.com',
                          password: 'password',
                        });
                        setError('');
                      }}
                      className="text-left text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-2 py-1 rounded transition-colors"
                    >
                      👑 Marraine (Aurélia)
                    </button>
                    <button
                      onClick={() =>
                        handleQuickLogin('aurelia@htf.com', 'password')
                      }
                      className="text-xs bg-purple-200 hover:bg-purple-300 text-purple-900 px-2 py-1 rounded font-medium transition-colors"
                    >
                      ⚡ Direct
                    </button>
                  </div>

                  {/* Managers */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          email: 'jeromine@htf.com',
                          password: 'password',
                        });
                        setError('');
                      }}
                      className="text-left text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                    >
                      👥 Manager (Jéromine)
                    </button>
                    <button
                      onClick={() =>
                        handleQuickLogin('jeromine@htf.com', 'password')
                      }
                      className="text-xs bg-blue-200 hover:bg-blue-300 text-blue-900 px-2 py-1 rounded font-medium transition-colors"
                    >
                      ⚡ Direct
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          email: 'gaelle@htf.com',
                          password: 'password',
                        });
                        setError('');
                      }}
                      className="text-left text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                    >
                      👥 Manager (Gaëlle)
                    </button>
                    <button
                      onClick={() =>
                        handleQuickLogin('gaelle@htf.com', 'password')
                      }
                      className="text-xs bg-blue-200 hover:bg-blue-300 text-blue-900 px-2 py-1 rounded font-medium transition-colors"
                    >
                      ⚡ Direct
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          email: 'audrey@htf.com',
                          password: 'password',
                        });
                        setError('');
                      }}
                      className="text-left text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                    >
                      👥 Manager (Audrey)
                    </button>
                    <button
                      onClick={() =>
                        handleQuickLogin('audrey@htf.com', 'password')
                      }
                      className="text-xs bg-blue-200 hover:bg-blue-300 text-blue-900 px-2 py-1 rounded font-medium transition-colors"
                    >
                      ⚡ Direct
                    </button>
                  </div>

                  {/* FBOs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          email: 'marie@htf.com',
                          password: 'password',
                        });
                        setError('');
                      }}
                      className="text-left text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                    >
                      🎯 FBO (Marie)
                    </button>
                    <button
                      onClick={() =>
                        handleQuickLogin('marie@htf.com', 'password')
                      }
                      className="text-xs bg-green-200 hover:bg-green-300 text-green-900 px-2 py-1 rounded font-medium transition-colors"
                    >
                      ⚡ Direct
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          email: 'pierre@htf.com',
                          password: 'password',
                        });
                        setError('');
                      }}
                      className="text-left text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                    >
                      🎯 FBO (Pierre)
                    </button>
                    <button
                      onClick={() =>
                        handleQuickLogin('pierre@htf.com', 'password')
                      }
                      className="text-xs bg-green-200 hover:bg-green-300 text-green-900 px-2 py-1 rounded font-medium transition-colors"
                    >
                      ⚡ Direct
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFormData({
                          email: 'sophie@htf.com',
                          password: 'password',
                        });
                        setError('');
                      }}
                      className="text-left text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                    >
                      🎯 FBO (Sophie)
                    </button>
                    <button
                      onClick={() =>
                        handleQuickLogin('sophie@htf.com', 'password')
                      }
                      className="text-xs bg-green-200 hover:bg-green-300 text-green-900 px-2 py-1 rounded font-medium transition-colors"
                    >
                      ⚡ Direct
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
