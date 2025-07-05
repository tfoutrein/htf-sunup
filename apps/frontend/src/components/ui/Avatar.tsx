import { Avatar as HeroAvatar, AvatarProps } from '@heroui/react';
import { forwardRef } from 'react';

interface EnhancedAvatarProps extends AvatarProps {
  profilePicture?: string;
}

export const Avatar = forwardRef<HTMLSpanElement, EnhancedAvatarProps>(
  ({ profilePicture, ...props }, ref) => {
    // Si on a une photo de profil, on l'utilise comme src
    const avatarProps = profilePicture
      ? { ...props, src: profilePicture }
      : props;

    return <HeroAvatar ref={ref} {...avatarProps} />;
  },
);

Avatar.displayName = 'Avatar';
