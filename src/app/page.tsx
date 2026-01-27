'use client'

import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </main>
    )
  }

  return (
    <div className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 gap-12 py-12 lg:grid-cols-2 lg:items-center lg:py-24">
          
          {/* Left Column: Hero Text */}
          <div className="flex flex-col items-start text-left">
            <div className="mb-8">
              <span className="text-[11px] font-black tracking-[0.3em] text-gray-500 uppercase">HIGH-PRECISION PRODUCTIVITY</span>
              <h1 className="mt-4 text-[56px] font-black leading-[0.95] tracking-tighter text-black sm:text-[84px] md:text-[96px] uppercase italic">
                초정밀<br/>타임박싱
              </h1>
              <div className="mt-8 h-1 w-20 bg-black"></div>
            </div>

            <p className="max-w-md text-[16px] font-bold leading-relaxed text-gray-600 uppercase tracking-tight sm:text-[18px]">
              10분 단위의 고강도 인터벌로 하루의 효율을 극한으로 끌어올리세요. 시스템 기반의 계획이 성공을 정의합니다.
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
            <div className="mt-16 flex gap-12 border-t border-black/10 pt-10">
              <div>
                <p className="text-[24px] font-black text-black">1.2M+</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">USERS</p>
              </div>
              <div>
                <p className="text-[24px] font-black text-black">99.9%</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UPTIME</p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px]">
              {/* Card Decoration */}
              <div className="absolute -right-4 -top-4 -z-10 h-full w-full border-4 border-black bg-white"></div>
              
              <div className="border-4 border-black bg-white p-8 sm:p-12">
                <div className="mb-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-[32px] font-black tracking-tighter text-black uppercase italic">MISSION CONTROL</h2>
                    <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide">미션 동기화를 위해 로그인하세요.</p>
                  </div>
                  <div className="flex size-12 items-center justify-center bg-black text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
                    </svg>
                  </div>
                </div>

                {!user ? (
                  <div className="space-y-6">
                    <button 
                      onClick={handleGoogleLogin}
                      className="flex h-16 w-full items-center justify-center gap-4 border-2 border-slate-200 bg-white transition-all hover:border-black active:scale-[0.98]"
                    >
                      <NextImage alt="Google" width={20} height={20} className="grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZQc-51DbWQ9kHZwKiUJChjRtEFK2EWaopO0s0bPD8r6601FT6YZMjbBfE6HWWC827TASSLXAsIeaYjENuWfXfG31hXiq-ZIZe-wdajElpMSBWTJyoGJY_2-9gK18LjcVXDM88Hidmq-0No5_zWMIUaHpT5S68s2dK-b98-vih2MQeeiYGgzsTpSTuKGOPIO7_N_bh5TMffiywmMXW3JE64OCVLSMWYim06V4bEIRy4K1QL7F4EkxAC8EX5CH-6fdyzr21Fv9xkbEt" />
                      <span className="text-[13px] font-black uppercase tracking-wider">GOOGLE 계정으로 계속하기</span>
                    </button>

                    <div className="flex items-center gap-4 py-2">
                      <div className="h-[1px] flex-1 bg-gray-200"></div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">OR EMAIL ACCESS</span>
                      <div className="h-[1px] flex-1 bg-gray-200"></div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">EMAIL ADDRESS</label>
                        <input 
                          type="email" 
                          placeholder="COMMANDER@MARS.COM"
                          className="h-14 w-full border-2 border-gray-100 bg-gray-50 px-4 text-sm font-bold uppercase outline-none focus:border-black"
                        />
                      </div>
                      <button className="h-14 w-full bg-black text-[12px] font-black text-white transition-all hover:bg-gray-900 uppercase tracking-[0.2em]">계속하기</button>
                    </div>

                    <div className="mt-8 border-2 border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-yellow-600">⚠️</span>
                        <div>
                          <p className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">WARNING: GUEST MODE</p>
                          <p className="mt-1 text-[10px] font-medium leading-relaxed text-yellow-700">데이터는 브라우저에 임시로 저장됩니다. 기기 간 미션을 동기화하려면 로그인하세요.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest underline decoration-dotted transition-colors hover:text-black">
                      기타 로그인 방식
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 py-8">
                    <div className="text-center">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">현재 로그인 첩부</p>
                      <p className="mt-2 text-[18px] font-black text-black">{user.email}</p>
                    </div>
                    <button 
                      onClick={signOut}
                      className="text-[11px] font-black text-red-500 underline decoration-2 underline-offset-4 hover:text-red-700"
                    >
                      로그아웃 (SIGN OUT)
                    </button>
                    <button 
                      onClick={handleDailyPlannerClick}
                      className="mt-4 h-14 w-full border-2 border-black bg-white text-[12px] font-black text-black transition-all hover:bg-black hover:text-white uppercase tracking-[0.2em]"
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
