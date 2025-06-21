import { Button as HeroButton, ButtonProps } from '@heroui/react';
import { forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return <HeroButton ref={ref} {...props} />;
  },
);

Button.displayName = 'Button';
