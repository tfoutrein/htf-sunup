'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody, Input, Button } from '@heroui/react';
import { AuroraBackground } from '@/components/ui';
import { SunIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLogo } from '@/contexts/LogoContext';
import { ApiClient } from '@/services/api';
import { validatePassword, getPasswordStrengthMessage } from '@/utils/password';
import { PasswordRequirements } from '@/components/ui';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const router = useRouter();
  const { logoChoice } = useLogo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    // Validation du mot de passe avec les nouvelles règles
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError('Le mot de passe ne respecte pas les exigences de sécurité.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await ApiClient.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'fbo', // Tous les nouveaux utilisateurs sont des FBO
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Erreur lors de la création du compte',
        );
      }

      // Succès - rediriger vers login avec message de confirmation
      router.push('/login?message=account-created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
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
        <div className="text-center mb-8">
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
            Les défis de l'été
          </h1>
          <p className="text-gray-500 text-sm">by Happy Team Factory</p>
          <p className="text-sm text-gray-600 mt-1">Créer votre compte</p>
        </div>

        <Card className="bg-white/20 backdrop-blur-md shadow-2xl border border-white/30 shadow-orange-500/20">
          <CardHeader className="text-center pb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Inscription
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Rejoignez l'aventure des défis de l'été !
            </p>
          </CardHeader>
          <CardBody className="gap-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="text"
                label="Prénom et nom"
                placeholder="Votre prénom et nom"
                value={formData.name}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                variant="bordered"
                isRequired
                classNames={{
                  input: 'text-gray-800',
                  label: 'text-gray-700',
                }}
              />

              <Input
                type="email"
                label="Email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, email: value }))
                }
                variant="bordered"
                isRequired
                classNames={{
                  input: 'text-gray-800',
                  label: 'text-gray-700',
                }}
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                label="Mot de passe"
                placeholder={getPasswordStrengthMessage()}
                value={formData.password}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, password: value }))
                }
                variant="bordered"
                isRequired
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                }
                classNames={{
                  input: 'text-gray-800',
                  label: 'text-gray-700',
                }}
              />

              {formData.password && (
                <PasswordRequirements
                  password={formData.password}
                  className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                />
              )}

              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirmer le mot de passe"
                placeholder="Répétez votre mot de passe"
                value={formData.confirmPassword}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: value }))
                }
                variant="bordered"
                isRequired
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                }
                classNames={{
                  input: 'text-gray-800',
                  label: 'text-gray-700',
                }}
              />

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white font-semibold"
                size="lg"
              >
                {isLoading ? 'Création du compte...' : 'Créer mon compte'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-orange-600 hover:text-orange-700 font-medium underline"
                >
                  Se connecter
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
