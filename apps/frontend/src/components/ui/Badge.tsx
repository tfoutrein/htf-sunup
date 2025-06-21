import { Chip as HeroBadge, ChipProps } from '@heroui/react';
import { forwardRef } from 'react';

export const Badge = forwardRef<HTMLDivElement, ChipProps>((props, ref) => {
  return <HeroBadge ref={ref} {...props} />;
});

Badge.displayName = 'Badge';
