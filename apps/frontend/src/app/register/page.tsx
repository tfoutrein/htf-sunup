'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { AuroraBackground } from '@/components/ui';
import { SunIcon } from '@heroicons/react/24/outline';
import { useLogo } from '@/contexts/LogoContext';

interface Manager {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function RequestAccessPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [managersLoading, setManagersLoading] = useState(false);
  const [error, setError] = useState('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'fbo',
    managerId: '',
    message: '',
  });
  const router = useRouter();
  const { logoChoice } = useLogo();

  useEffect(() => {
    if (formData.role === 'fbo') {
      fetchManagers();
    }
  }, [formData.role]);

  const fetchManagers = async () => {
    setManagersLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/access-requests/managers/list`,
      );
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des managers:', err);
    } finally {
      setManagersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.role === 'fbo' && !formData.managerId) {
      setError('Veuillez sélectionner votre manager');
      setIsLoading(false);
      return;
    }

    try {
      const requestData = {
        name: formData.name,
        email: formData.email,
        requestedRole: formData.role,
        requestedManagerId: formData.managerId
          ? parseInt(formData.managerId)
          : undefined,
        message: formData.message,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/access-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la demande d'accès",
        );
      }

      // Succès - rediriger vers login avec message
      router.push('/login?message=request-sent');
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
          <p className="text-sm text-gray-600 mt-1">Rejoins l'aventure !</p>
        </div>

        <Card className="bg-white/20 backdrop-blur-md shadow-2xl border border-white/30 shadow-orange-500/20">
          <CardHeader className="text-center pb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Demander l'accès aux défis de l'été
            </h2>
          </CardHeader>
          <CardBody className="gap-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="text"
                label="Prénom et nom"
                placeholder="Ton prénom et ton nom"
                value={formData.name}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
                variant="bordered"
                isRequired
              />

              <Input
                type="email"
                label="Email"
                placeholder="ton.email@exemple.com"
                value={formData.email}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, email: value }))
                }
                variant="bordered"
                isRequired
              />

              <Select
                label="Rôle"
                placeholder="Sélectionne ton rôle"
                selectedKeys={[formData.role]}
                onSelectionChange={(keys) => {
                  const role = Array.from(keys)[0] as string;
                  setFormData((prev) => ({ ...prev, role }));
                }}
                variant="bordered"
                classNames={{
                  listbox: 'text-gray-900',
                  popoverContent: 'bg-white',
                  value: '!text-gray-900 font-medium',
                  trigger: 'data-[hover=true]:!text-gray-900',
                  innerWrapper: '!text-gray-900',
                  mainWrapper: '!text-gray-900',
                }}
              >
                <SelectItem key="fbo" className="text-gray-900">
                  FBO (Membre d'équipe)
                </SelectItem>
                <SelectItem key="manager" className="text-gray-900">
                  Manager
                </SelectItem>
              </Select>

              {formData.role === 'fbo' && (
                <Select
                  label="Manager"
                  placeholder="Sélectionnez votre manager"
                  description="Choisissez votre manager direct ou le manager principal si vous n'avez pas de manager spécifique"
                  selectedKeys={formData.managerId ? [formData.managerId] : []}
                  onSelectionChange={(keys) => {
                    const managerId = Array.from(keys)[0] as string;
                    setFormData((prev) => ({ ...prev, managerId }));
                  }}
                  variant="bordered"
                  isLoading={managersLoading}
                  isRequired
                  classNames={{
                    listbox: 'text-gray-900',
                    popoverContent: 'bg-white',
                    value: '!text-gray-900 !font-medium',
                    trigger: '!text-gray-900',
                    innerWrapper: '!text-gray-900',
                    mainWrapper: '!text-gray-900',
                    description: '!text-gray-700 font-medium',
                  }}
                  renderValue={(items) => {
                    return items.map((item) => (
                      <div key={item.key} className="text-gray-900 font-medium">
                        {item.textValue}
                      </div>
                    ));
                  }}
                >
                  {managers.map((manager) => (
                    <SelectItem
                      key={manager.id.toString()}
                      className="text-gray-900"
                      textValue={`${manager.name} - ${manager.email}`}
                    >
                      {manager.name} - {manager.email}
                    </SelectItem>
                  ))}
                </Select>
              )}

              <Textarea
                label="Message (optionnel)"
                placeholder="Présentez-vous, un petit mot, une blague..."
                value={formData.message}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, message: value }))
                }
                variant="bordered"
                maxRows={4}
              />

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold"
                size="lg"
                isLoading={isLoading}
                disabled={!formData.name || !formData.email}
              >
                {isLoading ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
            </form>

            <div className="border-t border-gray-200 my-4"></div>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Déjà un compte ?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-orange-500 hover:text-orange-600 font-medium underline"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Une initiative de la Happy Team Factory 🌻
          </p>
        </div>
      </div>
    </div>
  );
}
