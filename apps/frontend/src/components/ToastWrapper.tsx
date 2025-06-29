'use client';

import { ToastProvider } from '@heroui/toast';

export function ToastWrapper() {
  return <ToastProvider placement="top-right" />;
}
