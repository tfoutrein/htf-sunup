'use client';

import { useState, useEffect } from 'react';

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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Next.js Template
        </h1>

        <div className="mb-8 text-center">
          <p className="text-lg mb-4">
            Full-stack template with Next.js frontend, API backend, and
            PostgreSQL
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Users from API</h2>

          {loading && <div className="text-center">Loading...</div>}

          {error && (
            <div className="text-red-500 text-center">Error: {error}</div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="text-gray-500 text-center">No users found</div>
          )}

          {users.length > 0 && (
            <div className="grid gap-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded p-4">
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
