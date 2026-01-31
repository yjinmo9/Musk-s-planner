'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export const dynamic = 'force-dynamic'

export default function Home() {
  const router = useRouter()
  const { user, loading, signOut, signInWithGoogle, signInWithKakao, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

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

  const handleKakaoLogin = async () => {
    await signInWithKakao()
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)
      
      if (error) {
        setAuthError(error.message)
      } else if (isSignUp) {
        setAuthError('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
      }
    } catch (err) {
      setAuthError('인증 중 오류가 발생했습니다.')
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f5f5] dark:bg-zinc-950 transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </main>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-950 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 gap-12 py-12 lg:grid-cols-2 lg:items-center lg:py-24">
          
          {/* Left Column: Hero Text */}
          <div className="flex flex-col items-start text-left">
            <div className="mb-8">
              <span className="text-[11px] font-black tracking-[0.3em] text-gray-500 dark:text-gray-400 uppercase">HIGH-PRECISION PRODUCTIVITY</span>
              <h1 className="mt-4 text-[56px] font-black leading-[0.95] tracking-tighter text-black dark:text-white sm:text-[84px] md:text-[96px] uppercase italic">
                초정밀<br/>타임박싱
              </h1>
              <div className="mt-8 h-1 w-20 bg-black dark:bg-white"></div>
            </div>

            <p className="max-w-md text-[16px] font-bold leading-relaxed text-gray-600 dark:text-gray-400 uppercase tracking-tight sm:text-[18px]">
              10분 단위의 고강도 인터발로 하루의 효율을 극한으로 끌어올리세요. 시스템 기반의 계획이 성공을 정의합니다.
            </p>

            <div className="mt-12 w-full max-w-sm">
              <button 
                onClick={handleDailyPlannerClick}
                className="group relative flex h-20 w-full items-center justify-center overflow-hidden bg-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10 text-[18px] font-black tracking-[0.2em] uppercase">오늘의 미션 시작하기</span>
                <div className="absolute inset-0 translate-y-full bg-blue-600 transition-transform group-hover:translate-y-0"></div>
              </button>
            </div>

            {/* Micro Stats */}
            <div className="mt-16 flex gap-12 border-t border-black/10 dark:border-white/10 pt-10">
              <div>
                <p className="text-[24px] font-black text-black dark:text-white">1.2M+</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">USERS</p>
              </div>
              <div>
                <p className="text-[24px] font-black text-black dark:text-white">99.9%</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UPTIME</p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px]">
              {/* Card Decoration */}
              <div className="absolute -right-4 -top-4 -z-10 h-full w-full border-4 border-black dark:border-white bg-white dark:bg-zinc-900"></div>
              
              <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 p-8 sm:p-12">
                <div className="mb-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-[32px] font-black tracking-tighter text-black dark:text-white uppercase italic">MISSION CONTROL</h2>
                    <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide">미션 동기화를 위해 로그인하세요.</p>
                  </div>
                  <div className="flex size-12 items-center justify-center bg-black dark:bg-white text-white dark:text-black">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
                    </svg>
                  </div>
                </div>

                {!user ? (
                  <div className="space-y-6">
                    <button 
                      onClick={handleGoogleLogin}
                      className="flex h-16 w-full items-center justify-center gap-4 border-2 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 transition-all hover:border-black dark:hover:border-white active:scale-[0.98]"
                    >
                      <NextImage alt="Google" width={20} height={20} className="grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZQc-51DbWQ9kHZwKiUJChjRtEFK2EWaopO0s0bPD8r6601FT6YZMjbBfE6HWWC827TASSLXAsIeaYjENuWfXfG31hXiq-ZIZe-wdajElpMSBWTJyoGJY_2-9gK18LjcVXDM88Hidmq-0No5_zWMIUaHpT5S68s2dK-b98-vih2MQeeiYGgzsTpSTuKGOPIO7_N_bh5TMffiywmMXW3JE64OCVLSMWYim06V4bEIRy4K1QL7F4EkxAC8EX5CH-6fdyzr21Fv9xkbEt" />
                      <span className="text-[13px] font-black uppercase tracking-wider dark:text-white">GOOGLE 계정으로 계속하기</span>
                    </button>

                    <button 
                      onClick={handleKakaoLogin}
                      className="flex h-16 w-full items-center justify-center gap-4 border-2 border-slate-200 dark:border-zinc-700 bg-[#FEE500] transition-all hover:border-black dark:hover:border-white active:scale-[0.98]"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.764 1.828 5.192 4.56 6.56l-1.174 4.293a.5.5 0 00.746.576l5.06-3.373c.27.02.544.03.82.03 5.523 0 10-3.477 10-7.75S17.523 3 12 3z" fill="#3C1E1E"/>
                      </svg>
                      <span className="text-[13px] font-black uppercase tracking-wider text-[#3C1E1E]">KAKAO 계정으로 계속하기</span>
                    </button>

                    <div className="flex items-center gap-4 py-2">
                      <div className="h-[1px] flex-1 bg-gray-200 dark:bg-zinc-700"></div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">OR EMAIL ACCESS</span>
                      <div className="h-[1px] flex-1 bg-gray-200 dark:bg-zinc-700"></div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">EMAIL ADDRESS</label>
                        <input 
                          type="email" 
                          placeholder="COMMANDER@MARS.COM"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-14 w-full border-2 border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 text-sm font-bold uppercase outline-none focus:border-black dark:focus:border-white text-black dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PASSWORD</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="h-14 w-full border-2 border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 text-sm font-bold outline-none focus:border-black dark:focus:border-white text-black dark:text-white"
                        />
                      </div>
                      
                      {authError && (
                        <div className="border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-3">
                          <p className="text-[10px] font-medium text-red-700 dark:text-red-400">{authError}</p>
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={authLoading}
                        className="h-14 w-full bg-black dark:bg-white text-[12px] font-black text-white dark:text-black transition-all hover:bg-gray-900 dark:hover:bg-gray-100 uppercase tracking-[0.2em] disabled:opacity-50"
                      >
                        {authLoading ? '처리 중...' : (isSignUp ? '회원가입' : '계속하기')}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(!isSignUp)
                          setAuthError('')
                        }}
                        className="w-full text-[10px] font-bold text-gray-500 hover:text-black uppercase tracking-wide underline decoration-dotted"
                      >
                        {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                      </button>
                    </form>

                    <div className="mt-8 border-2 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/30 p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-yellow-600">⚠️</span>
                        <div>
                          <p className="text-[10px] font-black text-yellow-800 dark:text-yellow-400 uppercase tracking-widest">WARNING: GUEST MODE</p>
                          <p className="mt-1 text-[10px] font-medium leading-relaxed text-yellow-700 dark:text-yellow-500">데이터는 브라우저에 임시로 저장됩니다. 기기 간 미션을 동기화하려면 로그인하세요.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 py-8">
                    <div className="text-center">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">현재 로그인 첩부</p>
                      <p className="mt-2 text-[18px] font-black text-black dark:text-white">{user.email}</p>
                    </div>
                    <button 
                      onClick={signOut}
                      className="text-[11px] font-black text-red-500 underline decoration-2 underline-offset-4 hover:text-red-700 dark:hover:text-red-400"
                    >
                      로그아웃 (SIGN OUT)
                    </button>
                    <button 
                      onClick={handleDailyPlannerClick}
                      className="mt-4 h-14 w-full border-2 border-black dark:border-white bg-white dark:bg-zinc-900 text-[12px] font-black text-black dark:text-white transition-all hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black uppercase tracking-[0.2em]"
                    >
                      내 플래너로 이동
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
