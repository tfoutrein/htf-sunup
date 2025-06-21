import { Progress as HeroProgress, ProgressProps } from '@heroui/react';
import { forwardRef } from 'react';

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (props, ref) => {
    return <HeroProgress ref={ref} {...props} />;
  },
);

Progress.displayName = 'Progress';
