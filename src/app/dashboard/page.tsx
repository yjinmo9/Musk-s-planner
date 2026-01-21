'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'


export const dynamic = 'force-dynamic'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [monthlyPlans, setMonthlyPlans] = useState<Record<number, string[]>>({})
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())


  // 데이터 불러오기 - 로그인 시 Supabase, 비로그인 시 localStorage
  const fetchData = useCallback(async () => {
    if (user) {
      // Supabase에서 불러오기
      const { data: plansData } = await supabase
        .from('monthly_plans')
        .select('month, content')
        .eq('user_id', user.id)
        .eq('year', new Date().getFullYear())
      
      if (plansData) {
        const plans: Record<number, string[]> = {}
        plansData.forEach((plan) => {
          try {
            const parsed = JSON.parse(plan.content || '[]')
            plans[plan.month] = Array.isArray(parsed) ? parsed : [plan.content]
          } catch {
            // 기존 텍스트 데이터가 있을 경우 배열로 감싸서 처리
            plans[plan.month] = plan.content ? [plan.content] : ['', '', '', '', '']
          }
        })
        setMonthlyPlans(plans)
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
      // localStorage에서 불러오기
      const savedPlans = localStorage.getItem('guest_monthly_plans')
      if (savedPlans) setMonthlyPlans(JSON.parse(savedPlans))
      else {
        // 기본값 설정 (모든 월에 대해 5개씩)
        const initialPlans: Record<number, string[]> = {}
        for (let i = 1; i <= 12; i++) initialPlans[i] = ['', '', '', '', '']
        setMonthlyPlans(initialPlans)
      }

      
      const savedDates = localStorage.getItem('guest_completed_dates')
      if (savedDates) setCompletedDates(new Set(JSON.parse(savedDates)))
    }
  }, [user, supabase])

  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  }, [authLoading, fetchData])

  // 월별 데이터 저장
  const saveMonthlyPlan = async (month: number, plans: string[]) => {
    if (user) {
      await supabase
        .from('monthly_plans')
        .upsert({
          user_id: user.id,
          year: new Date().getFullYear(),
          month,
          content: JSON.stringify(plans),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,year,month' })
    } else {
      // localStorage에 저장
      const newPlans = { ...monthlyPlans, [month]: plans }
      localStorage.setItem('guest_monthly_plans', JSON.stringify(newPlans))
    }
  }

  const handlePlanChange = (index: number, value: string) => {
    const currentPlans = monthlyPlans[selectedMonth] || ['', '', '', '', '']
    const newPlans = [...currentPlans]
    newPlans[index] = value
    setMonthlyPlans(prev => ({ ...prev, [selectedMonth]: newPlans }))
  }

  const addMonthlyPlan = () => {
    const currentPlans = monthlyPlans[selectedMonth] || ['', '', '', '', '']
    const newPlans = [...currentPlans, '']
    setMonthlyPlans(prev => ({ ...prev, [selectedMonth]: newPlans }))
    saveMonthlyPlan(selectedMonth, newPlans)
  }

  const removeMonthlyPlan = (index: number) => {
    const currentPlans = monthlyPlans[selectedMonth] || ['', '', '', '', '']
    if (currentPlans.length > 1) {
      const newPlans = currentPlans.filter((_, i) => i !== index)
      setMonthlyPlans(prev => ({ ...prev, [selectedMonth]: newPlans }))
      saveMonthlyPlan(selectedMonth, newPlans)
    }
  }

  const handlePlanBlur = () => {
    saveMonthlyPlan(selectedMonth, monthlyPlans[selectedMonth] || ['', '', '', '', ''])
  }


  // 달력 계산
  const getCalendarDays = (month: number) => {
    const year = new Date().getFullYear()
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
    const formattedDate = `${new Date().getFullYear()}-${String(selectedMonth).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
    router.push(`/daily?date=${formattedDate}`)
  }

  const isCompleted = (date: number) => {
    const formattedDate = `${new Date().getFullYear()}-${String(selectedMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return completedDates.has(formattedDate)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto flex gap-8">
        {/* 왼쪽 사이드바 */}
        <div className="w-72 flex flex-col gap-4">
          <div className="p-4 bg-card border rounded-lg flex justify-between items-center">
            <span className="font-medium">마이 플래너</span>
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              홈
            </Button>
          </div>
          
          {!user && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              ⚠️ 게스트 모드입니다. 로그인하면 데이터가 계정에 저장됩니다.
            </div>
          )}
          
          <div className="flex-1 p-4 bg-card border rounded-lg flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="font-medium">월간 계획</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={addMonthlyPlan}
                className="h-8 w-8 p-0 rounded-full hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
              {(monthlyPlans[selectedMonth] || ['', '', '', '', '']).map((plan, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <Checkbox className="h-4 w-4 shrink-0" />
                  <textarea
                    value={plan}
                    onChange={(e) => {
                      handlePlanChange(index, e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onBlur={handlePlanBlur}
                    rows={1}
                    placeholder="계획을 입력하세요"
                    className="border-0 border-b rounded-none focus-visible:outline-none px-0 flex-1 resize-none overflow-hidden bg-transparent py-1 min-h-[1.5rem] text-sm"
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                  />
                  {(monthlyPlans[selectedMonth]?.length || 0) > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMonthlyPlan(index)}
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex flex-col gap-8">
          {/* 연간 타임라인 */}
          <div className="relative border-b pb-2 mb-10">
            <div className="flex justify-between items-center relative z-10">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <Button
                  key={month}
                  variant={month === selectedMonth ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedMonth(month)}
                  className="flex-1 max-w-[60px]"
                >
                  {month}월
                </Button>
              ))}
            </div>
            
            {/* Sliding Cat Indicator (Below the line) */}
            <div 
              className="absolute top-full transition-all duration-500 ease-in-out pointer-events-none z-0"
              style={{ 
                left: `${((selectedMonth - 1) / 11) * 100}%`,
                width: '8.33%', // 100 / 12
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div className="flex flex-col items-center">
                {/* 점이 선에 딱 붙도록 위치 조절 */}
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full -mt-[3px]" />
                <svg 
                  viewBox="0 0 100 60" 
                  width="36" 
                  height="22" 
                  className="running-cat mt-1"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: 'scaleY(-1)' }} // 뒤집어서 선 아래에 매달린 느낌을 주거나 그냥 둘 수 있음. 여기서는 똑바로 서서 선 아래를 달리는 느낌으로 (scaleY 제거 가능)
                >
                  <path 
                    d="M10,45 Q20,35 40,40 T70,40 Q85,45 90,35 L95,25 Q100,10 85,15 Q80,20 75,25 L65,20 Q55,15 45,20 Q35,25 25,25 L15,30 L10,40 Z" 
                    fill="currentColor" 
                  />
                  <circle cx="85" cy="22" r="1.5" fill="white" />
                  <circle cx="92" cy="22" r="1.5" fill="white" />
                  <path d="M82,18 L88,5 L94,18" fill="currentColor" />
                  <path d="M75,22 L81,10 L87,22" fill="currentColor" />
                  <path d="M10,45 Q-5,40 2,25 Q5,15 15,20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* 캘린더 */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl mb-6">
              {new Date().getFullYear()}년 {selectedMonth}월
            </h2>
            
            <div className="grid grid-cols-7 text-center mb-2 text-muted-foreground">
              <div>일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div>토</div>
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-muted">
              {getCalendarDays(selectedMonth).map((day, index) => (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square bg-card flex flex-col items-center justify-center cursor-pointer
                    hover:bg-accent transition-colors relative group
                    ${!day.isCurrentMonth ? 'text-muted-foreground' : ''}
                  `}
                >
                  <span>{day.date}</span>
                  {day.isCurrentMonth && isCompleted(day.date) && (
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-1" />
                  )}
                  {day.isCurrentMonth && !isCompleted(day.date) && (
                    <span className="w-2 h-2 bg-primary rounded-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
