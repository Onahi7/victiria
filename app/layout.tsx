import type React from "react"
import type { Metadata } from "next"
import { Mona_Sans as FontSans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/toaster"
import SEOTracking from "@/components/seo-tracking"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "EdifyPub - Digital Publishing Platform",
  description: "Discover inspiring books, writing services, and educational resources on EdifyPub - Your gateway to digital publishing.",
  generator: 'v0.dev',
  metadataBase: new URL('https://edifybooks.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  keywords: ['digital publishing', 'books', 'writing services', 'educational resources', 'online learning', 'publishing platform'],
  authors: [{ name: 'EdifyPub Team' }],
  creator: 'EdifyPub',
  publisher: 'EdifyPub',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://edifybooks.com',
    siteName: 'EdifyPub',
    title: 'EdifyPub - Digital Publishing Platform',
    description: 'Discover inspiring books, writing services, and educational resources on EdifyPub - Your gateway to digital publishing.',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'EdifyPub - Digital Publishing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EdifyPub - Digital Publishing Platform',
    description: 'Discover inspiring books, writing services, and educational resources on EdifyPub - Your gateway to digital publishing.',
    creator: '@edifypub',
    images: ['/placeholder.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex flex-col min-h-screen">
              <SiteHeader />
              <main className="flex-1 overflow-x-hidden">{children}</main>
            </div>
            <Toaster />
            <SEOTracking />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

