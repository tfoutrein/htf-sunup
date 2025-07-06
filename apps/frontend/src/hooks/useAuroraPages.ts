'use client';

import { usePathname } from 'next/navigation';

// Aurora activée sur toutes les pages de l'application
export function useAuroraPages() {
  const pathname = usePathname();

  // L'Aurora est maintenant disponible sur toutes les pages
  const isAuroraPage = true;

  return { isAuroraPage, auroraPages: ['*'] };
}
