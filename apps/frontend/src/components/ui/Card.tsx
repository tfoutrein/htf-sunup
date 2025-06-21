import {
  Card as HeroCard,
  CardProps,
  CardHeader,
  CardBody,
  CardFooter,
} from '@heroui/react';
import { forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  return <HeroCard ref={ref} {...props} />;
});

Card.displayName = 'Card';

export { CardHeader, CardBody, CardFooter };
