'use client';

import { useAurora } from '@/contexts/AuroraContext';
import { Aurora } from './Aurora';

interface AuroraBackgroundProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  time?: number;
}

export function AuroraBackground(props: AuroraBackgroundProps) {
  const { isAuroraEnabled } = useAurora();

  if (!isAuroraEnabled) {
    return null;
  }

  return <Aurora {...props} />;
}
