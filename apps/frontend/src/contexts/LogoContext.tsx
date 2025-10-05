'use client';

import React, { createContext, useContext } from 'react';

// Logo fixe de la Happy Team Factory
export type LogoChoice = 'htf';

interface LogoContextType {
  logoChoice: LogoChoice;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export function LogoProvider({ children }: { children: React.ReactNode }) {
  return (
    <LogoContext.Provider value={{ logoChoice: 'htf' }}>
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
