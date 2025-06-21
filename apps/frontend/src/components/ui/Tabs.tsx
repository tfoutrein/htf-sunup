import { Tabs as HeroTabs, Tab, TabsProps } from '@heroui/react';
import { forwardRef } from 'react';

export const Tabs = forwardRef<HTMLDivElement, TabsProps>((props, ref) => {
  return <HeroTabs ref={ref} {...props} />;
});

Tabs.displayName = 'Tabs';

export { Tab };
