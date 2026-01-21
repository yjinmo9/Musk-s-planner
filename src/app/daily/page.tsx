'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'


export const dynamic = 'force-dynamic'

const COLORS: Record<string, string> = {
  blue: '#4A90E2',
  green: '#50C878',
  yellow: '#FFD700',
  purple: '#9370DB',
  pink: '#FF69B4'
}

interface TimeSegment {
  content: string
  color: string | null
}

interface PlannerData {
  mainThings: string[]
  brainDump: string
  timeBlocks: { segments: TimeSegment[] }[]
  completed: boolean
}

function DailyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const dateParam = searchParams.get('date') || ''
  const [currentDate] = useState(() => dateParam ? new Date(dateParam) : new Date())
  const [selectedColor, setSelectedColor] = useState('blue')
  const [dailyPlanId, setDailyPlanId] = useState<string | null>(null)

  const [plannerData, setPlannerData] = useState<PlannerData>({
    mainThings: ['', '', '', '', ''],
    brainDump: '',
    timeBlocks: Array(21).fill(null).map(() => ({
      segments: Array(6).fill(null).map(() => ({ content: '', color: null }))
    })),
    completed: false
  })

  // 드래그 관련 상태
  const [isColoring, setIsColoring] = useState(false)
  const [isErasing, setIsErasing] = useState(false)
  const [selectedTimeBlocks, setSelectedTimeBlocks] = useState<{ hour: number; segment: number; prevColor: string | null; prevContent: string }[]>([])

  // 모달 상태
  const [showInputModal, setShowInputModal] = useState(false)
  const [currentInput, setCurrentInput] = useState('')

  // 데이터 불러오기 - 로그인 시 Supabase, 비로그인 시 localStorage
  const fetchData = useCallback(async () => {
    if (!dateParam) return

    if (user) {
      // Supabase에서 불러오기
      const { data: dailyPlan } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateParam)
        .single()

      if (dailyPlan) {
        setDailyPlanId(dailyPlan.id)
        setPlannerData(prev => ({
          ...prev,
          mainThings: dailyPlan.main_things || ['', '', '', '', ''],
          brainDump: dailyPlan.brain_dump || '',
          completed: dailyPlan.completed || false
        }))

        const { data: timeBlocks } = await supabase
          .from('time_blocks')
          .select('*')
          .eq('daily_plan_id', dailyPlan.id)

        if (timeBlocks) {
          const newTimeBlocks = Array(21).fill(null).map(() => ({
            segments: Array(6).fill(null).map(() => ({ content: '', color: null }))
          }))
          timeBlocks.forEach(block => {
            if (block.hour >= 4 && block.hour <= 24 && block.segment >= 0 && block.segment <= 5) {
              newTimeBlocks[block.hour - 4].segments[block.segment] = {
                content: block.content || '',
                color: block.color
              }
            }
          })
          setPlannerData(prev => ({ ...prev, timeBlocks: newTimeBlocks }))
        }
      }
    } else {
      // localStorage에서 불러오기
      const savedData = localStorage.getItem(`guest_planner_${dateParam}`)
      if (savedData) {
        setPlannerData(JSON.parse(savedData))
      }
    }
  }, [user, dateParam, supabase])

  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  }, [authLoading, fetchData])

  // 데이터 저장
  const saveData = async () => {
    if (!dateParam) return

    if (user) {
      // Supabase에 저장
      let planId = dailyPlanId

      const { data: upsertedPlan } = await supabase
        .from('daily_plans')
        .upsert({
          user_id: user.id,
          date: dateParam,
          main_things: plannerData.mainThings,
          brain_dump: plannerData.brainDump,
          completed: plannerData.completed,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,date' })
        .select()
        .single()

      if (upsertedPlan) {
        planId = upsertedPlan.id
        setDailyPlanId(planId)
      }

      if (planId) {
        const timeBlocksToUpsert = plannerData.timeBlocks.flatMap((block, hIndex) =>
          block.segments.map((seg, sIndex) => ({
            daily_plan_id: planId,
            hour: hIndex + 4,
            segment: sIndex,
            color: seg.color,
            content: seg.content
          })).filter(tb => tb.color || tb.content)
        )

        if (timeBlocksToUpsert.length > 0) {
          await supabase
            .from('time_blocks')
            .upsert(timeBlocksToUpsert, { onConflict: 'daily_plan_id,hour,segment' })
        }
      }
    } else {
      // localStorage에 저장
      localStorage.setItem(`guest_planner_${dateParam}`, JSON.stringify(plannerData))
      
      // 완료된 날짜 목록 업데이트
      const savedDates = JSON.parse(localStorage.getItem('guest_completed_dates') || '[]')
      if (plannerData.completed && !savedDates.includes(dateParam)) {
        savedDates.push(dateParam)
        localStorage.setItem('guest_completed_dates', JSON.stringify(savedDates))
      } else if (!plannerData.completed && savedDates.includes(dateParam)) {
        localStorage.setItem('guest_completed_dates', JSON.stringify(savedDates.filter((d: string) => d !== dateParam)))
      }
    }
  }

  // MAIN THINGS / BRAIN DUMP 핸들러
  const handleMainThingChange = (index: number, value: string) => {
    setPlannerData(prev => ({
      ...prev,
      mainThings: prev.mainThings.map((item, i) => i === index ? value : item)
    }))
  }

  const addMainThing = () => {
    if (plannerData.mainThings.length < 7) {
      setPlannerData(prev => ({
        ...prev,
        mainThings: [...prev.mainThings, '']
      }))
    }
  }

  const removeMainThing = (index: number) => {
    // 최소 5개는 유지하도록 설정할 수도 있지만, 일단 삭제 기능을 넣어줌
    if (plannerData.mainThings.length > 1) {
      setPlannerData(prev => {
        const newMainThings = prev.mainThings.filter((_, i) => i !== index)
        return { ...prev, mainThings: newMainThings }
      })
      // 삭제 후 자동 저장 유도 (onBlur가 안 불릴 수 있으므로)
      setTimeout(saveData, 100)
    }
  }

  const toggleComplete = () => {
    setPlannerData(prev => ({ ...prev, completed: !prev.completed }))
  }

  // 색상 적용
  const applyColor = (hour: number, segment: number, colorValue: string | null) => {
    setPlannerData(prev => ({
      ...prev,
      timeBlocks: prev.timeBlocks.map((block, hIndex) =>
        hIndex === hour - 4
          ? {
              ...block,
              segments: block.segments.map((seg, sIndex) =>
                sIndex === segment ? { ...seg, color: colorValue } : seg
              )
            }
          : block
      )
    }))
  }

  const applyContent = (hour: number, segment: number, contentValue: string) => {
    setPlannerData(prev => ({
      ...prev,
      timeBlocks: prev.timeBlocks.map((block, hIndex) =>
        hIndex === hour - 4
          ? {
              ...block,
              segments: block.segments.map((seg, sIndex) =>
                sIndex === segment ? { ...seg, content: contentValue } : seg
              )
            }
          : block
      )
    }))
  }

  // 마우스 핸들러
  const handleMouseDown = (e: React.MouseEvent, hour: number, segment: number) => {
    const isRightClick = e.button === 2
    const currentSegment = plannerData.timeBlocks[hour - 4].segments[segment]

    if (currentSegment.color || isRightClick) {
      setIsErasing(true)
      setSelectedTimeBlocks([{
        hour, segment,
        prevColor: currentSegment.color,
        prevContent: currentSegment.content
      }])
      applyColor(hour, segment, null)
    } else {
      setIsErasing(false)
      setSelectedTimeBlocks([{
        hour, segment,
        prevColor: currentSegment.color,
        prevContent: currentSegment.content
      }])
      applyColor(hour, segment, selectedColor)
    }
    setIsColoring(true)
  }

  const handleMouseEnter = (hour: number, segment: number) => {
    if (!isColoring) return
    const currentSegment = plannerData.timeBlocks[hour - 4].segments[segment]
    setSelectedTimeBlocks(prev => [...prev, {
      hour, segment,
      prevColor: currentSegment.color,
      prevContent: currentSegment.content
    }])
    applyColor(hour, segment, isErasing ? null : selectedColor)
  }

  const handleMouseUp = () => {
    if (!isColoring) return

    if (selectedTimeBlocks.length > 0) {
      if (isErasing) {
        selectedTimeBlocks.forEach(({ hour, segment }) => applyContent(hour, segment, ''))
        saveData()
      } else {
        setShowInputModal(true)
      }
    }
    setIsColoring(false)
    setIsErasing(false)
  }

  const handleInputSubmit = () => {
    if (currentInput.trim()) {
      selectedTimeBlocks.forEach(({ hour, segment }) => applyContent(hour, segment, currentInput.trim()))
    } else {
      selectedTimeBlocks.forEach(({ hour, segment, prevColor, prevContent }) => {
        applyColor(hour, segment, prevColor)
        applyContent(hour, segment, prevContent)
      })
    }
    setShowInputModal(false)
    setCurrentInput('')
    setSelectedTimeBlocks([])
    setTimeout(saveData, 100)
  }

  const handleInputCancel = () => {
    selectedTimeBlocks.forEach(({ hour, segment, prevColor, prevContent }) => {
      applyColor(hour, segment, prevColor)
      applyContent(hour, segment, prevContent)
    })
    setShowInputModal(false)
    setCurrentInput('')
    setSelectedTimeBlocks([])
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen p-8 bg-card max-w-4xl mx-auto border rounded-lg shadow-sm"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 헤더 */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            ← 홈
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            대시보드
          </Button>
        </div>
        
        {!user && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4 text-center">
            ⚠️ 게스트 모드입니다. 로그인하면 데이터가 계정에 저장됩니다.
          </div>
        )}
        
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-4">DAILY TIME BOX PLANNER</h1>
          <div className="inline-flex flex-col items-center gap-2">
            <div className="text-sm text-muted-foreground">DATE</div>
            <div className="text-lg">
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Checkbox 
              checked={plannerData.completed} 
              onCheckedChange={toggleComplete}
              id="complete-check"
            />
            <label htmlFor="complete-check" className="text-sm cursor-pointer">
              이 날짜를 완료로 표시하기
            </label>
          </div>
        </div>
      </header>

      <div className="flex gap-8">
        {/* 왼쪽: MAIN THINGS & BRAIN DUMP */}
        <div className="w-2/5 flex flex-col gap-8">
          <section className="bg-card p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">MAIN THINGS</h2>
              {plannerData.mainThings.length < 7 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={addMainThing}
                  className="h-8 w-8 p-0 rounded-full hover:bg-accent"
                  title="항목 추가 (최대 7개)"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-6">
              {plannerData.mainThings.map((thing, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  <Checkbox />
                  <textarea
                    value={thing}
                    onChange={(e) => {
                      handleMainThingChange(index, e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onBlur={saveData}
                    rows={1}
                    placeholder="주요 할 일을 입력하세요"
                    className="border-0 border-b rounded-none focus-visible:outline-none px-0 flex-1 resize-none overflow-hidden bg-transparent py-1 min-h-[2rem]"
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                  />
                  {plannerData.mainThings.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMainThing(index)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="flex-1 p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">BRAIN DUMP</h2>
            <Textarea
              value={plannerData.brainDump}
              onChange={(e) => setPlannerData(prev => ({ ...prev, brainDump: e.target.value }))}
              onBlur={saveData}
              placeholder="자유롭게 기록하세요..."
              className="min-h-[400px] resize-none border-0"
            />
          </section>
        </div>

        {/* 오른쪽: COLOR PICKER & TIME PLAN */}
        <div className="w-3/5 relative">
          <div className="absolute top-0 right-0 flex gap-2 p-4">
            {Object.entries(COLORS).map(([name, color]) => (
              <button
                key={name}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${selectedColor === name ? 'ring-2 ring-black ring-offset-2' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(name)}
              />
            ))}
          </div>

          <section className="bg-card p-6 rounded-lg mt-12">
            <h2 className="text-lg font-semibold mb-4">TIME PLAN</h2>
            <div className="grid grid-cols-7 text-xs text-muted-foreground mb-2" style={{ gridTemplateColumns: '40px repeat(6, 1fr)' }}>
              <div></div>
              <div className="text-right pr-1">00</div>
              <div className="text-right pr-1">10</div>
              <div className="text-right pr-1">20</div>
              <div className="text-right pr-1">30</div>
              <div className="text-right pr-1">40</div>
              <div className="text-right pr-1">50</div>
            </div>
            
            <div className="border rounded" onMouseUp={handleMouseUp}>
              {Array.from({ length: 21 }, (_, i) => i + 4).map((hour) => (
                <div 
                  key={hour} 
                  className="grid border-b last:border-b-0"
                  style={{ gridTemplateColumns: '40px repeat(6, 1fr)', height: '40px' }}
                >
                  <div className="flex items-center justify-center text-sm text-muted-foreground border-r">
                    {hour}
                  </div>
                  {plannerData.timeBlocks[hour - 4].segments.map((segment, index) => (
                    <div
                      key={index}
                      className="border-r last:border-r-0 cursor-pointer hover:bg-accent/50 transition-colors relative group select-none"
                      style={{ backgroundColor: segment.color ? COLORS[segment.color] : 'transparent' }}
                      onMouseDown={(e) => handleMouseDown(e, hour, index)}
                      onMouseEnter={() => handleMouseEnter(hour, index)}
                    >
                      {segment.content && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                          {segment.content}
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black/90" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 입력 모달 */}
      <Dialog open={showInputModal} onOpenChange={setShowInputModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일정 입력</DialogTitle>
          </DialogHeader>
          <Input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="일정을 입력하세요"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleInputCancel}>취소</Button>
            <Button onClick={handleInputSubmit}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Daily() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <DailyContent />
    </Suspense>
  )
}
