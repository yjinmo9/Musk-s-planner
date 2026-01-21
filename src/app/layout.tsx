import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '마이 플래너',
  description: '일정 관리를 위한 플래너 애플리케이션',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
