import type { ReactNode } from 'react';
import './globals.css';
import AuthNav from '@/components/AuthNav';

export const metadata = {
  title: 'Andemar — Tours en Colombia',
  description: 'El Caribe y los Andes, en un mismo viaje.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthNav />
        {children}
      </body>
    </html>
  );
}
