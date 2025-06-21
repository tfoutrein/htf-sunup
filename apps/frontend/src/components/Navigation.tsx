'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Badge } from '@/components/ui';

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">☀️</span>
              <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                HTF SunUp
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </div>
    </nav>
  );
}
