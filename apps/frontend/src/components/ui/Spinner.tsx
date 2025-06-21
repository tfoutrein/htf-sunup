import { Spinner as HeroSpinner, SpinnerProps } from '@heroui/react';
import { forwardRef } from 'react';

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (props, ref) => {
    return <HeroSpinner ref={ref} {...props} />;
  },
);

Spinner.displayName = 'Spinner';
