'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Check, Settings, ChevronLeft, Calendar as CalendarIcon, ClipboardCheck, LayoutDashboard, BarChart3, GripVertical, Maximize2, Minimize2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DEFAULT_COLORS: Record<string, string> = {
  blue: '#93c5fd',
  green: '#86efac',
  yellow: '#fde047',
  purple: '#d8b4fe'
}

interface TimeBlock {
  id: string
  hour: number
  startMinute: number
  duration: number
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

interface ColorProtocol {
  id: string
  color: string
  label: string
}

function DailyContent() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const [currentDate, setCurrentDate] = useState(new Date(dateParam))
  
  const defaultProtocol = useMemo(() => Object.entries(DEFAULT_COLORS).map(([id, color]) => ({ id, color, label: id.toUpperCase() })), []);

  const [plannerData, setPlannerData] = useState<PlannerData>({ mainThings: [], brainDump: '', timeBlocks: [], completed: false });
  const [dailyPlanId, setDailyPlanId] = useState<string | null>(null);
  
  const [quantum, setQuantum] = useState(10);
  const [hours, setHours] = useState(Array.from({length: 18}, (_, i) => (i + 7) % 24));
  const [colorProtocol, setColorProtocol] = useState<ColorProtocol[]>(defaultProtocol);
  const [colorsMap, setColorsMap] = useState<Record<string, string>>(DEFAULT_COLORS);
  const [selectedColor, setSelectedColor] = useState('blue');
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartAbs, setDragStartAbs] = useState<number | null>(null);
  const [dragEndAbs, setDragEndAbs] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  
  // State for Mission Readiness and Streak
  const [missionReadiness, setMissionReadiness] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  
  // Compact view state for overview mode
  const [isCompactView, setIsCompactView] = useState(false);


  const SLOTS_PER_HOUR = 60 / quantum;
  const SLOT_HEIGHT = 144 / SLOTS_PER_HOUR;
  
  // Dynamic height for compact view (calculate based on container height and number of hours)
  // 90vh 컸테이너에서 헤더(~60px)를 제외하고 시간 개수로 나눔
  const COMPACT_CONTAINER_HEIGHT = typeof window !== 'undefined' ? window.innerHeight * 0.90 - 60 : 800;
  const COMPACT_HOUR_HEIGHT = isCompactView && hours.length > 0 ? COMPACT_CONTAINER_HEIGHT / hours.length : 60;
  const currentHourHeight = isCompactView ? COMPACT_HOUR_HEIGHT : 144;
  const currentSlotHeight = currentHourHeight / SLOTS_PER_HOUR;

  const resetInput = useCallback(() => {
    setShowInput(false);
    setInputValue('');
    setDragStartAbs(null);
    setDragEndAbs(null);
    setEditingBlock(null);
    setIsDragging(false);
  }, []);

  const mergeTimeBlocks = useCallback((blocks: {id: string, hour: number, segment: number, content: string, color: string}[]): TimeBlock[] => {
    if (!blocks || blocks.length === 0) return [];
    
    const grouped = new Map<string, {segments: {segment: number, hour: number, id: string}[], content: string, color: string}>();

    blocks.forEach(block => {
        const key = `${block.content}-${block.color}`;
        if (!grouped.has(key)) {
            grouped.set(key, {segments: [], content: block.content, color: block.color});
        }
        grouped.get(key)!.segments.push({segment: block.segment, hour: block.hour, id: block.id});
    });

    const mergedBlocks: TimeBlock[] = [];

    grouped.forEach((groupValue) => {
        const sortedSegments = groupValue.segments.sort((a,b) => (a.hour * 6 + a.segment) - (b.hour * 6 + b.segment));
        
        let currentMergedBlock: TimeBlock | null = null;

        for (let i = 0; i < sortedSegments.length; i++) {
            const {segment, hour} = sortedSegments[i];
            
            if (!currentMergedBlock || (hour * SLOTS_PER_HOUR + segment) !== (currentMergedBlock.hour * SLOTS_PER_HOUR + (currentMergedBlock.startMinute / quantum) + (currentMergedBlock.duration / quantum)) ) {
                if (currentMergedBlock) {
                    mergedBlocks.push(currentMergedBlock);
                }
                currentMergedBlock = {
                    id: `${groupValue.content}-${groupValue.color}-${hour}-${segment}-${Math.random()}`,
                    hour: hour,
                    startMinute: segment * quantum,
                    duration: quantum,
                    content: groupValue.content,
                    color: groupValue.color,
                };
            } else {
                currentMergedBlock.duration += quantum;
            }
        }
        if (currentMergedBlock) {
            mergedBlocks.push(currentMergedBlock);
        }
    });

    return mergedBlocks;
  }, [quantum, SLOTS_PER_HOUR]);

  const fetchData = useCallback(async () => {
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);
    setCurrentDate(targetDate);
    const dateString = targetDate.toISOString().split('T')[0];

    if (user) {
      const { data: settings } = await supabase.from('user_settings').select('time_box_interval, day_start, day_end, color_protocol').single();
      if (settings) {
        setQuantum(settings.time_box_interval || 10);
        const start = parseInt((settings.day_start || '07:00').split(':')[0]);
        const end = parseInt((settings.day_end || '23:00').split(':')[0]);
        const h = [];
        let curr = start;
        while (curr !== end) { h.push(curr); curr = (curr + 1) % 24; }
        h.push(end);
        if (h.length > 0) setHours(h);
        const newColorProtocol = settings.color_protocol || [];
        if (newColorProtocol.length > 0) {
          setColorProtocol(newColorProtocol);
          setColorsMap(newColorProtocol.reduce((acc: Record<string, string>, c: ColorProtocol) => ({...acc, [c.id]: c.color}), {}));
          setSelectedColor(prev => {
            const exists = newColorProtocol.find((p: ColorProtocol) => p.id === prev);
            return exists ? prev : newColorProtocol[0].id;
          });
        } else {
          setColorProtocol(defaultProtocol);
          setColorsMap(DEFAULT_COLORS);
          setSelectedColor('blue');
        }
      }
      
      const { data: dailyPlan } = await supabase.from('daily_plans').select('*').eq('user_id', user.id).eq('date', dateString).single();
      if (dailyPlan) {
        setDailyPlanId(dailyPlan.id);
        const mainThings = dailyPlan.main_things || [];
        const completed = mainThings.filter((t: MainTask) => t.completed).length;
        const total = mainThings.length;
        setPlannerData(p => ({
          ...p, 
          mainThings: mainThings, 
          brainDump: dailyPlan.brain_dump || '', 
          completed: dailyPlan.completed || false
        }));
        setCompletedTasksCount(completed);
        setTotalTasksCount(total);
        setMissionReadiness(total > 0 ? Math.round((completed / total) * 100) : 0);
        
        const { data: timeBlocksDB } = await supabase.from('time_blocks').select('*').eq('daily_plan_id', dailyPlan.id);
        setPlannerData(p => ({...p, timeBlocks: timeBlocksDB ? mergeTimeBlocks(timeBlocksDB) : []}));
      } else {
        setPlannerData({ mainThings: [], brainDump: '', timeBlocks: [], completed: false });
        setDailyPlanId(null);
        setCompletedTasksCount(0);
        setTotalTasksCount(0);
        setMissionReadiness(0);
      }

      const ninetyDaysAgo = new Date(targetDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: plans, error: plansError } = await supabase.from('daily_plans').select('date, completed').gte('date', ninetyDaysAgo).order('date', { ascending: false });
      if (plansError) console.error("Error fetching daily plans for streak", plansError);
      
      let currentStreak = 0;
      let expectedDate = new Date(targetDate);
      
      if (plans) {
          for (const plan of plans) {
              const planDate = new Date(plan.date);
              planDate.setUTCHours(0, 0, 0, 0);
              expectedDate.setUTCHours(0, 0, 0, 0);
              if (planDate.getTime() === expectedDate.getTime()) {
                  if (plan.completed) {
                      currentStreak++;
                      expectedDate.setDate(expectedDate.getDate() - 1);
                  } else { if (planDate.getTime() !== targetDate.getTime()) break; }
              } else if (planDate.getTime() < expectedDate.getTime()) { break; }
          }
      }
      setStreakDays(currentStreak);

    } else {
      // Guest mode - load from localStorage
      const savedSettings = localStorage.getItem('musk-settings-guest');
      if (savedSettings) {
        try {
          const guestSettings = JSON.parse(savedSettings);
          if (guestSettings.color_protocol && guestSettings.color_protocol.length > 0) {
            setColorProtocol(guestSettings.color_protocol);
            setColorsMap(guestSettings.color_protocol.reduce((acc: Record<string, string>, c: ColorProtocol) => ({...acc, [c.id]: c.color}), {}));
            setSelectedColor(prev => {
              const exists = guestSettings.color_protocol.find((p: ColorProtocol) => p.id === prev);
              return exists ? prev : guestSettings.color_protocol[0].id;
            });
          } else {
            setColorProtocol(defaultProtocol);
            setColorsMap(DEFAULT_COLORS);
            setSelectedColor('blue');
          }
        } catch (e) {
          console.error('Failed to parse guest settings', e);
        }
      }
      
      const savedData = localStorage.getItem(`guest_planner_${dateString}`);
      const guestPlannerData = savedData ? JSON.parse(savedData) : { mainThings: [], brainDump: '', timeBlocks: [], completed: false };
      setPlannerData(guestPlannerData);
      const completed = guestPlannerData.mainThings.filter((t: MainTask) => t.completed).length;
      const total = guestPlannerData.mainThings.length;
      setCompletedTasksCount(completed);
      setTotalTasksCount(total);
      setMissionReadiness(total > 0 ? Math.round((completed / total) * 100) : 0);
      setStreakDays(0);
    }
  }, [user, dateParam, supabase, mergeTimeBlocks, defaultProtocol]);

  useEffect(() => { 
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, dateParam, user, fetchData]);

  // Reload settings when they change (via CustomEvent or periodic check)
  useEffect(() => {
    const checkAndUpdateColors = async () => {
      if (user) {
        // Logged-in user: fetch from Supabase
        const { data: settings } = await supabase.from('user_settings').select('color_protocol').single();
        if (settings?.color_protocol) {
          const newColorProtocol = settings.color_protocol;
          if (newColorProtocol.length > 0) {
            setColorProtocol(newColorProtocol);
            setColorsMap(newColorProtocol.reduce((acc: Record<string, string>, c: ColorProtocol) => ({...acc, [c.id]: c.color}), {}));
            setSelectedColor(prev => {
              const exists = newColorProtocol.find((p: ColorProtocol) => p.id === prev);
              return exists ? prev : newColorProtocol[0].id;
            });
          }
        }
      } else {
        // Guest mode: fetch from localStorage
        const savedSettings = localStorage.getItem('musk-settings-guest');
        if (savedSettings) {
          try {
            const guestSettings = JSON.parse(savedSettings);
            if (guestSettings.color_protocol && guestSettings.color_protocol.length > 0) {
              setColorProtocol(guestSettings.color_protocol);
              setColorsMap(guestSettings.color_protocol.reduce((acc: Record<string, string>, c: ColorProtocol) => ({...acc, [c.id]: c.color}), {}));
              setSelectedColor(prev => {
                const exists = guestSettings.color_protocol.find((p: ColorProtocol) => p.id === prev);
                return exists ? prev : guestSettings.color_protocol[0].id;
              });
            }
          } catch (e) {
            console.error('Failed to parse guest settings', e);
          }
        }
      }
    };

    // Check for updates every 2 seconds
    const interval = setInterval(checkAndUpdateColors, 2000);

    // Listen for custom event from Settings page
    const handleColorProtocolUpdate = () => {
      checkAndUpdateColors();
    };

    window.addEventListener('colorProtocolUpdated', handleColorProtocolUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('colorProtocolUpdated', handleColorProtocolUpdate);
    };
  }, [user, supabase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDragging) { setIsDragging(false); setDragStartAbs(null); setDragEndAbs(null); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDragging, showInput, resetInput]);

  const saveData = useCallback(async () => {
    const dateString = currentDate.toISOString().split('T')[0];
    if (!dateString) return;

    if (user) {
      const { data: upsertedPlan, error: planError } = await supabase.from('daily_plans').upsert({ 
        id: dailyPlanId || undefined, 
        user_id: user.id, 
        date: dateString, 
        main_things: plannerData.mainThings, 
        brain_dump: plannerData.brainDump, 
        completed: plannerData.completed 
      }, { onConflict: 'user_id,date', ignoreDuplicates: false }).select().single();
      
      if (planError) { console.error("Error saving plan:", planError); return; }
      if (upsertedPlan) {
        setDailyPlanId(upsertedPlan.id);
        await supabase.from('time_blocks').delete().eq('daily_plan_id', upsertedPlan.id);
        const timeBlocksToUpsert = plannerData.timeBlocks.flatMap(block => 
          Array.from({ length: block.duration / quantum }, (_, i) => ({ 
            daily_plan_id: upsertedPlan.id, 
            hour: block.hour, 
            segment: (block.startMinute / quantum) + i, 
            color: block.color, 
            content: block.content 
          }))
        );
        if (timeBlocksToUpsert.length > 0) await supabase.from('time_blocks').insert(timeBlocksToUpsert);
      }
    } else {
      localStorage.setItem(`guest_planner_${dateString}`, JSON.stringify(plannerData));
    }
  }, [plannerData, dailyPlanId, user, currentDate, quantum, supabase]);

  const getAbsSlot = useCallback((hour: number, slot: number) => {
    const hourIndex = hours.indexOf(hour);
    if (hourIndex === -1) return -1;
    return hourIndex * SLOTS_PER_HOUR + slot;
  }, [hours, SLOTS_PER_HOUR]);

  const toggleMainTask = useCallback((index: number) => { setPlannerData(prev => ({...prev, mainThings: prev.mainThings.map((t,i) => i === index ? {...t, completed: !t.completed} : t)})); setTimeout(saveData, 100); }, [saveData]);
  const addMainTask = useCallback(() => { setPlannerData(prev => ({...prev, mainThings: [...prev.mainThings, {text: '', completed: false}]})); }, []);
  const updateMainTaskText = useCallback((index: number, text: string) => { setPlannerData(prev => ({...prev, mainThings: prev.mainThings.map((t,i)=>i===index ? {...t, text} : t)})); }, []);
  const toggleComplete = useCallback(() => { setPlannerData(prev => ({ ...prev, completed: !prev.completed })); setTimeout(saveData, 100); }, [saveData]);
  const deleteBlock = useCallback((id: string) => { setPlannerData(prev => ({ ...prev, timeBlocks: prev.timeBlocks.filter(b => b.id !== id) })); setTimeout(saveData, 100); }, [saveData]);

  const handleMouseDown = useCallback((e: React.MouseEvent, hour: number, slot: number) => {
    e.preventDefault();
    if (e.button === 2 || showInput) return;
    const absSlot = getAbsSlot(hour, slot);
    const clickedBlock = plannerData.timeBlocks.find(b => {
      const bStart = getAbsSlot(b.hour, b.startMinute / quantum);
      return absSlot >= bStart && absSlot < bStart + (b.duration / quantum);
    });
    if (clickedBlock) { setEditingBlock(clickedBlock); setInputValue(clickedBlock.content); setShowInput(true); } 
    else { setIsDragging(true); setDragStartAbs(absSlot); setDragEndAbs(absSlot); }
  }, [showInput, getAbsSlot, plannerData.timeBlocks, quantum]);

  const handleMouseEnter = useCallback((hour: number, slot: number) => { if (isDragging) setDragEndAbs(getAbsSlot(hour, slot)); }, [isDragging, getAbsSlot]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || dragStartAbs === null) {
        if(isDragging) setIsDragging(false);
        return;
    }
    const endAbs = dragEndAbs === null ? dragStartAbs : dragEndAbs;
    const start = Math.min(dragStartAbs, endAbs);
    const end = Math.max(dragStartAbs, endAbs);
    
    setIsDragging(false);

    if (start === end) { 
      resetInput();
      return;
    }
    
    const hasConflict = plannerData.timeBlocks.some(block => {
      const bStart = getAbsSlot(block.hour, block.startMinute / quantum);
      const bEnd = bStart + (block.duration / quantum) - 1;
      return !(end < bStart || start > bEnd);
    });

    if (hasConflict) {
      alert('시간대가 겹칩니다.');
      resetInput();
    } else {
      setShowInput(true);
    }
  }, [isDragging, dragStartAbs, dragEndAbs, plannerData.timeBlocks, getAbsSlot, quantum, resetInput]);

  const handleInputSubmit = useCallback(() => {
    if (!inputValue.trim()) return resetInput();
    if (editingBlock) {
      setPlannerData(prev => ({...prev, timeBlocks: prev.timeBlocks.map(b => b.id === editingBlock.id ? { ...b, content: inputValue.trim() } : b)}));
    } else if (dragStartAbs !== null) {
      const endAbs = dragEndAbs === null ? dragStartAbs : dragEndAbs;
      const start = Math.min(dragStartAbs, endAbs);
      const end = Math.max(dragStartAbs, endAbs);
      const newBlock: TimeBlock = {
        id: `${currentDate.toISOString()}-${hours[Math.floor(start / SLOTS_PER_HOUR)]}-${(start % SLOTS_PER_HOUR) * quantum}-${selectedColor}-${Math.random()}`,
        hour: hours[Math.floor(start / SLOTS_PER_HOUR)],
        startMinute: (start % SLOTS_PER_HOUR) * quantum,
        duration: (end - start + 1) * quantum,
        content: inputValue.trim(),
        color: selectedColor
      };
      setPlannerData(prev => ({ ...prev, timeBlocks: [...prev.timeBlocks, newBlock] }));
    }
    resetInput();
    setTimeout(saveData, 100);
  }, [inputValue, editingBlock, dragStartAbs, dragEndAbs, quantum, selectedColor, resetInput, saveData, hours, SLOTS_PER_HOUR, currentDate]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>;

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8] p-4 md:p-8" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between lg:flex">
          <div>
            <h1 className="text-[32px] font-black italic tracking-tighter uppercase leading-none">MISSION: DAILY LAUNCH</h1>
            <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-widest">{currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-3">
             <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="mb-6 flex items-center justify-between"><h3 className="text-sm font-black uppercase italic tracking-tighter">주요 과업</h3><button onClick={addMainTask} className="border-2 border-black p-1 hover:bg-black hover:text-white transition-all"><Plus className="w-4 h-4 stroke-[3px]" /></button></div>
                <div className="space-y-3">{plannerData.mainThings.map((task, index) => (<div key={index} className="group flex items-center gap-3 border-b-2 border-black/5 pb-2"><button onClick={() => toggleMainTask(index)} className={`flex size-6 shrink-0 items-center justify-center border-2 border-black transition-all ${task.completed ? 'bg-black text-white' : 'bg-white'}`}>{task.completed && <Check className="w-4 h-4 stroke-[4px]" />}</button><input className={`flex-1 bg-transparent text-[13px] font-bold outline-none uppercase ${task.completed ? 'line-through text-gray-400' : 'text-black'}`} value={task.text} onChange={(e) => updateMainTaskText(index, e.target.value)} onBlur={saveData} placeholder="전략 지점 입력..."/><button onClick={() => { setPlannerData(prev => ({...prev, mainThings: prev.mainThings.filter((_, i) => i !== index)})); setTimeout(saveData, 100); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-600"><X className="w-4 h-4 stroke-[3px]" /></button></div>))}</div>
             </div>
             <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="mb-4 text-sm font-black uppercase italic tracking-tighter">브레인 덤프</h3><textarea className="h-48 w-full resize-none bg-gray-50 p-4 text-[13px] font-medium leading-relaxed outline-none border-2 border-transparent focus:border-black transition-all" value={plannerData.brainDump} onChange={(e) => setPlannerData(prev => ({ ...prev, brainDump: e.target.value }))} onBlur={saveData} placeholder="모든 생각을 쏟아내세요..."/>
             </div>
          </div>
          <div className="lg:col-span-6">
            <div className={`relative border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col ${isCompactView ? 'h-[90vh]' : 'h-[75vh]'}`}>
              <div className="border-b-4 border-black p-4 flex items-center justify-between bg-white shrink-0">
                 <h2 className="text-lg font-black italic tracking-tighter uppercase">타임 플랜</h2>
                  <div className="flex gap-2">
                    {colorProtocol.map((c) => (
                      <button 
                        key={c.id} 
                        onClick={() => setSelectedColor(c.id)} 
                        className={`size-6 border-2 border-black transition-all ${selectedColor === c.id ? 'scale-110 ring-2 ring-black ring-offset-2 z-10' : 'opacity-40 hover:opacity-80'}`} 
                        style={{ backgroundColor: c.color }} 
                        title={c.label}
                      />
                    ))}
                    {/* 모아보기 토글 버튼 */}
                    <button 
                      onClick={() => setIsCompactView(!isCompactView)}
                      className="size-6 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all ml-2"
                      title={isCompactView ? '상세보기' : '모아보기'}
                    >
                      {isCompactView ? <Minimize2 className="w-3 h-3 stroke-[3px]" /> : <Maximize2 className="w-3 h-3 stroke-[3px]" />}
                    </button>
                  </div>
              </div>
              <div className={`flex-1 ${isCompactView ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden hide-scrollbar'}`} onContextMenu={(e) => e.preventDefault()}>
                <div className="relative w-full">
                  {hours.map((hour) => (
                    <div key={hour} className="flex border-b border-black last:border-b-0" style={{ height: `${currentHourHeight}px` }}>
                      <div className="w-16 shrink-0 flex flex-col items-center justify-start pt-1 border-r border-black bg-gray-50/50">
                        <span className={`font-black italic text-black/60 ${isCompactView ? 'text-[10px]' : 'text-[14px]'}`}>{String(hour).padStart(2, '0')}</span>
                      </div>
                      <div className="flex-1 relative">
                        <div className="absolute inset-0 grid" style={{ gridTemplateRows: `repeat(${SLOTS_PER_HOUR}, 1fr)` }}>
                          {Array.from({ length: SLOTS_PER_HOUR }).map((_, slot) => (
                            <div key={slot} className="border-b border-black/10 last:border-b-0 cursor-pointer hover:bg-black/[0.04] transition-colors" onMouseDown={(e) => handleMouseDown(e, hour, slot)} onMouseEnter={() => handleMouseEnter(hour, slot)}/>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {plannerData.timeBlocks.map((block) => {
                    const hIdx = hours.indexOf(block.hour);
                    if (hIdx === -1) return null;
                    const top = hIdx * currentHourHeight + (block.startMinute / quantum) * currentSlotHeight;
                    const height = (block.duration / quantum) * currentSlotHeight;
                    return (
                      <div key={block.id} className={`absolute left-16 right-0 border-2 border-black transition-all hover:brightness-95 group cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-10 ${isCompactView ? 'p-1' : 'p-2'}`} style={{ top: `${top}px`, height: `${height}px`, backgroundColor: colorsMap[block.color] || '#333', color: 'white' }} onMouseDown={(e) => { e.stopPropagation(); if (e.button === 2) { deleteBlock(block.id); } else { handleMouseDown(e, block.hour, block.startMinute/quantum)} }}>
                        <div className="flex h-full flex-col justify-start gap-1">
                          <p className={`font-black uppercase leading-tight text-black ${isCompactView ? 'text-base line-clamp-1' : 'text-base line-clamp-2'}`}>{block.content}</p>
                          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mt-auto italic">
                            <span className="text-[8px] font-black bg-black/20 px-1">{block.duration} MIN</span>
                            <button 
                              onMouseDown={(e) => e.stopPropagation()} 
                              onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} 
                              className="text-white hover:text-red-400 p-1 transition-colors"
                            >
                              <X className="w-3 h-3 stroke-[4px]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {isDragging && dragStartAbs !== null && (<div className="absolute left-16 right-0 border-4 border-dashed border-black bg-black/10 z-20 pointer-events-none" style={{ top: `${Math.min(dragStartAbs, dragEndAbs ?? dragStartAbs) * currentSlotHeight}px`, height: `${(Math.abs((dragEndAbs ?? dragStartAbs) - dragStartAbs) + 1) * currentSlotHeight}px` }}/>)}
                </div>
              </div>
            </div>
          </div>
          <div className="hidden space-y-6 lg:block lg:col-span-3">
             <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">LAUNCH READINESS</h3>
                   <span className="bg-black text-white px-2 py-0.5 text-[9px] font-black italic">ACTIVE</span>
                </div>
                <div className="flex flex-col items-center gap-6">
                   <div className="relative size-32 border-8 border-black flex items-center justify-center">
                      <span className="text-[32px] font-black italic">{missionReadiness}%</span>
                      <div className="absolute -bottom-4 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black">{completedTasksCount}/{totalTasksCount} TASKS</div>
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
                   <span className="text-[44px] font-black italic leading-none">{streakDays}</span>
                   <div>
                      <p className="text-[11px] font-black uppercase leading-tight">ACTIVE DAYS</p>
                      <p className="mt-1 text-[10px] font-bold text-green-600 uppercase">SYSTEM STABLE</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      {showInput && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className="w-full max-w-[400px] border-4 border-black bg-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"><h3 className="mb-6 text-[24px] font-black italic tracking-tighter uppercase">미션 상세 설정</h3><div className="space-y-4"><textarea autoFocus className="w-full h-32 resize-none border-4 border-black bg-gray-50 p-4 text-sm font-bold uppercase outline-none focus:bg-white transition-colors" placeholder="어떤 미션을 수행하시겠습니까?" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInputSubmit(); } }} /><div className="grid grid-cols-2 gap-4"><button onClick={(e) => {e.stopPropagation(); resetInput();}} className="h-14 border-2 border-black text-[11px] font-black uppercase tracking-widest hover:bg-gray-100">중단</button><button onClick={handleInputSubmit} className="h-14 bg-black text-[11px] font-black text-white uppercase tracking-widest hover:bg-gray-800">확정</button></div></div></div></div>)}
    </div>
  )
}

export default function Daily() {
  return (
    <Suspense fallback={ <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div> }>
      <DailyContent />
    </Suspense>
  )
}