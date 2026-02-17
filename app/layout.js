import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Poem Studio - Create, Share, Discover Poetry',
  description: 'A beautiful platform for creating, sharing, and discovering poems. Join our community of poetry lovers.',
  icons: {
    icon: '/logo.jpg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
