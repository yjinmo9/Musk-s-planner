'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

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

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ hour: number; slot: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ hour: number; slot: number } | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)

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
              id: `block-${index}`,
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
          for (let i = 0; i < block.duration; i++) {
            segments.push({
              daily_plan_id: planId,
              hour: block.hour,
              segment: (block.startMinute / 10) + i,
              color: block.color,
              content: block.content
            })
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

  // 마우스 핸들러
  const handleMouseDown = (e: React.MouseEvent, hour: number, slot: number) => {
    e.preventDefault()
    const isRightClick = e.button === 2

    // Check if clicking on existing block
    const clickedBlock = plannerData.timeBlocks.find(block => 
      block.hour === hour && 
      slot >= block.startMinute / 10 && 
      slot < (block.startMinute / 10 + block.duration)
    )

    if (clickedBlock) {
      if (isRightClick) {
        // Delete block
        setPlannerData(prev => ({
          ...prev,
          timeBlocks: prev.timeBlocks.filter(b => b.id !== clickedBlock.id)
        }))
        setTimeout(saveData, 100)
      } else {
        // Edit block
        setEditingBlock(clickedBlock)
        setInputValue(clickedBlock.content)
        setShowInput(true)
      }
    } else {
      // Start new drag
      setIsDragging(true)
      setDragStart({ hour, slot })
      setDragEnd({ hour, slot })
    }
  }

  const handleMouseEnter = (hour: number, slot: number) => {
    if (!isDragging || !dragStart) return
    
    // Only allow dragging within the same hour
    if (hour === dragStart.hour) {
      setDragEnd({ hour, slot })
    }
  }

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) return

    const startSlot = Math.min(dragStart.slot, dragEnd.slot)
    const endSlot = Math.max(dragStart.slot, dragEnd.slot)

    // Check for overlap
    if (hasOverlap(dragStart.hour, startSlot, endSlot)) {
      alert('This time slot overlaps with an existing event!')
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    setShowInput(true)
    setIsDragging(false)
  }

  const handleInputSubmit = () => {
    if (!inputValue.trim()) {
      setShowInput(false)
      setInputValue('')
      setDragStart(null)
      setDragEnd(null)
      setEditingBlock(null)
      return
    }

    if (editingBlock) {
      // Update existing block
      setPlannerData(prev => ({
        ...prev,
        timeBlocks: prev.timeBlocks.map(block =>
          block.id === editingBlock.id
            ? { ...block, content: inputValue.trim() }
            : block
        )
      }))
    } else if (dragStart && dragEnd) {
      // Create new block
      const startSlot = Math.min(dragStart.slot, dragEnd.slot)
      const endSlot = Math.max(dragStart.slot, dragEnd.slot)
      const duration = endSlot - startSlot + 1

      const newBlock: TimeBlock = {
        id: `block-${Date.now()}`,
        hour: dragStart.hour,
        startMinute: startSlot * 10,
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
    setDragStart(null)
    setDragEnd(null)
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

  const hours = [4, 5, 6, 7, 8, 9, 10, 11, 12]

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
            <h3 className="text-black text-xs font-black uppercase">Time Plan</h3>
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
                  {isDragging && dragStart && dragEnd && dragStart.hour === hour && dragEnd.hour === hour && (
                    <div
                      className="absolute pointer-events-none border border-black bg-black/5 left-0 right-0 z-20"
                      style={{
                        top: `${Math.min(dragStart.slot, dragEnd.slot) * 24}px`,
                        height: `${(Math.abs(dragEnd.slot - dragStart.slot) + 1) * 24}px`
                      }}
                    />
                  )}

                  {/* Rendered Time Blocks for this hour */}
                  {plannerData.timeBlocks
                    .filter(block => block.hour === hour)
                    .map(block => (
                      <div
                        key={block.id}
                        className="absolute left-[1px] right-0 cursor-pointer hover:brightness-95 transition-all z-30 shadow-sm overflow-hidden"
                        style={{
                          top: `${(block.startMinute / 10) * 24}px`,
                          height: `${block.duration * 24}px`,
                          backgroundColor: `${COLORS[block.color]}15`, // More transparent
                          borderLeft: `3px solid ${COLORS[block.color]}`
                        }}
                        onMouseDown={(e) => handleMouseDown(e, block.hour, block.startMinute / 10)}
                      >
                        <div className="px-3 py-1.5 h-full flex flex-col items-start leading-tight">
                          <span className="text-[10px] font-black text-black">
                            {String(block.hour).padStart(2, '0')}:{String(block.startMinute).padStart(2, '0')} - {
                              block.startMinute + block.duration * 10 >= 60 
                                ? `${String(block.hour + 1).padStart(2, '0')}:00` 
                                : `${String(block.hour).padStart(2, '0')}:${String(block.startMinute + block.duration * 10).padStart(2, '0')}`
                            }
                          </span>
                          <span className="text-[11px] font-bold text-black/80 mt-1 line-clamp-2">
                            {block.content}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
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
                  setDragStart(null)
                  setDragEnd(null)
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
