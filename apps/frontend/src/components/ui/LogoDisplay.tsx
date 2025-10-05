'use client';

interface LogoDisplayProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LogoDisplay({ size = 'md', className = '' }: LogoDisplayProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'md':
        return 'w-10 h-10';
      case 'lg':
        return 'w-16 h-16';
      default:
        return 'w-10 h-10';
    }
  };

  return (
    <img
      src="/Logo VERT Happy Team.png"
      alt="Logo Happy Team Factory"
      className={`${getSizeClasses()} object-contain ${className}`}
    />
  );
}
