import './globals.css'

export const metadata = {
  title: '마이 플래너',
  description: '일정 관리를 위한 플래너 애플리케이션',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}