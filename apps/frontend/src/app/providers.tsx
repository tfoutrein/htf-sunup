'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { getUser, isAuthenticated } from '@/utils/auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'marraine' | 'manager' | 'fbo';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    const userData = getUser();
    setUser(userData);
  };

  useEffect(() => {
    // Charger l'utilisateur au démarrage
    refreshUser();
    setIsLoading(false);

    // Écouter les changements
    const handleUserChange = () => {
      refreshUser();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        refreshUser();
      }
    };

    window.addEventListener('user-login', handleUserChange);
    window.addEventListener('user-logout', handleUserChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('user-login', handleUserChange);
      window.removeEventListener('user-logout', handleUserChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
