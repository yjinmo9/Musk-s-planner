import './globals.css'
import type { Metadata } from 'next'
import { Header, BottomNav } from '@/components/Navigation'

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
      <body className="min-h-screen bg-[#f8f8f8] font-sans antialiased text-black">
        <Header />
        <main className="flex flex-col">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
