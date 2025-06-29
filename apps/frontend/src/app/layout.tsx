import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { ToastWrapper } from '@/components/ToastWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Les défis de l'été - Happy Team Factory",
  description:
    "Les défis de l'été by Happy Team Factory - Des défis quotidiens pour booster ton équipe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <Providers>
          <Navigation />
          {children}
          <ToastWrapper />
        </Providers>
      </body>
    </html>
  );
}
