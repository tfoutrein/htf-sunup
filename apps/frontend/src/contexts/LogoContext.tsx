'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type LogoChoice = 'sun' | 'logo1' | 'logo2';

interface LogoContextType {
  logoChoice: LogoChoice;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logoChoice, setLogoChoice] = useState<LogoChoice>('sun');

  useEffect(() => {
    const logos: LogoChoice[] = ['sun', 'logo1', 'logo2'];
    const randomLogo = logos[Math.floor(Math.random() * logos.length)];
    setLogoChoice(randomLogo);
  }, []);

  return (
    <LogoContext.Provider value={{ logoChoice }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
}
