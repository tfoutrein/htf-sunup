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
} from '@heroui/react';

interface Manager {
  id: number;
  name: string;
  email: string;
}

export default function RegisterPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [managersLoading, setManagersLoading] = useState(false);
  const [error, setError] = useState('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'fbo',
    managerId: '',
  });
  const router = useRouter();

  const toggleVisibility = () => setIsVisible(!isVisible);

  useEffect(() => {
    if (formData.role === 'fbo') {
      fetchManagers();
    }
  }, [formData.role]);

  const fetchManagers = async () => {
    setManagersLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/users/managers`,
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    if (formData.role === 'fbo' && !formData.managerId) {
      setError('Veuillez sélectionner votre manager');
      setIsLoading(false);
      return;
    }

    try {
      const requestData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'fbo' && {
          managerId: parseInt(formData.managerId),
        }),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
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
        throw new Error(errorData.message || "Erreur lors de l'inscription");
      }

      const data = await response.json();

      // Store token and user info
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
            ☀️ Les défis de l'été
          </h1>
          <p className="text-gray-500 text-sm">by Happy Team Factory</p>
          <p className="text-sm text-gray-600 mt-1">Rejoins l'aventure !</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-semibold text-gray-800">
              Inscription
            </h2>
            <p className="text-gray-500 text-sm">
              Crée ton compte pour commencer tes défis
            </p>
          </CardHeader>
          <CardBody className="gap-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="text"
                label="Nom complet"
                placeholder="Ton nom et prénom"
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
              >
                <SelectItem key="fbo">FBO (Membre d'équipe)</SelectItem>
                <SelectItem key="manager">Manager</SelectItem>
              </Select>

              {formData.role === 'fbo' && (
                <Select
                  label="Manager"
                  placeholder="Sélectionne ton manager"
                  selectedKeys={formData.managerId ? [formData.managerId] : []}
                  onSelectionChange={(keys) => {
                    const managerId = Array.from(keys)[0] as string;
                    setFormData((prev) => ({ ...prev, managerId }));
                  }}
                  variant="bordered"
                  isLoading={managersLoading}
                  isRequired
                >
                  {managers.map((manager) => (
                    <SelectItem key={manager.id.toString()}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </Select>
              )}

              <Input
                label="Mot de passe"
                placeholder="Au moins 6 caractères"
                value={formData.password}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, password: value }))
                }
                variant="bordered"
                isRequired
                type={isVisible ? 'text' : 'password'}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    <span className="text-gray-400 text-sm cursor-pointer">
                      {isVisible ? '🙈' : '👁️'}
                    </span>
                  </button>
                }
              />

              <Input
                label="Confirmer le mot de passe"
                placeholder="Retape ton mot de passe"
                value={formData.confirmPassword}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, confirmPassword: value }))
                }
                variant="bordered"
                isRequired
                type={isVisible ? 'text' : 'password'}
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
                disabled={
                  !formData.name ||
                  !formData.email ||
                  !formData.password ||
                  !formData.confirmPassword
                }
              >
                {isLoading ? 'Inscription...' : "S'inscrire"}
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
                  Connecte-toi
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
