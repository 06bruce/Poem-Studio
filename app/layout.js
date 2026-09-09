import './globals.css'
import { Inter, Space_Grotesk, Orbitron, Fraunces } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { SessionProvider } from "next-auth/react"
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', style: ['normal', 'italic'] })

// Sets data-theme on <html> before first paint (reading the same localStorage
// key ThemeContext persists to) so there's no flash of the wrong theme.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export const metadata = {
  title: {
    default: 'Poem Studio — Create, Share & Discover Poetry',
    template: '%s | Poem Studio'
  },
  description: 'A beautiful platform for creating, sharing, and discovering poems. Join our global community of poetry lovers and express yourself through the art of words.',
  keywords: ['poetry', 'poems', 'creative writing', 'poetry community', 'write poems', 'share poetry'],
  authors: [{ name: 'Poem Studio' }],
  creator: 'Poem Studio',
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Poem Studio',
    title: 'Poem Studio — Create, Share & Discover Poetry',
    description: 'A beautiful platform for creating, sharing, and discovering poems. Join our global community of poetry lovers.',
    images: [{ url: '/logo.jpg', width: 512, height: 512, alt: 'Poem Studio' }],
  },
  twitter: {
    card: 'summary',
    title: 'Poem Studio — Create, Share & Discover Poetry',
    description: 'A beautiful platform for creating, sharing, and discovering poems.',
    images: ['/logo.jpg'],
  },
  robots: {
    index: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // theme-color is managed manually as a <meta> tag in <head> below and kept
  // in sync with the active theme by ThemeContext, since Next's static
  // `themeColor` export can't change at runtime with the toggle.
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0c0e17" />
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable} ${fraunces.variable} font-sans`}>
        <SessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <ServiceWorkerRegister />
                {children}
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
