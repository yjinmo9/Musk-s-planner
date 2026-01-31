import './globals.css'
import type { Metadata } from 'next'
import { Header, BottomNav } from '@/components/Navigation'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Musk\'s Planner',
  description: 'High-Precision Time-Boxing Planner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#f8f8f8] dark:bg-zinc-950 font-sans antialiased text-black dark:text-white transition-colors duration-300">
        <ThemeProvider>
          <Header />
          <main className="flex flex-col">
            {children}
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
