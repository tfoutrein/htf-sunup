import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalProps,
  useDisclosure,
} from '@heroui/react';
import { forwardRef } from 'react';

export const Modal = forwardRef<HTMLDivElement, ModalProps>((props, ref) => {
  return <HeroModal ref={ref} {...props} />;
});

Modal.displayName = 'Modal';

export { ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure };
