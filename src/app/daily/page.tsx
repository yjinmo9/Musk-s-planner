'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Settings, ChevronLeft, Calendar as CalendarIcon, ClipboardCheck, LayoutDashboard, BarChart3, GripVertical } from 'lucide-react'
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
  startMinute: number // 0-50 (0, 10, 20, 30, 40, 50)
  duration: number // in 10-minute units (1-6)
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
      { text: 'Finalize engine specs', completed: true },
      { text: 'Orbital debris report', completed: false },
      { text: 'Investor sync', completed: false },
      { text: 'Team standup', completed: false }
    ],
    brainDump: 'Review thermal tile placement on Starship S24. Coordinate with Propulsion team on Raptor 3 test firing scheduled for Friday. Need to call Kimbal about the board dinner. Buy more notebooks.',
    timeBlocks: [],
    completed: false
  })

  // 드래그 관련 상태 (절대 슬롯 인덱스 사용: 0 ~ hours.length * 6 - 1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartAbs, setDragStartAbs] = useState<number | null>(null)
  const [dragEndAbs, setDragEndAbs] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  
  // Tasks View DnD State
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [timeEditingId, setTimeEditingId] = useState<string | null>(null)

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

  const handleTimeChange = (blockId: string, newTimeStr: string) => {
    // Expected format: "HH:mm"
    const [hStr, mStr] = newTimeStr.split(':')
    const newHour = parseInt(hStr, 10)
    const newMinute = parseInt(mStr, 10)

    if (isNaN(newHour) || isNaN(newMinute)) return

    // Convert minute to nearest 10-min slot (0, 10, 20, 30, 40, 50)
    const newStartMinute = Math.floor(newMinute / 10) * 10
    
    // Check for validation
    // 1. Valid range (standard logic, assuming 24h format for simplicity)
    if (newHour < 0 || newHour > 23 || newStartMinute < 0 || newStartMinute > 50) return

    setPlannerData(prev => {
      const block = prev.timeBlocks.find(b => b.id === blockId)
      if (!block) return prev

      // Check for overlap with OTHER blocks
      const newStartAbs = getAbsSlot(newHour, newStartMinute / 10)
      
      // If the new time is outside our visible grid range (07:00 - next day 06:00)
      // We need to map 24h hours to our grid "hours" array indices
      // hours array: 7, 8, ..., 23, 0, 1, ..., 6
      
      // Check if this new hour exists in our grid
      if (!hours.includes(newHour)) {
        alert("Time is outside of the planner's range (07:00 - 06:59)")
        return prev
      }

      // Check overlap
      const hasConflict = prev.timeBlocks.some(other => {
        if (other.id === blockId) return false
        const otherStartAbs = getAbsSlot(other.hour, other.startMinute / 10)
        
        // Simple 1D overlap check
        // We use absolute slots for comparison
        const thisStart = newStartAbs
        const thisEnd = newStartAbs + block.duration - 1
        const otherStart = otherStartAbs
        const otherEnd = otherStartAbs + other.duration - 1

        return !(thisEnd < otherStart || thisStart > otherEnd)
      })

      if (hasConflict) {
        alert('This time slot overlaps with another task!')
        return prev
      }

      const updatedBlocks = prev.timeBlocks.map(b => 
        b.id === blockId 
          ? { ...b, hour: newHour, startMinute: newStartMinute }
          : b
      )
      
      return { ...prev, timeBlocks: updatedBlocks }
    })
    setTimeEditingId(null)
    setTimeout(saveData, 100)
  }

  // 데이터 불러오기
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
          // Convert old format to new format
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
              duration: sortedSlots.length,
              content: block.content,
              color: block.color
            }
          })

          setPlannerData(prev => ({ ...prev, timeBlocks: newTimeBlocks }))
        }
      }
    } else {
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
        // Delete all existing time blocks for this plan
        await supabase
          .from('time_blocks')
          .delete()
          .eq('daily_plan_id', planId)

        // Insert new time blocks (expand each block into individual segments)
        const timeBlocksToUpsert = plannerData.timeBlocks.flatMap(block => {
          const segments = []
          const startingAbsSlot = hours.indexOf(block.hour) * 6 + (block.startMinute / 10)
          
          for (let i = 0; i < block.duration; i++) {
            const currentAbsSlot = startingAbsSlot + i
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
          await supabase
            .from('time_blocks')
            .insert(timeBlocksToUpsert)
        }
      }
    } else {
      localStorage.setItem(`guest_planner_${dateParam}`, JSON.stringify(plannerData))
    }
  }

  const toggleMainTask = (index: number) => {
    setPlannerData(prev => ({
      ...prev,
      mainThings: prev.mainThings.map((task, i) => 
        i === index ? { ...task, completed: !task.completed } : task
      )
    }))
    setTimeout(saveData, 100)
  }

  const updateMainTaskText = (index: number, text: string) => {
    setPlannerData(prev => ({
      ...prev,
      mainThings: prev.mainThings.map((task, i) => 
        i === index ? { ...task, text } : task
      )
    }))
  }

  const toggleComplete = () => {
    setPlannerData(prev => ({ ...prev, completed: !prev.completed }))
    setTimeout(saveData, 100)
  }

  // Helper: Get total minutes from hour and slot
  const getTotalMinutes = (hour: number, slot: number) => hour * 60 + slot * 10

  // Helper: Check if a time range overlaps with existing blocks
  const hasOverlap = (hour: number, startSlot: number, endSlot: number, excludeId?: string) => {
    const startMinutes = getTotalMinutes(hour, startSlot)
    const endMinutes = getTotalMinutes(hour, endSlot + 1)

    return plannerData.timeBlocks.some(block => {
      if (excludeId && block.id === excludeId) return false
      
      const blockStartMinutes = getTotalMinutes(block.hour, block.startMinute / 10)
      const blockEndMinutes = blockStartMinutes + (block.duration * 10)

      return !(endMinutes <= blockStartMinutes || startMinutes >= blockEndMinutes)
    })
  }

  // Helper: Get absolute slot index
  const getAbsSlot = (hour: number, slot: number) => {
    const hourIndex = hours.indexOf(hour)
    return hourIndex * 6 + slot
  }

  // 마우스 핸들러
  const handleMouseDown = (e: React.MouseEvent, hour: number, slot: number) => {
    e.preventDefault()
    const isRightClick = e.button === 2
    const absSlot = getAbsSlot(hour, slot)

    // Check if clicking on existing block
    const clickedBlock = plannerData.timeBlocks.find(block => {
      const blockStartAbs = getAbsSlot(block.hour, block.startMinute / 10)
      return absSlot >= blockStartAbs && absSlot < blockStartAbs + block.duration
    })

    if (clickedBlock) {
      if (isRightClick) {
        setPlannerData(prev => ({
          ...prev,
          timeBlocks: prev.timeBlocks.filter(b => b.id !== clickedBlock.id)
        }))
        setTimeout(saveData, 100)
      } else {
        setEditingBlock(clickedBlock)
        setInputValue(clickedBlock.content)
        setShowInput(true)
      }
    } else if (!isRightClick) {
      setIsDragging(true)
      setDragStartAbs(absSlot)
      setDragEndAbs(absSlot)
    }
  }

  const deleteBlock = (id: string) => {
    setPlannerData(prev => ({
      ...prev,
      timeBlocks: prev.timeBlocks.filter(b => b.id !== id)
    }))
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
    const duration = end - start + 1

    // Check for overlap
    const hasOverlapAbs = plannerData.timeBlocks.some(block => {
      const bStart = getAbsSlot(block.hour, block.startMinute / 10)
      const bEnd = bStart + block.duration - 1
      return !(end < bStart || start > bEnd)
    })

    if (hasOverlapAbs) {
      alert('This time slot overlaps with an existing event!')
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
      setShowInput(false)
      setInputValue('')
      setDragStartAbs(null)
      setDragEndAbs(null)
      setEditingBlock(null)
      return
    }

    if (editingBlock) {
      setPlannerData(prev => ({
        ...prev,
        timeBlocks: prev.timeBlocks.map(block =>
          block.id === editingBlock.id ? { ...block, content: inputValue.trim() } : block
        )
      }))
    } else if (dragStartAbs !== null && dragEndAbs !== null) {
      const start = Math.min(dragStartAbs, dragEndAbs)
      const end = Math.max(dragStartAbs, dragEndAbs)
      const duration = end - start + 1
      const hIdx = Math.floor(start / 6)
      const slot = start % 6

      const newBlock: TimeBlock = {
        id: `block-${Date.now()}`,
        hour: hours[hIdx],
        startMinute: slot * 10,
        duration,
        content: inputValue.trim(),
        color: selectedColor
      }

      setPlannerData(prev => ({
        ...prev,
        timeBlocks: [...prev.timeBlocks, newBlock]
      }))
    }

    setShowInput(false)
    setInputValue('')
    setDragStartAbs(null)
    setDragEndAbs(null)
    setEditingBlock(null)
    setTimeout(saveData, 100)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  const hours = [
    7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    0, 1, 2, 3, 4, 5, 6
  ]

  return (
    <div 
      className="relative flex h-screen w-full flex-col overflow-hidden max-w-[430px] mx-auto bg-white border-x-2 border-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <header className="flex items-center bg-white p-4 pb-2 justify-between border-b-2 border-black sticky top-0 z-50">
        <div className="flex size-10 shrink-0 items-center justify-center border-2 border-black">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex flex-col items-center flex-1">
          <h2 className="text-black text-lg font-black leading-tight tracking-tighter uppercase">
            {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <p className="text-black text-[10px] font-bold uppercase tracking-widest opacity-60">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
        </div>
        <div className="flex w-10 items-center justify-end">
          <button onClick={() => router.push('/')} className="flex size-10 items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Complete Toggle */}
      <div className="px-4 py-3 bg-white border-b-2 border-black">
        <div className="flex items-center justify-between gap-4 p-3 border-2 border-black">
          <div className="flex flex-col">
            <p className="text-black text-xs font-black uppercase leading-tight">Mark Day as Complete</p>
            <p className="text-black/60 text-[10px] font-medium leading-normal">Finalize all time boxes</p>
          </div>
          <label className="relative flex h-[24px] w-[44px] cursor-pointer items-center rounded-none border-2 border-black bg-white p-0.5 transition-colors">
            <input 
              className="sr-only peer" 
              type="checkbox"
              checked={plannerData.completed}
              onChange={toggleComplete}
            />
            <div className="h-full w-[18px] bg-black transition-transform transform translate-x-0 peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Main Things & Brain Dump */}
        <div className="w-[42%] flex flex-col border-r-2 border-black overflow-y-auto hide-scrollbar bg-white">
          <section className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-black text-xs font-black leading-tight tracking-tight uppercase">Main Things</h3>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="space-y-0">
              {plannerData.mainThings.map((task, index) => (
                <label key={index} className="flex items-start gap-x-2 py-2 border-b border-black/10 last:border-0 cursor-pointer">
                  <input 
                    checked={task.completed}
                    onChange={() => toggleMainTask(index)}
                    className="mt-0.5 h-3.5 w-3.5 text-black focus:ring-0 rounded-sm border-black" 
                    type="checkbox"
                  />
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) => updateMainTaskText(index, e.target.value)}
                    onBlur={saveData}
                    className={`text-black text-[11px] font-bold leading-tight bg-transparent border-none focus:outline-none flex-1 ${task.completed ? 'line-through opacity-30' : ''}`}
                    placeholder="Enter task..."
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="flex-1 p-3 border-t-2 border-black bg-white">
            <h3 className="text-black text-xs font-black leading-tight tracking-tight mb-2 uppercase">Brain Dump</h3>
            <textarea 
              value={plannerData.brainDump}
              onChange={(e) => setPlannerData(prev => ({ ...prev, brainDump: e.target.value }))}
              onBlur={saveData}
              className="w-full h-full bg-transparent border-none p-0 focus:ring-0 text-[11px] text-black/80 placeholder-black/30 resize-none leading-relaxed font-medium" 
              placeholder="Start typing thoughts..."
            />
          </section>
        </div>

        {/* Right Side - Time Plan */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div className="flex items-center border-b-2 border-black h-10 px-2 justify-between">
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-black text-xs font-black uppercase hover:bg-black/5 px-2 py-1 rounded transition-colors group flex items-center gap-1">
                  Time Plan
                  <Settings className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 bg-white rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <DialogHeader className="p-6 pb-2 border-b-2 border-black/5">
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">Today's Flow</DialogTitle>
                  <DialogDescription className="text-xs font-medium text-gray-500">
                    Drag and drop to reschedule your tasks.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {plannerData.timeBlocks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <CalendarIcon className="w-8 h-8 opacity-20" />
                        <span className="text-xs font-medium">No tasks scheduled yet</span>
                      </div>
                    ) : (
                      plannerData.timeBlocks
                        .map((block) => (
                          <div
                            key={block.id}
                            draggable
                            onDragStart={(e) => setDraggedBlockId(block.id)}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (draggedBlockId) {
                                handleBlockReorder(draggedBlockId, block.id)
                                setDraggedBlockId(null)
                              }
                            }}
                            className="transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Card className="border-0 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                              <CardContent className="p-0 flex items-stretch">
                                {/* Color Strip */}
                                <div 
                                  className="w-1.5 shrink-0" 
                                  style={{ backgroundColor: COLORS[block.color] }} 
                                />
                                
                                <div className="flex-1 flex items-center p-3 gap-3">
                                  {/* Drag Handle */}
                                  <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-black truncate leading-tight mb-1">
                                      {block.content}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                      {/* Editable Start Time */}
                                      <div 
                                        className={`flex items-center rounded px-1.5 py-0.5 transition-colors cursor-pointer ${
                                          timeEditingId === block.id ? 'bg-gray-100' : 'hover:bg-gray-100'
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setTimeEditingId(block.id)
                                        }}
                                      >
                                        {timeEditingId === block.id ? (
                                          <input
                                            type="time"
                                            value={`${String(block.hour).padStart(2, '0')}:${String(block.startMinute).padStart(2, '0')}`}
                                            onChange={(e) => handleTimeChange(block.id, e.target.value)}
                                            onBlur={() => setTimeEditingId(null)}
                                            onKeyDown={(e) => e.key === 'Enter' && setTimeEditingId(null)}
                                            autoFocus
                                            className="bg-transparent border-none p-0 w-[54px] text-[10px] font-bold text-black focus:ring-0 focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <span className="text-gray-500 font-bold min-w-[32px] text-center">
                                            {String(block.hour).padStart(2, '0')}:{String(block.startMinute).padStart(2, '0')}
                                          </span>
                                        )}
                                      </div>
                                      
                                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                                      <span>
                                        {block.duration * 10} MIN
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Delete Action (Optional, for quick cleanup) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPlannerData(prev => ({
                                        ...prev,
                                        timeBlocks: prev.timeBlocks.filter(b => b.id !== block.id)
                                      }))
                                      setTimeout(saveData, 100)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-all"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                      ))
                    )}
                </div>
              </DialogContent>
            </Dialog>
            <div className="flex gap-1">
              {Object.entries(COLORS).map(([name, color]) => (
                <button
                  key={name}
                  onClick={() => setSelectedColor(name)}
                  className={`size-3 rounded-full border ${selectedColor === name ? 'ring-2 ring-black ring-offset-1' : 'border-black'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar relative bg-white" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {/* Time Grid - Horizontal Hours with Vertical 10-min Slots */}
            {hours.map((hour) => (
              <div key={hour} className="flex border-t border-black first:border-t-0 relative min-h-[144px]">
                {/* Hour Label - Positioned overlapping the border */}
                <div className="w-10 flex-shrink-0 flex justify-center relative bg-white">
                  <span className="text-[12px] font-black absolute -top-2 bg-white px-1 z-10">{String(hour).padStart(2, '0')}</span>
                  <div className="w-full border-r border-black/20" />
                </div>

                {/* Time Slots Container - 6 rows stacked vertically (10 min each, 24px per slot) */}
                <div className="flex-1 relative">
                  {/* Background Grid - 6 horizontal lines */}
                  <div className="absolute inset-0">
                    {[0, 1, 2, 3, 4, 5].map(slot => (
                      <div 
                        key={slot} 
                        className="h-6 border-b border-black/5 last:border-b-0"
                      />
                    ))}
                  </div>

                  {/* Interactive Slots - 6 rows */}
                  <div className="absolute inset-0">
                    {[0, 1, 2, 3, 4, 5].map(slot => (
                      <div
                        key={slot}
                        className="h-6 cursor-pointer hover:bg-black/5 transition-colors"
                        onMouseDown={(e) => handleMouseDown(e, hour, slot)}
                        onMouseEnter={() => handleMouseEnter(hour, slot)}
                      />
                    ))}
                  </div>

                  {/* Drag Preview for this hour */}
                  {isDragging && dragStartAbs !== null && dragEndAbs !== null && (
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {[0, 1, 2, 3, 4, 5].map(s => {
                        const currentAbs = getAbsSlot(hour, s)
                        const start = Math.min(dragStartAbs, dragEndAbs)
                        const end = Math.max(dragStartAbs, dragEndAbs)
                        if (currentAbs >= start && currentAbs <= end) {
                          return (
                            <div
                              key={s}
                              className="absolute left-0 right-0 border-x border-black"
                              style={{
                                top: `${s * 24}px`,
                                height: '24px',
                                backgroundColor: `${COLORS[selectedColor]}40`,
                                borderTop: currentAbs === start ? '2px solid black' : 'none',
                                borderBottom: currentAbs === end ? '2px solid black' : 'none',
                                borderLeft: `4px solid ${COLORS[selectedColor]}`
                              }}
                            />
                          )
                        }
                        return null
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Absolute Layer for Contiguous Time Blocks */}
            <div className="absolute top-0 left-10 right-0 bottom-0 pointer-events-none z-30">
              {plannerData.timeBlocks.map(block => {
                const hIdx = hours.indexOf(block.hour)
                if (hIdx === -1) return null

                const top = hIdx * 144 + (block.startMinute / 10) * 24
                const height = block.duration * 24
                
                return (
                  <div
                    key={block.id}
                    className="absolute left-[1px] right-0 pointer-events-auto cursor-pointer group hover:brightness-95 transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] border-l-[4px] border-y border-r border-black/10 overflow-visible"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: `${COLORS[block.color]}15`,
                      borderLeftColor: COLORS[block.color],
                    }}
                    onMouseDown={(e) => {
                      if (e.button !== 2) { // Not right click
                        setEditingBlock(block)
                        setInputValue(block.content)
                        setShowInput(true)
                      }
                    }}
                  >
                    {/* Delete Icon */}
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        deleteBlock(block.id)
                      }}
                      className="absolute top-1 right-1 size-5 bg-white hover:bg-red-50 text-black hover:text-red-600 rounded-full flex items-center justify-center border border-black/10 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-50 hover:scale-110 active:scale-95"
                      title="Delete event"
                    >
                      <X className="size-3" />
                    </button>

                    <div className="px-3 py-1.5 pr-8 h-full flex flex-col items-start leading-tight overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-1 w-full">
                        <span className="text-[9px] font-bold text-black opacity-30 tracking-tight whitespace-nowrap">
                          {String(block.hour).padStart(2, '0')}:{String(block.startMinute).padStart(2, '0')}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-black/10 shrink-0" />
                        <span className="text-[11px] font-black text-black tracking-tight truncate uppercase">
                          {block.content}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="flex h-16 items-center justify-around border-t-2 border-black bg-white px-4 pb-2">
        <button 
          onClick={() => router.push('/')}
          className="flex flex-col items-center gap-1 text-black/30"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-black">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span className="text-[10px] font-black uppercase">Daily</span>
        </button>
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center gap-1 text-black/30"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase">Board</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-black/30">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-black/30">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase">Settings</span>
        </button>
      </nav>

      {/* Input Modal */}
      {showInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInput(false)}>
          <div className="bg-white p-6 border-2 border-black max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black mb-4 uppercase">Enter Event</h3>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
              placeholder="What are you working on?"
              className="w-full border-2 border-black p-3 text-sm focus:outline-none focus:ring-0 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setShowInput(false)
                  setInputValue('')
                  setDragStartAbs(null)
                  setDragEndAbs(null)
                  setEditingBlock(null)
                }}
                className="flex-1 border-2 border-black bg-white text-black py-2 px-4 font-bold uppercase text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleInputSubmit}
                className="flex-1 bg-black text-white py-2 px-4 font-bold uppercase text-sm hover:bg-slate-800"
              >
                Confirm
              </button>
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
