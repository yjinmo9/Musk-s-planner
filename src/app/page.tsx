'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function Home() {
  const router = useRouter()
  const { user, loading, signOut, signInWithGoogle } = useAuth()

  const handleDailyPlannerClick = () => {
    const today = new Date()
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    router.push(`/daily?date=${formattedDate}`)
  }

  const handleDashboardClick = () => {
    router.push('/dashboard')
  }

  const handleGoogleLogin = async () => {
    await signInWithGoogle()
  }

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-2">마이 플래너</h1>
        <p className="text-muted-foreground mb-8">
          {user ? `${user.email}님 환영합니다!` : '로그인 없이 바로 시작하세요'}
        </p>
        
        {/* 메인 기능 버튼 - 항상 표시 */}
        <div className="flex flex-col gap-3 items-center mb-8">
          <Button 
            onClick={handleDashboardClick}
            variant="gradient"
            size="xl"
            className="w-56"
          >
            대시보드
          </Button>
          <Button 
            onClick={handleDailyPlannerClick}
            variant="gradient"
            size="xl"
            className="w-56"
          >
            오늘의 플래너
          </Button>
        </div>

        {/* 로그인 섹션 */}
        <div className="border-t pt-6">
          {!user ? (
            <div className="flex flex-col gap-3 items-center">
              <p className="text-sm text-muted-foreground mb-2">
                데이터를 계정에 저장하려면 로그인하세요
              </p>
              <Button 
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-56 flex gap-2"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                구글로 로그인
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleLogout}
              variant="ghost"
              className="text-muted-foreground"
            >
              로그아웃
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
