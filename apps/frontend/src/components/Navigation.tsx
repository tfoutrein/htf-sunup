'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Badge, Avatar } from '@/components/ui';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { logout, getUser } from '@/utils/auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'marraine' | 'manager' | 'fbo';
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Function to update user state from localStorage
  const updateUserFromStorage = () => {
    const user = getUser();
    setUser(user);
  };

  // Check if user is logged in on mount and listen for storage changes
  useEffect(() => {
    updateUserFromStorage();

    // Listen for custom events when user logs in/out
    const handleUserChange = () => {
      updateUserFromStorage();
    };

    // Listen for storage changes (useful for multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        updateUserFromStorage();
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

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/login');
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'marraine':
        return '/marraine/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'fbo':
        return '/fbo/dashboard';
      default:
        return '/';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'marraine':
        return 'Marraine';
      case 'manager':
        return 'Manager';
      case 'fbo':
        return 'FBO';
      default:
        return role;
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2"
              onClick={closeMenu}
            >
              <span className="text-2xl">☀️</span>
              <div className="hidden xs:flex xs:flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-tight">
                  Les défis de l'été
                </span>
                <span className="text-xs text-gray-500 leading-none">
                  by Happy Team Factory
                </span>
              </div>
              <div className="flex xs:hidden flex-col">
                <span className="font-bold text-base bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-tight">
                  Défis d'été
                </span>
                <span className="text-xs text-gray-500 leading-none">
                  by HTF
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href={getDashboardLink()}>
                  <Button
                    variant={isActive(getDashboardLink()) ? 'flat' : 'light'}
                    color={isActive(getDashboardLink()) ? 'warning' : 'default'}
                    size="sm"
                    className="font-medium"
                  >
                    Dashboard
                  </Button>
                </Link>

                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Avatar
                      name={user.name}
                      size="sm"
                      className="bg-gradient-to-r from-orange-400 to-amber-400 text-white"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getRoleDisplayName(user.role)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="light"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600"
                    startContent={
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    }
                  >
                    Déconnexion
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/">
                  <Button
                    variant={isActive('/') ? 'flat' : 'light'}
                    color={isActive('/') ? 'warning' : 'default'}
                    size="sm"
                  >
                    Accueil
                  </Button>
                </Link>

                <Link href="/components">
                  <Button
                    variant={isActive('/components') ? 'flat' : 'light'}
                    color={isActive('/components') ? 'warning' : 'default'}
                    size="sm"
                  >
                    Composants UI
                    <Badge
                      color="primary"
                      variant="flat"
                      size="sm"
                      className="ml-1"
                    >
                      Demo
                    </Badge>
                  </Button>
                </Link>

                {!isActive('/login') && !isActive('/register') && (
                  <Link href="/login">
                    <Button
                      variant="flat"
                      color="warning"
                      size="sm"
                      startContent={<UserIcon className="w-4 h-4" />}
                    >
                      Connexion
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="light"
              size="sm"
              onClick={toggleMenu}
              className="p-2"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-orange-200 bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-3 py-2 bg-orange-50 rounded-lg mb-3">
                    <Avatar
                      name={user.name}
                      size="sm"
                      className="bg-gradient-to-r from-orange-400 to-amber-400 text-white"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getRoleDisplayName(user.role)}
                      </span>
                    </div>
                  </div>

                  {/* Dashboard Link */}
                  <Link href={getDashboardLink()} onClick={closeMenu}>
                    <Button
                      variant={isActive(getDashboardLink()) ? 'flat' : 'light'}
                      color={
                        isActive(getDashboardLink()) ? 'warning' : 'default'
                      }
                      className="w-full justify-start font-medium"
                      size="md"
                    >
                      Dashboard
                    </Button>
                  </Link>

                  {/* Logout */}
                  <Button
                    variant="light"
                    onClick={handleLogout}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    size="md"
                    startContent={
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    }
                  >
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/" onClick={closeMenu}>
                    <Button
                      variant={isActive('/') ? 'flat' : 'light'}
                      color={isActive('/') ? 'warning' : 'default'}
                      className="w-full justify-start"
                      size="md"
                    >
                      Accueil
                    </Button>
                  </Link>

                  <Link href="/components" onClick={closeMenu}>
                    <Button
                      variant={isActive('/components') ? 'flat' : 'light'}
                      color={isActive('/components') ? 'warning' : 'default'}
                      className="w-full justify-start"
                      size="md"
                    >
                      Composants UI
                      <Badge
                        color="primary"
                        variant="flat"
                        size="sm"
                        className="ml-2"
                      >
                        Demo
                      </Badge>
                    </Button>
                  </Link>

                  {!isActive('/login') && !isActive('/register') && (
                    <Link href="/login" onClick={closeMenu}>
                      <Button
                        variant="flat"
                        color="warning"
                        className="w-full justify-start mt-2"
                        size="md"
                        startContent={<UserIcon className="w-4 h-4" />}
                      >
                        Connexion
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
