import './globals.css';
import Footer from '@/components/Footer';
import SplashWrapper from '@/components/SplashWrapper';

export const metadata = {
  title: 'BKN-Running',
  description: 'Platform Kesamaptaan Digital Sekolah',
  manifest: '/manifest.json',
  themeColor: '#f97316',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BKN-Running" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="flex flex-col min-h-screen">
        <SplashWrapper>
          <div className="flex-1">{children}</div>
          <Footer />
        </SplashWrapper>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
