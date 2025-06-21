import { Input as HeroInput, InputProps } from '@heroui/react';
import { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <HeroInput ref={ref} {...props} />;
});

Input.displayName = 'Input';
