import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'FitAI Pro',
  description: 'Entrenamiento, nutrición, progreso y gestión de clientes con datos locales cifrados.',
  applicationName: 'FitAI Pro',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'FitAI Pro',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0c10',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
