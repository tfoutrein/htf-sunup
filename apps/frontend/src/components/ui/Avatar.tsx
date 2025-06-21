import { Avatar as HeroAvatar, AvatarProps } from '@heroui/react';
import { forwardRef } from 'react';

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>((props, ref) => {
  return <HeroAvatar ref={ref} {...props} />;
});

Avatar.displayName = 'Avatar';
