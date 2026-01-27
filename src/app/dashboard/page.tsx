'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Search, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const supabase = createClient()
  
  const now = new Date()
  const currentYear = now.getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  
  const [monthlyPlans, setMonthlyPlans] = useState<Array<{id?: string, text: string, completed: boolean}>>([
    { text: '2026년 대규모 프로젝트 시동', completed: true },
    { text: '기술 서적 3권 독파', completed: false },
    { text: '매일 30분 명상 습관화', completed: false }
  ])
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())

  // 데이터 불러오기
  const fetchData = useCallback(async () => {
    if (user) {
      const { data: plansData } = await supabase
        .from('monthly_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
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
  }, [user, supabase, selectedMonth, selectedYear])

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
          year: selectedYear,
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

  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const lastDate = new Date(year, month, 0).getDate()
    const days: { date: number; monthOffset: number }[] = []

    const prevMonthLastDate = new Date(year, month - 1, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: prevMonthLastDate - i, monthOffset: -1 })
    }

    for (let i = 1; i <= lastDate; i++) {
      days.push({ date: i, monthOffset: 0 })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: i, monthOffset: 1 })
    }

    return days
  }

  const handleDateClick = (day: { date: number; monthOffset: number }) => {
    let targetMonth = selectedMonth + day.monthOffset
    let targetYear = selectedYear
    
    if (targetMonth < 1) {
      targetMonth = 12
      targetYear -= 1
    } else if (targetMonth > 12) {
      targetMonth = 1
      targetYear += 1
    }

    const formattedDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
    router.push(`/daily?date=${formattedDate}`)
  }

  const isCompleted = (date: number) => {
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return completedDates.has(formattedDate)
  }

  const changeMonth = (offset: number) => {
    let newMonth = selectedMonth + offset
    let newYear = selectedYear

    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    } else if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }

    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Responsive Header */}
        <div className="mb-8 flex items-end justify-between border-b-4 border-black pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-black p-3 text-white">
                <LayoutDashboard className="size-8" />
             </div>
             <div>
                <h1 className="text-[32px] font-black italic tracking-tighter uppercase leading-none">BIG PICTURE</h1>
                <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-widest">Monthly Mission Control & Strategy</p>
             </div>
          </div>
          <div className="hidden lg:flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CURRENT FOCUS</p>
                <p className="text-xl font-black italic uppercase">{new Date(selectedYear, selectedMonth - 1).toLocaleString('en-US', { month: 'long' })} {selectedYear}</p>
             </div>
             <button className="flex size-12 items-center justify-center border-4 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none">
                <Search className="size-6" />
             </button>
          </div>
        </div>

        {/* Guest Mode Banner */}
        {!user && (
          <div className="mb-8 border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                 <div className="bg-yellow-400 p-2 border-2 border-black">
                    <span className="text-xl">⚠️</span>
                 </div>
                 <div>
                    <p className="text-lg font-black uppercase italic tracking-tighter">게스트 모드 활성화됨</p>
                    <p className="text-sm font-bold text-gray-500 uppercase">기기 간 미션을 동기화하고 전략을 보관하려면 로그인이 필요합니다.</p>
                 </div>
              </div>
              <button 
                onClick={signInWithGoogle}
                className="h-14 min-w-[200px] border-4 border-black bg-black text-white text-sm font-black uppercase italic tracking-[0.2em] hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-[-4px] translate-y-[-4px] active:translate-x-0 active:translate-y-0"
              >
                구글로 지금 동기화
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Monthly Plans (lg:col-span-12 or 5) */}
          <div className="lg:col-span-5 space-y-6">
             <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase italic tracking-tighter">이달의 계획 (MONTHLY STRATEGY)</h3>
                    <button onClick={addPlan} className="border-2 border-black p-1 hover:bg-black hover:text-white transition-all">
                      <Plus className="w-4 h-4 stroke-[3px]" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {monthlyPlans.map((plan, index) => (
                      <div key={index} className="group flex items-center gap-3 border-b-2 border-black/5 pb-2">
                        <button 
                          onClick={() => togglePlan(index)}
                          className={`flex size-6 shrink-0 items-center justify-center border-2 border-black transition-all ${plan.completed ? 'bg-black text-white' : 'bg-white'}`}
                        >
                          {plan.completed && <Check className="w-4 h-4 stroke-[4px]" />}
                        </button>
                        <input 
                           className={`flex-1 bg-transparent text-[13px] font-bold outline-none uppercase ${plan.completed ? 'line-through text-gray-400' : 'text-black'}`}
                           value={plan.text}
                           onChange={(e) => updatePlanText(index, e.target.value)}
                           onBlur={saveMonthlyPlan}
                           placeholder="전략 지점 입력..."
                        />
                      </div>
                    ))}
                  </div>
             </div>
          </div>

          {/* Calendar (lg:col-span-7) */}
          <div className="lg:col-span-7">
             <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-black">
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">{selectedYear}년 {selectedMonth}월</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => changeMonth(-1)}
                      className="size-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => changeMonth(1)}
                      className="size-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-black border-2 border-black">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
                    <div key={i} className="bg-gray-50 py-2 text-center text-[10px] font-black text-gray-400 uppercase">{day}</div>
                  ))}
                  
                  {getCalendarDays(selectedYear, selectedMonth).map((day, index) => {
                    const isToday = day.date === now.getDate() && selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear() && day.monthOffset === 0;
                    const completed = day.monthOffset === 0 && isCompleted(day.date);
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleDateClick(day)}
                        className={`relative aspect-square flex flex-col items-center justify-center cursor-pointer transition-all hover:z-10 bg-white group ${
                          day.monthOffset !== 0 ? 'opacity-20 bg-gray-100 hover:opacity-100 hover:bg-white' : 'hover:bg-black hover:text-white'
                        } ${isToday ? 'ring-4 ring-inset ring-black' : ''}`}
                      >
                        <span className="text-sm font-black italic">{day.date}</span>
                        {completed && (
                          <div className="absolute top-2 right-2 size-2 bg-green-500 rounded-full"></div>
                        )}
                        <div className="absolute inset-0 border border-black/5"></div>
                      </div>
                    )
                  })}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
