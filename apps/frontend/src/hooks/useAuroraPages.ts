'use client';

import { usePathname } from 'next/navigation';

const AURORA_PAGES = ['/', '/login'];

export function useAuroraPages() {
  const pathname = usePathname();

  const isAuroraPage = AURORA_PAGES.includes(pathname);

  return { isAuroraPage, auroraPages: AURORA_PAGES };
}
