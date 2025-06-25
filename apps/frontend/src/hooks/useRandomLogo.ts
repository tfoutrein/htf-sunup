'use client';

import { useState, useEffect } from 'react';

export type LogoChoice = 'sun' | 'logo1' | 'logo2';

export function useRandomLogo() {
  const [logoChoice, setLogoChoice] = useState<LogoChoice>('sun');

  useEffect(() => {
    const logos: LogoChoice[] = ['sun', 'logo1', 'logo2'];
    const randomLogo = logos[Math.floor(Math.random() * logos.length)];
    setLogoChoice(randomLogo);
  }, []);

  return logoChoice;
}
