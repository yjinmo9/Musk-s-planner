'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export default function StatsPage() {
  const router = useRouter();

  // Interaction State
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  // Mock Data
  const dailyReadiness = 80; // 4 out of 5 Main Things
  const streakDays = 12;
  const weeklyData = [45, 62, 38, 95, 52, 78, 58];
  const timeAllocation = [
    { label: '몰입 업무', value: 50, color: '#000000', hrs: '4.5' },
    { label: '회의', value: 20, color: '#666666', hrs: '2.0' },
    { label: '건강/운동', value: 10, color: '#999999', hrs: '1.0' },
    { label: '기타', value: 20, color: '#e5e5e5', hrs: '1.5' },
  ];

  // Daily Tasks Mock
  const dailyTasks = [
    { id: 1, text: "화성 탐사선 펌웨어 배포", completed: true },
    { id: 2, text: "스타쉽 엔진 테스트 리뷰", completed: true },
    { id: 3, text: "뉴럴링크 이사회 회의", completed: true },
    { id: 4, text: "도지코인 관련 트윗 작성", completed: true },
    { id: 5, text: "2026 로드맵 계획 수립", completed: false },
  ];

  const closeModal = () => setSelectedStat(null);

  return (
    <div className="min-h-screen w-full bg-[#f8f8f8] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Responsive Header */}
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
          <button className="hidden lg:flex items-center gap-2 border-4 border-black bg-white px-6 py-3 font-black uppercase italic hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none">
            <Share2 className="size-5" />
            SHARE REPORT
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Top Row: Main Performance (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
                  <button 
                    onClick={() => setSelectedStat('readiness')}
                    className="relative size-64 flex-shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer group"
                  >
                    <svg className="size-full transform -rotate-90">
                      <circle cx="128" cy="128" r="110" stroke="#f3f4f6" strokeWidth="20" fill="none" />
                      <circle
                        cx="128" cy="128" r="110"
                        stroke="black" strokeWidth="20" fill="none"
                        strokeDasharray={`${2 * Math.PI * 110}`}
                        strokeDashoffset={`${2 * Math.PI * 110 * (1 - 0.75)}`}
                        strokeLinecap="square"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[64px] font-black italic leading-none">{dailyReadiness}%</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">EFFICIENCY</span>
                    </div>
                    <div className="absolute -bottom-2 bg-black text-white px-2 py-0.5 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                      CLICK TO INSPECT
                    </div>
                  </button>
                  <div className="text-center lg:text-left">
                    <h2 className="text-[32px] font-black italic tracking-tighter uppercase mb-2">PEAK PERFORMANCE</h2>
                    <p className="text-sm font-bold text-gray-500 uppercase max-w-sm">당신의 집중도는 상위 5%입니다. 오전 10시에서 12시 사이에 가장 높은 효율을 보이고 있습니다.</p>
                    <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-4">
                       <div className="bg-black text-white px-4 py-2 text-xs font-black uppercase">STABLE LOGIC</div>
                       <div className="border-2 border-black px-4 py-2 text-xs font-black uppercase">SYSTEM NOMINAL</div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TIME BLOCKS</p>
                        <h3 className="text-[32px] font-black italic">14.2H</h3>
                     </div>
                     <Clock className="size-6 text-black/20" />
                  </div>
                  <div className="h-2 w-full bg-gray-100 mt-4 overflow-hidden">
                     <div className="h-full bg-black w-[80%]"></div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase">지난주 대비 +2.4H</p>
               </div>
               <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ACTIVE HOURS</p>
                        <h3 className="text-[32px] font-black italic">08.5H</h3>
                     </div>
                     <Zap className="size-6 text-black/20" />
                  </div>
                  <div className="h-2 w-full bg-gray-100 mt-4 overflow-hidden">
                     <div className="h-full bg-black w-[65%]"></div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase">금일 평균 대비 안정적</p>
               </div>
            </div>
          </div>

          {/* Right/Bottom Sidebar: Momentum & Categories (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">WEEKLY MOMENTUM</h3>
                  <BarChart3 className="size-4 text-gray-300" />
               </div>
               <div className="flex items-end justify-between h-48 gap-2">
                  {weeklyData.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                       <div className={`w-full bg-black transition-all hover:bg-gray-700 cursor-pointer ${i === 4 ? 'h-[90%] opacity-100' : 'h-[60%] opacity-20'}`} style={{ height: `${val}%` }}></div>
                       <span className="text-[9px] font-black text-gray-400 uppercase">{['M','T','W','T','F','S','S'][i]}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="border-4 border-black bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">NEURAL LOGS</h3>
               <div className="space-y-4">
                  {[
                    { label: 'DEEP WORK', value: '72%', status: 'OPTIMAL' },
                    { label: 'COORDINATION', value: '18%', status: 'NOMINAL' },
                    { label: 'RECOVERY', value: '10%', status: 'CRITICAL' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-zinc-800 pb-2">
                       <div>
                          <p className="text-xs font-black italic">{item.label}</p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase">{item.status}</p>
                       </div>
                       <span className="text-xl font-black">{item.value}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Daily Readiness Modal */}
      <Modal
        isOpen={selectedStat === 'readiness'}
        onClose={closeModal}
        title="일일 미션 체크리스트"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
            <span>과업</span>
            <span>상태</span>
          </div>
          {dailyTasks.map((task) => (
            <div key={task.id} className={`flex items-start gap-3 pb-3 border-b border-gray-100 ${task.completed ? 'opacity-50' : 'opacity-100'}`}>
              <div className={`mt-0.5 w-5 h-5 flex items-center justify-center border-2 border-black ${task.completed ? 'bg-black text-white' : 'bg-white'}`}>
                {task.completed && <Check className="w-3 h-3" />}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-bold ${task.completed ? 'line-through decoration-2' : ''}`}>
                  {task.text}
                </div>
              </div>
            </div>
          ))}
          <button className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-black border-2 border-red-500 text-red-500 p-2 hover:bg-red-50">
             <Calendar className="w-3 h-3" />
             미완료 항목 내일로 미루기
          </button>
        </div>
      </Modal>

      {/* 2. Momentum Modal */}
      <Modal
        isOpen={selectedStat === 'momentum'}
        onClose={closeModal}
        title="미션 로그 (MISSION LOG)"
      >
        <div className="space-y-4">
            <div className="text-xs text-gray-500 font-bold uppercase">이번 주 성과 분석</div>
            <div className="space-y-2">
                {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => (
                    <div key={day} className="flex items-center justify-between p-2 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 text-xs font-black bg-black text-white text-center py-1">{day}</div>
                            <div className="text-sm font-bold">{Math.floor(weeklyData[i] / 10)}시간 몰입 업무</div>
                        </div>
                        <div className="text-xs text-green-600 font-bold">
                             {weeklyData[i] > 60 ? '▲ 높음' : '- 보통'}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 p-3 bg-gray-100 border-2 border-gray-200">
                <div className="text-xs font-bold text-gray-500 uppercase">주간 요약</div>
                <div className="text-lg font-black tracking-tight mt-1">총 출력: 54시간</div>
                <div className="text-xs font-bold text-green-600 mt-1 uppercase">▲ 지난주 대비 15% 증가</div>
            </div>
        </div>
      </Modal>

      {/* 3. Allocation Modal */}
      <Modal
        isOpen={selectedStat === 'allocation'}
        onClose={closeModal}
        title="자원 배분 현황"
      >
        <div className="space-y-4">
            {timeAllocation.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center text-sm font-black" style={{ backgroundColor: item.color, color: item.color === '#000000' ? 'white' : 'black' }}>
                        {item.value}%
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-black uppercase">{item.label}</div>
                        <div className="text-xs text-gray-500 font-bold">{item.hrs}시간 기록됨</div>
                    </div>
                </div>
            ))}
            <div className="text-xs text-gray-400 font-medium text-center mt-4 pt-4 border-t border-gray-200">
                배정된 시간 블록 데이터를 기반으로 측정되었습니다.
            </div>
        </div>
      </Modal>

      {/* 4. Pro Tier Modal */}
      <Modal
        isOpen={selectedStat === 'pro_tier'}
        onClose={closeModal}
        title="뉴럴 링크 업그레이드"
      >
        <div className="text-center py-4 text-black">
             <Activity className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-pulse" />
             <h3 className="text-lg font-black italic mb-2 uppercase">고급 데이터 잠금 해제</h3>
             <p className="text-sm text-gray-600 mb-6 px-4">
                 정밀 분석, 히트맵, AI 기반 생산성 인사이트를 통해 당신의 출력을 수치적으로 한계까지 끌어올리세요.
             </p>
             
             <div className="bg-gray-50 border-2 border-gray-200 p-4 mb-6 text-left">
                 <div className="flex items-center gap-2 mb-2">
                     <CheckCircle2 className="w-4 h-4 text-purple-600" />
                     <span className="text-xs font-bold">몰입 품질 점수 분석</span>
                 </div>
                 <div className="flex items-center gap-2 mb-2">
                     <CheckCircle2 className="w-4 h-4 text-purple-600" />
                     <span className="text-xs font-bold">피크 타임 성능 히트맵</span>
                 </div>
                 <div className="flex items-center gap-2 mb-2">
                     <CheckCircle2 className="w-4 h-4 text-purple-600" />
                     <span className="text-xs font-bold">장기 속도 및 성장 추이</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-purple-600" />
                     <span className="text-xs font-bold">데이터 내보내기 (CSV/PDF)</span>
                 </div>
             </div>

             <button className="w-full bg-black text-white py-4 font-black tracking-widest text-sm hover:bg-purple-600 transition-colors uppercase">
                 체험 시작하기 ($5/월)
             </button>
             <button onClick={closeModal} className="mt-4 text-xs font-bold text-gray-400 hover:text-black uppercase">
                 아직 평범한 인간으로 남겠습니다
             </button>
        </div>
      </Modal>

    </div>
  );
}
