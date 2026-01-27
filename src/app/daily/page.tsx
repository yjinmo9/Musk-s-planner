'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Check, Settings, ChevronLeft, Calendar as CalendarIcon, ClipboardCheck, LayoutDashboard, BarChart3, GripVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

const COLORS: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899'
}

interface TimeBlock {
  id: string
  hour: number
  startMinute: number // in minutes from start of hour
  duration: number // in minutes
  content: string
  color: string
}

interface MainTask {
  text: string
  completed: boolean
}

interface PlannerData {
  mainThings: MainTask[]
  brainDump: string
  timeBlocks: TimeBlock[]
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
    mainThings: [
      { text: '엔진 제원 확정', completed: true },
      { text: '궤도 파편 보고서 검토', completed: false },
      { text: '투자자 동기화 회의', completed: false },
      { text: '팀 스탠드업 미팅', completed: false }
    ],
    brainDump: '',
    timeBlocks: [],
    completed: false
  })

  // --- Settings & Grid Configuration ---
  const [quantum, setQuantum] = useState(10)
  const [hours, setHours] = useState([
    7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    0, 1, 2, 3, 4, 5, 6
  ])

  useEffect(() => {
    const targetDate = dateParam || new Date().toISOString().split('T')[0];
    const savedV2 = localStorage.getItem('musk-settings-v2');
    
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        const history = parsed.history || [];
        const effectiveSetting = history.find((h: any) => h.date <= targetDate);
        
        if (effectiveSetting) {
          const q = parseInt(effectiveSetting.timeQuantum);
          if (!isNaN(q)) setQuantum(q);
          
          const start = parseInt(effectiveSetting.dayStart.split(':')[0]);
          const end = parseInt(effectiveSetting.dayEnd.split(':')[0]);
          const h = [];
          let curr = start;
          while (curr !== end) {
            h.push(curr);
            curr = (curr + 1) % 24;
          }
          h.push(end);
          setHours(h);
        }
      } catch (e) {}
    }
  }, [dateParam]);

  const SLOTS_PER_HOUR = 60 / quantum
  const SLOT_HEIGHT = 144 / SLOTS_PER_HOUR

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartAbs, setDragStartAbs] = useState<number | null>(null)
  const [dragEndAbs, setDragEndAbs] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  
  const handleBlockReorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return
    setPlannerData(prev => {
      const sourceIndex = prev.timeBlocks.findIndex(b => b.id === sourceId)
      const targetIndex = prev.timeBlocks.findIndex(b => b.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return prev
      const newBlocks = [...prev.timeBlocks]
      const [movedBlock] = newBlocks.splice(sourceIndex, 1)
      newBlocks.splice(targetIndex, 0, movedBlock)
      return { ...prev, timeBlocks: newBlocks }
    })
    setTimeout(saveData, 100)
  }

  const fetchData = useCallback(async () => {
    if (!dateParam) return
    if (user) {
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
          mainThings: dailyPlan.main_things || prev.mainThings,
          brainDump: dailyPlan.brain_dump || '',
          completed: dailyPlan.completed || false
        }))

        const { data: timeBlocks } = await supabase
          .from('time_blocks')
          .select('*')
          .eq('daily_plan_id', dailyPlan.id)

        if (timeBlocks) {
          const blockMap = new Map<string, { hour: number; slots: Set<number>; content: string; color: string }>()
          timeBlocks.forEach(block => {
            const key = `${block.hour}-${block.content}-${block.color}`
            if (!blockMap.has(key)) {
              blockMap.set(key, {
                hour: block.hour,
                slots: new Set([block.segment]),
                content: block.content || '',
                color: block.color || 'blue'
              })
            } else {
              blockMap.get(key)!.slots.add(block.segment)
            }
          })

          const newTimeBlocks: TimeBlock[] = Array.from(blockMap.values()).map((block, index) => {
            const sortedSlots = Array.from(block.slots).sort((a, b) => a - b)
            return {
              id: `block-${index}-${block.hour}`,
              hour: block.hour,
              startMinute: sortedSlots[0] * 10,
              duration: sortedSlots.length * 10,
              content: block.content,
              color: block.color
            }
          })
          setPlannerData(prev => ({ ...prev, timeBlocks: newTimeBlocks }))
        }
      }
    } else {
      const savedData = localStorage.getItem(`guest_planner_${dateParam}`)
      if (savedData) setPlannerData(JSON.parse(savedData))
    }
  }, [user, dateParam, supabase])

  useEffect(() => {
    if (!authLoading) fetchData()
  }, [authLoading, fetchData])

  const saveData = async () => {
    if (!dateParam) return
    if (user) {
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
        await supabase.from('time_blocks').delete().eq('daily_plan_id', planId)
        const timeBlocksToUpsert = plannerData.timeBlocks.flatMap(block => {
          const segments = []
          const segmentsCount = block.duration / 10
          for (let i = 0; i < segmentsCount; i++) {
            const currentAbsSlot = (hours.indexOf(block.hour) * 6) + (block.startMinute / 10) + i
            const hIdx = Math.floor(currentAbsSlot / 6)
            const segment = currentAbsSlot % 6
            if (hIdx < hours.length) {
              segments.push({
                daily_plan_id: planId,
                hour: hours[hIdx],
                segment,
                color: block.color,
                content: block.content
              })
            }
          }
          return segments
        })
        if (timeBlocksToUpsert.length > 0) {
          await supabase.from('time_blocks').insert(timeBlocksToUpsert)
        }
      }
    } else {
      localStorage.setItem(`guest_planner_${dateParam}`, JSON.stringify(plannerData))
    }
  }

  const toggleMainTask = (index: number) => {
    setPlannerData(prev => ({
      ...prev,
      mainThings: prev.mainThings.map((task, i) => i === index ? { ...task, completed: !task.completed } : task)
    }))
    setTimeout(saveData, 100)
  }

  const updateMainTaskText = (index: number, text: string) => {
    setPlannerData(prev => ({
      ...prev,
      mainThings: prev.mainThings.map((task, i) => i === index ? { ...task, text } : task)
    }))
  }

  const addMainTask = () => {
    setPlannerData(prev => ({
      ...prev,
      mainThings: [...prev.mainThings, { text: '', completed: false }]
    }))
  }

  const toggleComplete = () => {
    setPlannerData(prev => ({ ...prev, completed: !prev.completed }))
    setTimeout(saveData, 100)
  }

  const getAbsSlot = (hour: number, slot: number) => {
    const hourIndex = hours.indexOf(hour)
    return hourIndex * SLOTS_PER_HOUR + slot
  }

  const handleMouseDown = (e: React.MouseEvent, hour: number, slot: number) => {
    e.preventDefault()
    if (e.button === 2) return // Handled via separate logic or not at all on start

    const absSlot = getAbsSlot(hour, slot)
    const clickedBlock = plannerData.timeBlocks.find(block => {
      const bStart = getAbsSlot(block.hour, block.startMinute / quantum)
      const bDur = block.duration / quantum
      return absSlot >= bStart && absSlot < bStart + bDur
    })

    if (clickedBlock) {
      setEditingBlock(clickedBlock)
      setInputValue(clickedBlock.content)
      setShowInput(true)
    } else {
      setIsDragging(true)
      setDragStartAbs(absSlot)
      setDragEndAbs(absSlot)
    }
  }

  const deleteBlock = (id: string) => {
    setPlannerData(prev => ({ ...prev, timeBlocks: prev.timeBlocks.filter(b => b.id !== id) }))
    setTimeout(saveData, 100)
  }

  const handleMouseEnter = (hour: number, slot: number) => {
    if (!isDragging || dragStartAbs === null) return
    setDragEndAbs(getAbsSlot(hour, slot))
  }

  const handleMouseUp = () => {
    if (!isDragging || dragStartAbs === null || dragEndAbs === null) {
      setIsDragging(false)
      return
    }
    const start = Math.min(dragStartAbs, dragEndAbs)
    const end = Math.max(dragStartAbs, dragEndAbs)
    const hasConflict = plannerData.timeBlocks.some(block => {
      const bStart = getAbsSlot(block.hour, block.startMinute / quantum)
      const bEnd = bStart + (block.duration / quantum) - 1
      return !(end < bStart || start > bEnd)
    })
    if (hasConflict) {
      alert('시간대가 겹칩니다.')
      setIsDragging(false)
      setDragStartAbs(null)
      setDragEndAbs(null)
      return
    }
    setShowInput(true)
    setIsDragging(false)
  }

  const handleInputSubmit = () => {
    if (!inputValue.trim()) {
      setShowInput(false); setInputValue(''); setDragStartAbs(null); setDragEndAbs(null); setEditingBlock(null);
      return
    }
    if (editingBlock) {
      setPlannerData(prev => ({
        ...prev,
        timeBlocks: prev.timeBlocks.map(b => b.id === editingBlock.id ? { ...b, content: inputValue.trim() } : b)
      }))
    } else if (dragStartAbs !== null && dragEndAbs !== null) {
      const start = Math.min(dragStartAbs, dragEndAbs)
      const end = Math.max(dragStartAbs, dragEndAbs)
      const duration = (end - start + 1) * quantum
      const hIdx = Math.floor(start / SLOTS_PER_HOUR)
      const slot = start % SLOTS_PER_HOUR
      const newBlock: TimeBlock = {
        id: `block-${Date.now()}`,
        hour: hours[hIdx],
        startMinute: slot * quantum,
        duration,
        content: inputValue.trim(),
        color: selectedColor
      }
      setPlannerData(prev => ({ ...prev, timeBlocks: [...prev.timeBlocks, newBlock] }))
    }
    setShowInput(false); setInputValue(''); setDragStartAbs(null); setDragEndAbs(null); setEditingBlock(null);
    setTimeout(saveData, 100)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8] p-4 md:p-8" onContextMenu={(e) => e.preventDefault()} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 hidden items-end justify-between lg:flex">
          <div>
            <h1 className="text-[32px] font-black italic tracking-tighter uppercase leading-none">MISSION: DAILY LAUNCH</h1>
            <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-widest">
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MISSION READINESS</p>
                <p className="text-2xl font-black italic">80%</p>
             </div>
             <div className="h-10 w-[2px] bg-black/10"></div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CURRENT PHASE</p>
                <p className="text-2xl font-black italic uppercase">EXECUTION</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Tasks */}
          <div className="space-y-6 lg:col-span-3">
             <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">주요 과업 (MAIN THINGS)</h3>
                  <button onClick={addMainTask} className="border-2 border-black p-1 hover:bg-black hover:text-white transition-all">
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </button>
                </div>
                <div className="space-y-3">
                  {plannerData.mainThings.map((task, index) => (
                    <div key={index} className="group flex items-center gap-3">
                      <button 
                        onClick={() => toggleMainTask(index)}
                        className={`flex size-6 shrink-0 items-center justify-center border-2 border-black transition-all ${task.completed ? 'bg-black text-white' : 'bg-white'}`}
                      >
                        {task.completed && <Check className="w-4 h-4 stroke-[4px]" />}
                      </button>
                      <input 
                         className={`flex-1 bg-transparent text-[13px] font-bold outline-none uppercase ${task.completed ? 'line-through text-gray-400' : 'text-black'}`}
                         value={task.text}
                         onChange={(e) => updateMainTaskText(index, e.target.value)}
                         onBlur={saveData}
                      />
                    </div>
                  ))}
                </div>
             </div>

             <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="mb-4 text-sm font-black uppercase italic tracking-tighter">브레인 덤프 (BRAIN DUMP)</h3>
                <textarea 
                  className="h-48 w-full resize-none bg-gray-50 p-4 text-[13px] font-medium leading-relaxed outline-none border-2 border-transparent focus:border-black transition-all"
                  value={plannerData.brainDump}
                  onChange={(e) => setPlannerData(prev => ({ ...prev, brainDump: e.target.value }))}
                  onBlur={saveData}
                  placeholder="모든 생각을 쏟아내세요..."
                />
             </div>
          </div>

          {/* Center Column: Time Plan */}
          <div className="lg:col-span-6">
            <div className="relative border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[75vh]">
              <div className="border-b-4 border-black p-4 flex items-center justify-between bg-white shrink-0">
                 <h2 className="text-lg font-black italic tracking-tighter uppercase">타임 플랜 (PLAN)</h2>
                 <div className="flex gap-1">
                    {Object.entries(COLORS).map(([name, code]) => (
                      <button
                        key={name}
                        onClick={() => setSelectedColor(name)}
                        className={`size-4 border-2 border-black transition-transform ${selectedColor === name ? 'scale-125 z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'opacity-40 hover:opacity-100'}`}
                        style={{ backgroundColor: code }}
                      />
                    ))}
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
                <div className="relative w-full">
                  {hours.map((hour) => (
                    <div key={hour} className="flex border-b-2 border-black/5 last:border-b-0 min-h-[144px]">
                      <div className="w-16 shrink-0 flex flex-col items-center justify-start pt-2 border-r-2 border-black/10 bg-gray-50">
                        <span className="text-[14px] font-black italic text-black/40">{String(hour).padStart(2, '0')}</span>
                      </div>
                      <div className="flex-1 relative">
                        <div className="absolute inset-0 grid" style={{ gridTemplateRows: `repeat(${SLOTS_PER_HOUR}, 1fr)` }}>
                          {Array.from({ length: SLOTS_PER_HOUR }).map((_, slot) => (
                            <div
                              key={slot}
                              className="border-b border-black/5 last:border-b-0 cursor-pointer hover:bg-black/[0.02]"
                              onMouseDown={(e) => handleMouseDown(e, hour, slot)}
                              onMouseEnter={() => handleMouseEnter(hour, slot)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {plannerData.timeBlocks.map((block) => {
                    const hIdx = hours.indexOf(block.hour)
                    if (hIdx === -1) return null
                    const top = hIdx * 144 + (block.startMinute / quantum) * SLOT_HEIGHT
                    const height = (block.duration / quantum) * SLOT_HEIGHT
                    return (
                      <div
                        key={block.id}
                        className="absolute left-16 right-0 border-2 border-black p-3 transition-all hover:brightness-95 group cursor-move shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                        style={{ 
                          top: `${top}px`, height: `${height}px`,
                          backgroundColor: COLORS[block.color as keyof typeof COLORS] || COLORS.blue,
                          color: 'white', zIndex: isDragging ? 0 : 10
                        }}
                        onMouseDown={(e) => {
                          if (isDragging) return
                          if (e.button === 2) { e.stopPropagation(); deleteBlock(block.id); }
                        }}
                      >
                        <div className="flex h-full flex-col justify-between">
                          <p className="text-[12px] font-black uppercase leading-tight line-clamp-3">{block.content}</p>
                          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black bg-black/20 px-1">{block.duration} MIN</span>
                            <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="text-white hover:text-black">
                               <Plus className="w-3 h-3 rotate-45 stroke-[4px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {isDragging && dragStartAbs !== null && dragEndAbs !== null && (
                    <div 
                      className="absolute left-16 right-0 border-4 border-dashed border-black bg-black/10 z-0"
                      style={{
                        top: `${Math.min(dragStartAbs, dragEndAbs) * SLOT_HEIGHT}px`,
                        height: `${(Math.abs(dragEndAbs - dragStartAbs) + 1) * SLOT_HEIGHT}px`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className="hidden space-y-6 lg:block lg:col-span-3">
             <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">LAUNCH READINESS</h3>
                  <span className="bg-black text-white px-2 py-0.5 text-[9px] font-black italic">ACTIVE</span>
                </div>
                <div className="flex flex-col items-center gap-6">
                   <div className="relative size-32 border-8 border-black flex items-center justify-center">
                      <span className="text-[32px] font-black italic">80%</span>
                      <div className="absolute -bottom-4 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black">4/5 TASKS</div>
                   </div>
                   <button 
                    onClick={toggleComplete}
                    className={`h-16 w-full text-[13px] font-black uppercase italic tracking-[0.2em] transition-all border-4 border-black ${plannerData.completed ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-4px] translate-y-[-4px] hover:translate-x-0 hover:translate-y-0'}`}
                  >
                    {plannerData.completed ? 'MISSION COMPLETED' : 'COMPLETE MISSION'}
                  </button>
                </div>
             </div>

             <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">MISSION STREAK</h3>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[44px] font-black italic leading-none">12</span>
                   <div>
                      <p className="text-[11px] font-black uppercase leading-tight">ACTIVE DAYS</p>
                      <p className="mt-1 text-[10px] font-bold text-green-600 uppercase">SYSTEM STABLE</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {showInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[400px] border-4 border-black bg-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-6 text-[24px] font-black italic tracking-tighter uppercase">미션 상세 설정</h3>
            <div className="space-y-4">
               <textarea
                 autoFocus
                 className="w-full h-32 resize-none border-4 border-black bg-gray-50 p-4 text-sm font-bold uppercase outline-none focus:bg-white transition-colors"
                 placeholder="어떤 미션을 수행하시겠습니까?"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault()
                     handleInputSubmit()
                   }
                 }}
               />
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setShowInput(false); setDragStartAbs(null); setDragEndAbs(null); setEditingBlock(null); }}
                    className="h-14 border-2 border-black text-[11px] font-black uppercase tracking-widest hover:bg-gray-100"
                  >
                    중단 (ABORT)
                  </button>
                  <button 
                    onClick={handleInputSubmit}
                    className="h-14 bg-black text-[11px] font-black text-white uppercase tracking-widest hover:bg-gray-800"
                  >
                    확정 (CONFIRM)
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Daily() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    }>
      <DailyContent />
    </Suspense>
  )
}
