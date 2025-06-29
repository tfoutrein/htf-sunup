'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Switch } from '@/components/ui';
import { LogoDisplay } from '@/components/ui/LogoDisplay';
import { logout } from '@/utils/auth';
import { useAuth } from '@/app/providers';
import { useAurora } from '@/contexts/AuroraContext';
import { useAuroraPages } from '@/hooks/useAuroraPages';
import { useLogo } from '@/contexts/LogoContext';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const { isAuroraEnabled, toggleAurora } = useAurora();
  const { isAuroraPage } = useAuroraPages();
  const { logoChoice } = useLogo();

  const getDashboardLink = () => {
    if (!user) return '#';
    switch (user.role) {
      case 'marraine':
        return '/marraine/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'fbo':
        return '/fbo/dashboard';
      default:
        return '#';
    }
  };

  const isActive = (path: string) => {
    if (path === '#') return false;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    closeMenu();
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
              <LogoDisplay logoChoice={logoChoice} size="sm" />
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
            {!isLoading &&
              (user ? (
                <>
                  <Link href={getDashboardLink()}>
                    <Button
                      variant={isActive(getDashboardLink()) ? 'flat' : 'light'}
                      color={
                        isActive(getDashboardLink()) ? 'warning' : 'default'
                      }
                      size="sm"
                      className="font-medium"
                    >
                      Dashboard
                    </Button>
                  </Link>

                  {(user.role === 'marraine' || user.role === 'manager') && (
                    <>
                      <Link href="/campaigns">
                        <Button
                          variant={isActive('/campaigns') ? 'flat' : 'light'}
                          color={isActive('/campaigns') ? 'warning' : 'default'}
                          size="sm"
                          className="font-medium"
                        >
                          Campagnes
                        </Button>
                      </Link>
                      <Link href="/manage-access-requests">
                        <Button
                          variant={
                            isActive('/manage-access-requests')
                              ? 'flat'
                              : 'light'
                          }
                          color={
                            isActive('/manage-access-requests')
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                          className="font-medium"
                        >
                          Demandes d'accès
                        </Button>
                      </Link>
                    </>
                  )}

                  {/* Aurora Toggle - Only on Aurora pages */}
                  {isAuroraPage && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">🌟</span>
                      <Switch
                        isSelected={isAuroraEnabled}
                        onValueChange={toggleAurora}
                        size="sm"
                        color="warning"
                        aria-label="Activer/désactiver l'animation Aurora"
                      />
                    </div>
                  )}

                  {/* User Menu */}
                  <div className="flex items-center space-x-3 ml-4">
                    <div className="flex items-center space-x-2">
                      <Avatar
                        name={user.name}
                        size="sm"
                        className="bg-gradient-to-r from-orange-400 to-amber-400 text-white"
                      />
                      <div className="hidden lg:flex lg:flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="light"
                      color="danger"
                      size="sm"
                      onClick={handleLogout}
                      className="font-medium"
                    >
                      Déconnexion
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/">
                    <Button
                      variant={pathname === '/' ? 'flat' : 'light'}
                      color={pathname === '/' ? 'warning' : 'default'}
                      size="sm"
                      className="font-medium"
                    >
                      Accueil
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      variant={pathname === '/login' ? 'flat' : 'light'}
                      color={pathname === '/login' ? 'warning' : 'default'}
                      size="sm"
                      className="font-medium"
                    >
                      Connexion
                    </Button>
                  </Link>

                  {/* Aurora Toggle - Only on Aurora pages */}
                  {isAuroraPage && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">🌟</span>
                      <Switch
                        isSelected={isAuroraEnabled}
                        onValueChange={toggleAurora}
                        size="sm"
                        color="warning"
                        aria-label="Activer/désactiver l'animation Aurora"
                      />
                    </div>
                  )}
                </>
              ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="light"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-orange-200 bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!isLoading &&
                (user ? (
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
                        <span className="text-xs text-gray-500 capitalize">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <Link href={getDashboardLink()} onClick={closeMenu}>
                      <Button
                        variant={
                          isActive(getDashboardLink()) ? 'flat' : 'light'
                        }
                        color={
                          isActive(getDashboardLink()) ? 'warning' : 'default'
                        }
                        size="sm"
                        className="w-full justify-start font-medium"
                      >
                        Dashboard
                      </Button>
                    </Link>

                    {(user.role === 'marraine' || user.role === 'manager') && (
                      <>
                        <Link href="/campaigns" onClick={closeMenu}>
                          <Button
                            variant={isActive('/campaigns') ? 'flat' : 'light'}
                            color={
                              isActive('/campaigns') ? 'warning' : 'default'
                            }
                            size="sm"
                            className="w-full justify-start font-medium"
                          >
                            Campagnes
                          </Button>
                        </Link>
                        <Link
                          href="/manage-access-requests"
                          onClick={closeMenu}
                        >
                          <Button
                            variant={
                              isActive('/manage-access-requests')
                                ? 'flat'
                                : 'light'
                            }
                            color={
                              isActive('/manage-access-requests')
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                            className="w-full justify-start font-medium"
                          >
                            Demandes d'accès
                          </Button>
                        </Link>
                      </>
                    )}

                    <Button
                      variant="light"
                      color="danger"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start font-medium"
                    >
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/" onClick={closeMenu}>
                      <Button
                        variant={pathname === '/' ? 'flat' : 'light'}
                        color={pathname === '/' ? 'warning' : 'default'}
                        size="sm"
                        className="w-full justify-start font-medium"
                      >
                        Accueil
                      </Button>
                    </Link>
                    <Link href="/login" onClick={closeMenu}>
                      <Button
                        variant={pathname === '/login' ? 'flat' : 'light'}
                        color={pathname === '/login' ? 'warning' : 'default'}
                        size="sm"
                        className="w-full justify-start font-medium"
                      >
                        Connexion
                      </Button>
                    </Link>
                  </>
                ))}

              {/* Aurora Toggle for Mobile - Only on Aurora pages */}
              {isAuroraPage && (
                <div className="border-t border-orange-200 pt-3 mt-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🌟</span>
                      <span className="text-sm font-medium text-gray-700">
                        Animation
                      </span>
                    </div>
                    <Switch
                      isSelected={isAuroraEnabled}
                      onValueChange={toggleAurora}
                      size="sm"
                      color="warning"
                      aria-label="Activer/désactiver l'animation Aurora"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
