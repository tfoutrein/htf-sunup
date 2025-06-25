'use client';

import { LogoChoice } from '@/contexts/LogoContext';

interface LogoDisplayProps {
  logoChoice: LogoChoice;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoDisplay({
  logoChoice,
  size = 'md',
  className = '',
}: LogoDisplayProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'md':
        return 'w-8 h-8';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  if (logoChoice === 'sun') {
    return <span className={`text-2xl ${className}`}>☀️</span>;
  }

  return (
    <img
      src={logoChoice === 'logo1' ? '/logo1.png' : '/logo2.png'}
      alt={logoChoice === 'logo1' ? 'Logo 1' : 'Logo 2'}
      className={`${getSizeClasses()} object-contain ${className}`}
    />
  );
}
