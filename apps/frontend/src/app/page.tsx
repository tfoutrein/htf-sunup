'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Spinner,
  Badge,
} from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4">
            SunUp by Happy Team Factory ☀️
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Application full-stack moderne avec Next.js, Nest.js et Hero UI
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge color="warning" variant="flat">
              Next.js 14
            </Badge>
            <Badge color="primary" variant="flat">
              Nest.js
            </Badge>
            <Badge color="success" variant="flat">
              PostgreSQL
            </Badge>
            <Badge color="secondary" variant="flat">
              Hero UI
            </Badge>
          </div>
        </div>

        {/* Users Section */}
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-2xl font-semibold">Utilisateurs API</p>
              <p className="text-small text-default-500">
                Données récupérées depuis le backend
              </p>
            </div>
            <Button
              color="primary"
              variant="flat"
              onPress={fetchUsers}
              isLoading={loading}
              className="ml-auto"
            >
              Actualiser
            </Button>
          </CardHeader>
          <CardBody>
            {loading && (
              <div className="flex justify-center items-center py-8">
                <Spinner size="lg" color="warning" />
                <span className="ml-3 text-lg">Chargement...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <Badge color="danger" variant="flat" size="lg">
                  Erreur: {error}
                </Badge>
              </div>
            )}

            {!loading && !error && users.length === 0 && (
              <div className="text-center py-8">
                <Badge color="warning" variant="flat" size="lg">
                  Aucun utilisateur trouvé
                </Badge>
              </div>
            )}

            {users.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <Card key={user.id} className="border-none shadow-md">
                    <CardBody className="p-4">
                      <h3 className="font-semibold text-lg text-foreground">
                        {user.name}
                      </h3>
                      <p className="text-default-500">{user.email}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
