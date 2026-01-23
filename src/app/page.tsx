'use client'

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
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden max-w-[430px] mx-auto bg-white border-x border-black">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-black">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center bg-black">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
            </svg>
          </div>
          <h2 className="text-base font-bold tracking-tight uppercase">Musk&apos;s Planner</h2>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex size-10 items-center justify-center border border-black bg-white hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
        {/* Title Section */}
        <div className="mb-10 max-w-md">
          <h1 className="text-black text-[48px] font-black leading-[1.05] mb-5 uppercase italic tracking-tight">
            Precision<br/>Time-Boxing
          </h1>
          <div className="h-[2px] w-16 bg-black mx-auto mb-5"></div>
          <p className="text-gray-600 text-[13px] font-semibold leading-relaxed tracking-wide uppercase">
            Master your schedule in high-intensity 10-minute intervals.
          </p>
        </div>

        {/* Main Action Button */}
        <div className="w-full max-w-md mb-10">
          <button 
            onClick={handleDailyPlannerClick}
            className="flex h-16 w-full items-center justify-center bg-black text-white text-base font-bold uppercase tracking-[0.2em] transition-all hover:bg-gray-900 active:translate-y-0.5"
          >
            <span>TODAY&apos;S PLANNER</span>
          </button>
        </div>

        {/* Guest Mode Warning */}
        {!user && (
          <div className="w-full max-w-md mb-10">
            <div className="flex flex-col items-start gap-3 border-2 border-black bg-white p-5 text-left">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-black text-[18px]">warning</span>
                <p className="text-black text-[11px] font-black uppercase tracking-wider">Guest Mode Active</p>
              </div>
              <p className="text-gray-600 text-[11px] font-medium leading-relaxed">
                Data is stored locally. Sign in to sync your mission across devices.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer - Login Section */}
      <footer className="px-8 pb-10 w-full">
        <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
          <div className="flex items-center w-full gap-4">
            <div className="h-[1px] flex-1 bg-gray-300"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {user ? 'Account' : 'Sync Mission'}
            </p>
            <div className="h-[1px] flex-1 bg-gray-300"></div>
          </div>
          
          {!user ? (
            <>
              <button 
                onClick={handleGoogleLogin}
                className="flex h-12 w-full items-center justify-center gap-3 bg-white text-black transition-all border border-gray-300 hover:border-black active:scale-[0.98]"
              >
                <img 
                  alt="Google" 
                  className="w-4 h-4 grayscale" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZQc-51DbWQ9kHZwKiUJChjRtEFK2EWaopO0s0bPD8r6601FT6YZMjbBfE6HWWC827TASSLXAsIeaYjENuWfXfG31hXiq-ZIZe-wdajElpMSBWTJyoGJY_2-9gK18LjcVXDM88Hidmq-0No5_zWMIUaHpT5S68s2dK-b98-vih2MQeeiYGgzsTpSTuKGOPIO7_N_bh5TMffiywmMXW3JE64OCVLSMWYim06V4bEIRy4K1QL7F4EkxAC8EX5CH-6fdyzr21Fv9xkbEt"
                />
                <span className="text-[11px] font-bold uppercase tracking-wider">Continue with Google</span>
              </button>
              <button className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] hover:text-black transition-colors">
                Other Sign-In Options
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <p className="text-sm text-gray-600 font-medium">
                {user.email}
              </p>
              <button 
                onClick={signOut}
                className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] hover:text-black transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Bottom Navigation */}
      <nav className="border-t border-black bg-white">
        <div className="flex h-16 items-center justify-around px-4 pb-2">
          <button className="flex flex-col items-center gap-1 text-black">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-[10px] font-black uppercase">Home</span>
          </button>
          <button 
            onClick={handleDailyPlannerClick}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <span className="text-[10px] font-bold uppercase">Daily</span>
          </button>
          <button 
            onClick={handleDashboardClick}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span className="text-[10px] font-bold uppercase">Board</span>
          </button>
          <button 
            onClick={() => router.push('/stats')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span className="text-[10px] font-bold uppercase">Stats</span>
          </button>
          <button 
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-bold uppercase">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
