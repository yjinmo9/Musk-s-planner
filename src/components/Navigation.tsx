'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Moon, Sun, Settings, Home, Calendar, LayoutDashboard, BarChart3, User } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const navItems = [
    { label: 'HOME', path: '/', icon: Home },
    { label: 'DAILY', path: '/daily', icon: Calendar },
    { label: 'BOARD', path: '/dashboard', icon: LayoutDashboard },
    { label: 'STATS', path: '/stats', icon: BarChart3 },
    { label: 'SETTINGS', path: '/settings', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black dark:border-white bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <div 
          onClick={() => router.push('/')}
          className="flex cursor-pointer items-center gap-2"
        >
          <div className="flex size-8 items-center justify-center bg-black dark:bg-white">
            <svg className="w-4 h-4 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
            </svg>
          </div>
          <h2 className="hidden text-sm font-black tracking-tighter sm:block uppercase italic">MUSK&apos;S PLANNER</h2>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`px-4 py-2 text-[11px] font-black tracking-widest transition-all uppercase ${
                pathname === item.path 
                  ? 'bg-black dark:bg-white text-white dark:text-black' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile Title (visible only on mobile) */}
        <div className="md:hidden">
            <span className="text-[10px] font-black tracking-[0.2em] text-gray-400">
                {pathname === '/' ? 'HOME' : 
                 pathname?.includes('/daily') ? 'DAILY PLANNER' :
                 pathname?.includes('/dashboard') ? 'MISSION CONTROL' :
                 pathname?.includes('/stats') ? 'ANALYTICS' : 'SETTINGS'}
            </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex size-9 items-center justify-center border border-black dark:border-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => router.push('/settings')}
            className="flex size-9 items-center justify-center border border-black dark:border-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { label: '홈', path: '/', icon: Home },
    { label: '일간', path: '/daily', icon: Calendar },
    { label: '보드', path: '/dashboard', icon: LayoutDashboard },
    { label: '통계', path: '/stats', icon: BarChart3 },
    { label: '설정', path: '/settings', icon: Settings },
  ]

  const handleNav = (path: string) => {
    if (path === '/daily') {
        const today = new Date()
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        router.push(`/daily?date=${formattedDate}`)
    } else {
        router.push(path)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-black dark:border-white bg-white dark:bg-zinc-950 md:hidden transition-colors duration-300">
      <div className="flex h-16 items-center justify-around px-2 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || (item.path === '/daily' && pathname?.includes('/daily'))
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className={`text-[9px] uppercase ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

