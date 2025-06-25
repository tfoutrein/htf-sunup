'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

interface AuroraContextType {
  isAuroraEnabled: boolean;
  toggleAurora: () => void;
}

const AuroraContext = createContext<AuroraContextType | undefined>(undefined);

export function AuroraProvider({ children }: { children: ReactNode }) {
  const [isAuroraEnabled, setIsAuroraEnabled] = useState(true);

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aurora-enabled');
    if (saved !== null) {
      setIsAuroraEnabled(JSON.parse(saved));
    }
  }, []);

  // Save preference to localStorage when changed
  useEffect(() => {
    localStorage.setItem('aurora-enabled', JSON.stringify(isAuroraEnabled));
  }, [isAuroraEnabled]);

  const toggleAurora = () => {
    setIsAuroraEnabled(!isAuroraEnabled);
  };

  return (
    <AuroraContext.Provider value={{ isAuroraEnabled, toggleAurora }}>
      {children}
    </AuroraContext.Provider>
  );
}

export function useAurora() {
  const context = useContext(AuroraContext);
  if (context === undefined) {
    throw new Error('useAurora must be used within an AuroraProvider');
  }
  return context;
}
