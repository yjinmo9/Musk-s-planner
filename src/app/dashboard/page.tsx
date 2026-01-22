'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const supabase = createClient()
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [monthlyPlans, setMonthlyPlans] = useState<Array<{id?: string, text: string, completed: boolean}>>([
    { text: 'Launch V1 of the project', completed: true },
    { text: 'Read 2 productivity books', completed: false },
    { text: 'Daily workout streak (25/30)', completed: false }
  ])
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set([
    '2023-09-01', '2023-09-02', '2023-09-04', '2023-09-05',
    '2023-09-07', '2023-09-08', '2023-09-10', '2023-09-12',
    '2023-09-13', '2023-09-15', '2023-09-16'
  ]))

  // 데이터 불러오기
  const fetchData = useCallback(async () => {
    if (user) {
      const { data: plansData } = await supabase
        .from('monthly_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', new Date().getFullYear())
        .eq('month', selectedMonth)
      
      if (plansData && plansData.length > 0) {
        try {
          const parsed = JSON.parse(plansData[0].content || '[]')
          setMonthlyPlans(Array.isArray(parsed) ? parsed : [])
        } catch {
          setMonthlyPlans([])
        }
      }

      const { data: datesData } = await supabase
        .from('daily_plans')
        .select('date')
        .eq('user_id', user.id)
        .eq('completed', true)
      
      if (datesData) {
        setCompletedDates(new Set(datesData.map(d => d.date)))
      }
    } else {
      const savedPlans = localStorage.getItem('guest_monthly_plans')
      if (savedPlans) {
        try {
          const parsed = JSON.parse(savedPlans)
          setMonthlyPlans(parsed[selectedMonth] || [])
        } catch {
          // Keep default
        }
      }
      
      const savedDates = localStorage.getItem('guest_completed_dates')
      if (savedDates) {
        try {
          setCompletedDates(new Set(JSON.parse(savedDates)))
        } catch {
          // Keep default
        }
      }
    }
  }, [user, supabase, selectedMonth])

  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  }, [authLoading, fetchData])

  const saveMonthlyPlan = async () => {
    if (user) {
      await supabase
        .from('monthly_plans')
        .upsert({
          user_id: user.id,
          year: new Date().getFullYear(),
          month: selectedMonth,
          content: JSON.stringify(monthlyPlans),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,year,month' })
    } else {
      const saved = localStorage.getItem('guest_monthly_plans')
      const plans = saved ? JSON.parse(saved) : {}
      plans[selectedMonth] = monthlyPlans
      localStorage.setItem('guest_monthly_plans', JSON.stringify(plans))
    }
  }

  const togglePlan = (index: number) => {
    const newPlans = [...monthlyPlans]
    newPlans[index].completed = !newPlans[index].completed
    setMonthlyPlans(newPlans)
    saveMonthlyPlan()
  }

  const addPlan = () => {
    setMonthlyPlans([...monthlyPlans, { text: '', completed: false }])
  }

  const updatePlanText = (index: number, text: string) => {
    const newPlans = [...monthlyPlans]
    newPlans[index].text = text
    setMonthlyPlans(newPlans)
  }

  const getCalendarDays = (month: number) => {
    const year = 2023
    const firstDay = new Date(year, month - 1, 1).getDay()
    const lastDate = new Date(year, month, 0).getDate()
    const days: { date: number; isCurrentMonth: boolean }[] = []

    const prevMonthLastDate = new Date(year, month - 1, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: prevMonthLastDate - i, isCurrentMonth: false })
    }

    for (let i = 1; i <= lastDate; i++) {
      days.push({ date: i, isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: i, isCurrentMonth: false })
    }

    return days
  }

  const handleDateClick = (day: { date: number; isCurrentMonth: boolean }) => {
    if (!day.isCurrentMonth) return
    const formattedDate = `2023-${String(selectedMonth).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
    router.push(`/daily?date=${formattedDate}`)
  }

  const isCompleted = (date: number) => {
    const formattedDate = `2023-${String(selectedMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return completedDates.has(formattedDate)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center bg-white p-4 pb-2 justify-between sticky top-0 z-50">
        <div className="text-black flex size-10 shrink-0 items-center justify-center">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <h2 className="text-black text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center uppercase tracking-widest">Big Picture</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 bg-transparent text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Guest Mode Banner */}
      {!user && (
        <div className="p-4 pt-0">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-black p-4 bg-white">
            <div className="flex flex-col gap-1">
              <p className="text-black text-sm font-bold leading-tight uppercase tracking-wide">Browsing as Guest</p>
              <p className="text-slate-500 text-xs font-normal leading-normal">Sign in to sync your 10-minute blocks.</p>
            </div>
            <button 
              onClick={signInWithGoogle}
              className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-8 px-4 bg-black text-white text-xs font-semibold leading-normal uppercase tracking-wider"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      )}

      {/* Monthly Plan Section */}
      <div className="px-4 flex justify-between items-end">
        <h2 className="text-black text-2xl font-bold leading-tight tracking-[-0.015em] pt-2 uppercase">Monthly Plan</h2>
        <p className="text-black text-xs font-black mb-1">SEPTEMBER</p>
      </div>

      <div className="px-4 mt-2">
        <div className="bg-white rounded-xl border border-black overflow-hidden">
          <div className="divide-y divide-black/5">
            {monthlyPlans.map((plan, index) => (
              <label key={index} className="flex gap-x-3 p-4 flex-row items-center cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  checked={plan.completed}
                  onChange={() => togglePlan(index)}
                  className="h-5 w-5 rounded border-black border-2 bg-transparent text-black focus:ring-0 focus:ring-offset-0 focus:outline-none custom-checkbox" 
                  type="checkbox"
                />
                <input
                  type="text"
                  value={plan.text}
                  onChange={(e) => updatePlanText(index, e.target.value)}
                  onBlur={saveMonthlyPlan}
                  className="text-black text-sm font-medium bg-transparent border-none focus:outline-none flex-1"
                  placeholder="Enter objective..."
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex px-4 py-3">
        <button 
          onClick={addPlan}
          className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-xl h-12 px-4 flex-1 border-2 border-black bg-white text-black gap-2 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-black hover:text-white transition-all uppercase"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Objective</span>
        </button>
      </div>

      {/* Month Timeline */}
      <div className="mt-4 relative">
        <div className="flex overflow-x-auto hide-scrollbar px-4 gap-6 items-center border-y border-black/10 py-6">
          {['MAY', 'JUN', 'JUL', 'AUG'].map((month) => (
            <span key={month} className="text-slate-400 font-bold text-sm shrink-0">{month}</span>
          ))}
          <div className="relative flex flex-col items-center shrink-0">
            <div className="cat-icon text-[#4ade80] mb-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.5 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm.5 5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S7.33 19 6.5 19 5 18.33 5 17.5zM12 3L4 9v12h16V9l-8-6z"/>
              </svg>
            </div>
            <span className="text-black font-black text-sm">SEP</span>
            <div className="absolute -bottom-2 w-1.5 h-1.5 bg-black rounded-full"></div>
          </div>
          {['OCT', 'NOV', 'DEC'].map((month) => (
            <span key={month} className="text-slate-400 font-bold text-sm shrink-0">{month}</span>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4 mb-24">
        <div className="bg-white rounded-xl p-4 border border-black">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-black font-black uppercase tracking-wider">September 2023</h3>
            <div className="flex gap-2">
              <button className="p-1 text-black">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 text-black">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center gap-y-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
            ))}
            
            {getCalendarDays(9).map((day, index) => (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`relative flex flex-col items-center justify-center h-8 cursor-pointer ${
                  !day.isCurrentMonth ? 'text-slate-200' : day.date === 5 ? 'text-black font-black underline underline-offset-2' : 'text-black font-medium'
                }`}
              >
                <span className="text-xs">{day.date}</span>
                {day.isCurrentMonth && isCompleted(day.date) && (
                  <div className="absolute bottom-0 w-1.5 h-1.5 bg-success rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full max-w-[430px] bg-white border-t border-black px-8 py-4 flex justify-between items-center z-50">
        <button 
          onClick={() => router.push('/')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button 
          onClick={() => router.push('/daily')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase">Daily</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-black">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          <span className="text-[10px] font-black uppercase">Board</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase">Settings</span>
        </button>
      </div>
    </div>
  )
}
