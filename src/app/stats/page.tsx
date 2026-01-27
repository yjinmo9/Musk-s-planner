'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { 
  BarChart3, 
  Share2, 
  TrendingUp, 
  Home, 
  ClipboardList, 
  LayoutGrid, 
  Settings,
  Lock,
  PieChart,
  Activity,
  Zap,
  CheckCircle2,
  Calendar,
  Check,
  XCircle,
  Clock,
  Loader
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

type DailyPlan = {
  id: string;
  date: string;
  main_things: { text: string; completed: boolean }[];
  completed: boolean;
};

type TimeBlock = {
  color: string;
  daily_plan_id: string;
};

type UserSettings = {
  time_box_interval: number;
  color_protocol: { id: string; color: string; label: string }[];
};

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  // --- Data State ---
  const [dailyReadiness, setDailyReadiness] = useState(0);
  const [dailyTasks, setDailyTasks] = useState<{ text: string; completed: boolean }[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyData, setWeeklyData] = useState<number[]>([]); // For chart (percentages)
  const [weeklyHours, setWeeklyHours] = useState<number[]>([]); // For modal (raw hours)
  const [timeAllocation, setTimeAllocation] = useState<{ label: string; value: number; color: string; hrs: string }[]>([]);
  const [totalTimeThisWeek, setTotalTimeThisWeek] = useState(0);
  const [totalTimeLastWeek, setTotalTimeLastWeek] = useState(0);


  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('time_box_interval, color_protocol')
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error("Error fetching user settings", settingsError);
      setIsLoading(false);
      return;
    }
    const timeBoxInterval = settings?.time_box_interval || 10;
    const colorProtocol = settings?.color_protocol || [];
    const getColorLabel = (color: string) => colorProtocol.find(c => c.color === color)?.label || '기타';

    // 2. Fetch daily_plans for the last 90 days
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: plans, error: plansError } = await supabase
      .from('daily_plans')
      .select('id, date, main_things, completed')
      .gte('date', ninetyDaysAgo)
      .order('date', { ascending: false });

    if (plansError) {
      console.error("Error fetching daily plans", plansError);
      setIsLoading(false);
      return;
    }
    
    const todayPlan = plans.find(p => new Date(p.date).getUTCDate() === today.getUTCDate() && new Date(p.date).getUTCMonth() === today.getUTCMonth());

    // 3. Calculate Daily Readiness
    if (todayPlan && todayPlan.main_things.length > 0) {
      const completedCount = todayPlan.main_things.filter(t => t.completed).length;
      setDailyReadiness(Math.round((completedCount / todayPlan.main_things.length) * 100));
      setDailyTasks(todayPlan.main_things);
    } else {
      setDailyReadiness(0);
      setDailyTasks([]);
    }

    // 4. Calculate Streak
    let currentStreak = 0;
    let expectedDate = new Date(today);
    
    for (const plan of plans) {
        const planDate = new Date(plan.date);
        // Adjust planDate to midnight UTC to match expectedDate
        planDate.setUTCHours(0, 0, 0, 0);

        // Adjust expectedDate to midnight UTC
        expectedDate.setUTCHours(0, 0, 0, 0);
        
        // Compare dates by getting time
        if (planDate.getTime() === expectedDate.getTime()) {
            if (plan.completed) {
                currentStreak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                // Today's plan is not completed, but it doesn't break the streak yet.
                if (planDate.getTime() !== today.getTime()) {
                    break;
                }
            }
        } else if (planDate.getTime() < expectedDate.getTime()) {
            // A day was missed
            break;
        }
    }
    setStreakDays(currentStreak);

    // 5. Fetch time_blocks for the last 14 days
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dailyPlanIds = plans.filter(p => new Date(p.date) >= new Date(fourteenDaysAgo)).map(p => p.id);
    
    // Default to empty arrays
    setWeeklyHours(Array(7).fill(0));
    setWeeklyData(Array(7).fill(0));

    if (dailyPlanIds.length > 0) {
      const { data: timeBlocks, error: blocksError } = await supabase
        .from('time_blocks')
        .select('daily_plan_id, color')
        .in('daily_plan_id', dailyPlanIds);

      if (blocksError) console.error("Error fetching time blocks", blocksError);

      if (timeBlocks) {
        const calculatedWeeklyHours = Array(7).fill(0);
        let thisWeekTotal = 0;
        let lastWeekTotal = 0;

        for (let i = 0; i < 14; i++) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const plan = plans.find(p => new Date(p.date).toDateString() === date.toDateString());
          if (plan) {
            const blockCount = timeBlocks.filter(b => b.daily_plan_id === plan.id).length;
            const hours = (blockCount * timeBoxInterval) / 60;
            const dayOfWeek = (today.getDay() - i + 7) % 7; // Sunday=0, Monday=1...

            if (i < 7) {
                const dayIndex = (today.getDay() - i + 6) % 7; // M=0, T=1... S=6
                // weeklyHours array is M, T, W, T, F, S, S
                // i=0 is today, i=1 is yesterday
                const targetIndex = ( ( (today.getDay() - i) % 7 ) + 6 ) % 7;
                calculatedWeeklyHours[targetIndex] = hours;
                thisWeekTotal += hours;
            } else {
              lastWeekTotal += hours;
            }
          }
        }
        
        // Correct order: Mon, Tue, ..., Sun
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
        const reorderedWeeklyHours: number[] = [];
        for(let i=0; i<7; i++){
            // day i=0:Mon, i=1:Tue...
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - (dayOfWeek - 1 - i));
            const plan = plans.find(p => new Date(p.date).toDateString() === targetDate.toDateString());
            if(plan){
                 const blockCount = timeBlocks.filter(b => b.daily_plan_id === plan.id).length;
                 reorderedWeeklyHours.push((blockCount * timeBoxInterval) / 60);
            } else {
                 reorderedWeeklyHours.push(0);
            }
        }
        setWeeklyHours(reorderedWeeklyHours);

        const maxHours = Math.max(...reorderedWeeklyHours);
        setWeeklyData(reorderedWeeklyHours.map(h => maxHours > 0 ? (h / maxHours) * 100 : 0));
        setTotalTimeThisWeek(reorderedWeeklyHours.reduce((a,b) => a+b, 0));
        setTotalTimeLastWeek(lastWeekTotal);

        if (todayPlan) {
          const todayBlocks = timeBlocks.filter(b => b.daily_plan_id === todayPlan.id);
          const allocation: { [key: string]: number } = {};
          todayBlocks.forEach(block => {
            if (block.color) {
              allocation[block.color] = (allocation[block.color] || 0) + 1;
            }
          });
          
          const totalBlocks = todayBlocks.length;
          if (totalBlocks > 0) {
            const allocationData = Object.entries(allocation).map(([color, count]) => ({
              label: getColorLabel(color),
              value: Math.round((count / totalBlocks) * 100),
              color: color,
              hrs: ((count * timeBoxInterval) / 60).toFixed(1),
            })).sort((a, b) => b.value - a.value);
            setTimeAllocation(allocationData);
          } else {
            setTimeAllocation([]);
          }
        }
      }
    }
    
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const closeModal = () => setSelectedStat(null);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#f8f8f8] p-4 md:p-8 flex items-center justify-center">
        <Loader className="size-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        
        <div className="mb-8 flex items-end justify-between border-b-4 border-black pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-black p-3 text-white">
                <BarChart3 className="size-8" />
             </div>
             <div>
                <h1 className="text-[32px] font-black italic tracking-tighter uppercase leading-none">MISSION STATS</h1>
                <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-widest">Performance Analysis & Output Tracking</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          <div className="lg:col-span-8 space-y-8">
            <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
                  <button 
                    onClick={() => setSelectedStat('readiness')}
                    className="relative size-64 flex-shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer group"
                  >
                    <svg className="size-full transform -rotate-90" viewBox="0 0 256 256">
                      <circle cx="128" cy="128" r="110" stroke="#f3f4f6" strokeWidth="24" fill="none" />
                      <circle
                        cx="128" cy="128" r="110"
                        stroke="black" strokeWidth="24" fill="none"
                        strokeDasharray={`${2 * Math.PI * 110}`}
                        strokeDashoffset={`${2 * Math.PI * 110 * (1 - dailyReadiness / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[64px] font-black italic leading-none">{dailyReadiness}%</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">EFFICIENCY</span>
                    </div>
                  </button>
                  <div className="text-center lg:text-left">
                    <h2 className="text-[32px] font-black italic tracking-tighter uppercase mb-2">CONTINUOUS STREAK</h2>
                    <p className="text-sm font-bold text-gray-500 uppercase max-w-sm">현재 <span className="text-black">{streakDays}일</span> 연속으로 목표를 달성하고 있습니다. 이 모멘텀을 유지하세요.</p>
                    <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-4">
                       <div className="bg-black text-white px-4 py-2 text-xs font-black uppercase">MOMENTUM: {streakDays > 7 ? 'HIGH' : streakDays > 2 ? 'STABLE' : 'LOW'}</div>
                       <div className="border-2 border-black px-4 py-2 text-xs font-black uppercase">SYSTEM NOMINAL</div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WEEKLY OUTPUT</p>
                        <h3 className="text-[32px] font-black italic">{totalTimeThisWeek.toFixed(1)}H</h3>
                     </div>
                     <Clock className="size-6 text-black/20" />
                  </div>
                  <div className="h-2 w-full bg-gray-100 mt-4 overflow-hidden border-2 border-black">
                     <div className="h-full bg-black" style={{width: `${totalTimeLastWeek > 0 ? (totalTimeThisWeek / totalTimeLastWeek) * 100 : totalTimeThisWeek > 0 ? 100 : 0}%`}}></div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase">
                    지난주 대비 {(totalTimeThisWeek - totalTimeLastWeek).toFixed(1)}H {totalTimeThisWeek >= totalTimeLastWeek ? '증가' : '감소'}
                  </p>
               </div>
               <div 
                  onClick={() => setSelectedStat('pro_tier')}
                  className="border-4 border-dashed border-black bg-gray-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white hover:border-solid transition-all"
                >
                  <div className="p-2 bg-black text-white mb-2">
                    <Lock className="size-4" />
                  </div>
                  <p className="text-xs font-black uppercase text-gray-400 group-hover:text-black">UNLOCK FOCUS SCORE</p>
                  <p className="text-[9px] font-bold text-gray-400">Pro Tier에서 확인 가능</p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div 
              onClick={() => setSelectedStat('momentum')}
              className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all group"
            >
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">WEEKLY MOMENTUM</h3>
                  <BarChart3 className="size-4 text-gray-300 group-hover:text-black transition-colors" />
               </div>
               <div className="flex items-end justify-between h-48 gap-2">
                  {weeklyData.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                       <div className={`w-full bg-black transition-all hover:bg-gray-700`} style={{ height: `${val}%` }}></div>
                       <span className="text-[9px] font-black text-gray-400 uppercase">{['M','T','W','T','F','S','S'][i]}</span>
                    </div>
                  ))}
               </div>
            </div>

             <div 
              onClick={() => setSelectedStat('allocation')}
              className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:bg-gray-50 transition-all group"
            >
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">TIME ALLOCATION</h3>
                  <PieChart className="size-4 text-gray-300 group-hover:text-black transition-colors" />
               </div>
               <div className="flex flex-col gap-3">
                  {timeAllocation.length > 0 ? timeAllocation.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 overflow-hidden border-2 border-black">
                        <div className="h-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: item.color }}></div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <p className="text-xs font-bold text-gray-400">오늘 기록된 데이터가 없습니다.</p>
                    </div>
                  )}
               </div>
            </div>
            
            <div 
              onClick={() => setSelectedStat('pro_tier')}
              className="border-4 border-black bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_11px_rgba(168,85,247,0.2)] transition-all group"
            >
               <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">NEURAL LINK</h3>
               <p className="text-xs font-bold text-purple-400 mb-4">고급 분석 기능으로 생산성을 극대화하세요.</p>
               <div className="text-center">
                 <button className="w-full bg-white text-black py-2 font-black tracking-widest text-xs uppercase hover:bg-purple-400 transition-colors">
                     업그레이드
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={selectedStat === 'momentum'} onClose={closeModal} title="미션 로그 (주간)">
        <div className="space-y-2">
            <div className="text-xs text-gray-500 font-bold uppercase mb-2">지난 7일간 기록</div>
            {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => (
                <div key={day} className="flex items-center justify-between p-2 hover:bg-gray-50">
                    <div className="text-sm font-bold">{day}요일</div>
                    <div className="text-sm font-black">{ (weeklyHours[i] || 0).toFixed(1) }시간</div>
                </div>
            ))}
            <div className="mt-4 p-3 bg-gray-100 border-2 border-gray-200">
                <div className="text-xs font-bold text-gray-500 uppercase">주간 요약</div>
                <div className="text-lg font-black tracking-tight mt-1">총 출력: {totalTimeThisWeek.toFixed(1)}시간</div>
                <div className="text-xs font-bold text-green-600 mt-1 uppercase">
                  ▲ 지난주 대비 {totalTimeThisWeek >= totalTimeLastWeek ? '+' : ''}{(totalTimeThisWeek - totalTimeLastWeek).toFixed(1)}H
                </div>
            </div>
        </div>
      </Modal>

      {/* Other modals remain the same */}
      <Modal isOpen={selectedStat === 'readiness'} onClose={closeModal} title="일일 미션 체크리스트">
        <div className="space-y-4">
          {dailyTasks.length > 0 ? dailyTasks.map((task, i) => (
            <div key={i} className={`flex items-start gap-3 pb-3 border-b border-gray-100 ${task.completed ? 'opacity-50' : ''}`}>
              <div className={`mt-0.5 w-5 h-5 flex items-center justify-center border-2 border-black ${task.completed ? 'bg-black text-white' : 'bg-white'}`}>
                {task.completed && <Check className="w-3 h-3" />}
              </div>
              <div className={`text-sm font-bold ${task.completed ? 'line-through decoration-2' : ''}`}>
                {task.text}
              </div>
            </div>
          )) : <p className="text-center text-sm text-gray-500 py-4">오늘의 주요 과업이 없습니다.</p> }
        </div>
      </Modal>
      <Modal isOpen={selectedStat === 'allocation'} onClose={closeModal} title="자원 배분 현황">
        <div className="space-y-4">
            {timeAllocation.length > 0 ? timeAllocation.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="size-16 rounded-full border-4 border-black flex items-center justify-center text-sm font-black" style={{ backgroundColor: item.color, color: ['#000000', '#2563eb', '#dc2626'].includes(item.color) ? 'white' : 'black' }}>
                        {item.value}%
                    </div>
                    <div>
                        <div className="text-sm font-black uppercase">{item.label}</div>
                        <div className="text-xs text-gray-500 font-bold">{item.hrs}시간 기록됨</div>
                    </div>
                </div>
            )) : <p className="text-center text-sm text-gray-500 py-8">표시할 데이터가 없습니다.</p>}
        </div>
      </Modal>
      <Modal isOpen={selectedStat === 'pro_tier'} onClose={closeModal} title="뉴럴 링크 업그레이드">
        <div className="text-center py-4 text-black">
             <Activity className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-pulse" />
             <h3 className="text-lg font-black italic mb-2 uppercase">고급 데이터 잠금 해제</h3>
             <p className="text-sm text-gray-600 mb-6 px-4">
                 정밀 분석, 히트맵, AI 기반 생산성 인사이트를 통해 당신의 출력을 수치적으로 한계까지 끌어올리세요.
             </p>
             <div className="bg-gray-50 border-2 border-gray-200 p-4 mb-6 text-left">
                 <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /><span className="text-xs font-bold">몰입 품질 점수 분석</span></div>
                 <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /><span className="text-xs font-bold">피크 타임 성능 히트맵</span></div>
                 <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /><span className="text-xs font-bold">장기 속도 및 성장 추이</span></div>
                 <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /><span className="text-xs font-bold">데이터 내보내기 (CSV/PDF)</span></div>
             </div>
             <button className="w-full bg-black text-white py-4 font-black tracking-widest text-sm hover:bg-purple-600 transition-colors uppercase">체험 시작하기 ($5/월)</button>
             <button onClick={closeModal} className="mt-4 text-xs font-bold text-gray-400 hover:text-black uppercase">아직 평범한 인간으로 남겠습니다</button>
        </div>
      </Modal>
    </div>
  );
}