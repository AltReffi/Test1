import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Morning Brief Builder',
  description: 'Build structured Danish voice prompts for morning briefs.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
