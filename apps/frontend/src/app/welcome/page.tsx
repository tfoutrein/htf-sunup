'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Select,
  SelectItem,
} from '@heroui/react';
import { CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { AuroraBackground } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient } from '@/services/api';

interface Manager {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function WelcomePage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [managersLoading, setManagersLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, refetchUser } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Vérifier si l'utilisateur a vraiment besoin d'un manager
    if (user.role !== 'fbo' || user.managerId) {
      // Rediriger vers le dashboard approprié
      if (user.role === 'manager') {
        router.push('/manager/dashboard');
      } else {
        router.push('/fbo/dashboard');
      }
      return;
    }

    fetchManagers();
  }, [user, router]);

  const fetchManagers = async () => {
    try {
      setManagersLoading(true);
      const response = await ApiClient.get('/public/users/managers');

      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      } else {
        setError('Erreur lors du chargement des managers');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des managers:', err);
      setError('Erreur lors du chargement des managers');
    } finally {
      setManagersLoading(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedManagerId || !user) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await ApiClient.post('/auth/assign-manager', {
        userId: user.id,
        managerId: parseInt(selectedManagerId),
      });

      if (response.ok) {
        const data = await response.json();

        // Mettre à jour les informations de l'utilisateur dans le cache
        await refetchUser();

        // Rediriger vers le dashboard FBO
        router.push('/fbo/dashboard');
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Erreur lors de l'assignation du manager",
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'assignation du manager:", err);
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
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

      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-yellow-50/80 z-10"></div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-xl">
          <CardHeader className="flex flex-col items-center space-y-4 pb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Bienvenue {user.name} ! 🎉
              </h1>
              <p className="text-gray-600 text-sm">
                Pour commencer, sélectionnez votre manager pour rejoindre son
                équipe
              </p>
            </div>
          </CardHeader>

          <CardBody className="space-y-6">
            {/* Sélection du manager */}
            <div className="space-y-4">
              <Select
                label="Choisir votre manager"
                placeholder="Sélectionnez votre manager"
                description="Choisissez le manager de votre équipe"
                selectedKeys={selectedManagerId ? [selectedManagerId] : []}
                onSelectionChange={(keys) => {
                  const managerId = Array.from(keys)[0] as string;
                  setSelectedManagerId(managerId);
                }}
                variant="bordered"
                isLoading={managersLoading}
                isRequired
                size="lg"
                classNames={{
                  trigger:
                    'bg-white/20 border-white/30 data-[hover=true]:bg-white/30',
                  listbox: 'bg-white',
                  popoverContent: 'bg-white',
                  value: 'text-gray-800 font-medium',
                }}
              >
                {managers.map((manager) => (
                  <SelectItem
                    key={manager.id.toString()}
                    className="text-gray-900"
                    textValue={`${manager.name} - ${manager.email}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{manager.name}</span>
                      <span className="text-sm text-gray-600">
                        {manager.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                onClick={handleAssignManager}
                disabled={!selectedManagerId || isLoading}
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold"
                size="lg"
                startContent={
                  !isLoading ? <CheckCircleIcon className="w-5 h-5" /> : null
                }
              >
                {isLoading
                  ? 'Assignation en cours...'
                  : 'Rejoindre cette équipe'}
              </Button>
            </div>

            {/* Informations additionnelles */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Pourquoi choisir un manager ?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Accès aux défis et campagnes de votre équipe</li>
                <li>• Suivi de vos performances</li>
                <li>• Participation aux challenges collectifs</li>
                <li>• Support et accompagnement personnalisé</li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
