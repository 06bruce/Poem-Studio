import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ['latin'] })

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
  themeColor: '#0f172a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
