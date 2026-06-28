import type { Metadata } from 'next'
import { Inter, EB_Garamond } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-garamond',
  display: 'block',
})

export const metadata: Metadata = {
  title: 'Alphagallery Library',
  description: 'A private collection of art, fashion, architecture, design, and photography books available to borrow in Tokyo.',
  openGraph: {
    title: 'Alphagallery Library',
    description: 'A private collection of art, fashion, architecture, design, and photography books available to borrow in Tokyo.',
    url: 'https://alphagallery.co/library',
    siteName: 'Alphagallery',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable}`}>
      <body>{children}</body>
    </html>
  )
}
