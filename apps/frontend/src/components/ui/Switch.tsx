import { Switch as HeroSwitch, SwitchProps } from '@heroui/react';
import { forwardRef } from 'react';

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (props, ref) => {
    return <HeroSwitch ref={ref} {...props} />;
  },
);

Switch.displayName = 'Switch';
