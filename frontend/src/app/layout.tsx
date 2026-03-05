import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'DocMind AI — Ask anything about your documents',
  description: 'Upload PDFs and ask AI-powered questions with cited answers.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0a1a] text-white min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
