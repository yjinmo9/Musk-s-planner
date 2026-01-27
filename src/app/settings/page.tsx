'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { 
  Bell, 
  Vibrate, 
  Zap, 
  Timer, 
  User, 
  ChevronRight, 
  Home, 
  ClipboardList, 
  LayoutGrid, 
  BarChart3, 
  Settings,
  CreditCard,
  Palette,
  Clock,
  Radio,
  Monitor,
  Sun,
  Edit2,
  AlertTriangle,
  Download,
  Trash2,
  Check
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TimePicker } from '@/components/ui/TimePicker';

export default function SettingsPage() {
  const router = useRouter();


  // --- State ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Identity
  const [callSign, setCallSign] = useState('ELON');
  const [isEditingCallSign, setIsEditingCallSign] = useState(false);

  // Flight Systems
  const [dayStart, setDayStart] = useState('04:00');
  const [dayEnd, setDayEnd] = useState('22:00');
  const [timeQuantum, setTimeQuantum] = useState('10 분');
  const [colors, setColors] = useState([
    { id: 'black', color: '#000000', label: '업무' },
    { id: 'gray', color: '#666666', label: '회의' },
    { id: 'blue', color: '#2563eb', label: '몰입 업무' },
    { id: 'red', color: '#dc2626', label: '중요' },
  ]);

  // Visuals
  const [theme, setTheme] = useState<'light'|'dark'>('light');

  // Alerts
  const [morningBriefing, setMorningBriefing] = useState(true);
  const [endOfDayReview, setEndOfDayReview] = useState(true);
  const [blockOverrun, setBlockOverrun] = useState(true);

  // Danger Zone
  const [deleteInput, setDeleteInput] = useState('');

  // --- Persistence Effect ---
  useEffect(() => {
    const saved = localStorage.getItem('musk-settings-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCallSign(parsed.callSign || 'ELON');
        setTheme(parsed.theme || 'light');
        
        // Load most recent history entry for current UI state
        if (parsed.history && parsed.history.length > 0) {
          const latest = parsed.history[0]; // History is sorted desc by date
          setTimeQuantum(latest.timeQuantum);
          setDayStart(latest.dayStart);
          setDayEnd(latest.dayEnd);
        }
      } catch (e) {
        console.error("환경 설정을 로드하지 못했습니다.", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('musk-settings-v2');
    let history = [];
    let existingGlobal = { callSign, theme };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        history = parsed.history || [];
      } catch (e) {}
    }

    // Update or add today's entry in history
    const todayEntryIndex = history.findIndex((h: any) => h.date === today);
    const newEntry = { date: today, timeQuantum, dayStart, dayEnd };

    if (todayEntryIndex !== -1) {
      history[todayEntryIndex] = newEntry;
    } else {
      history.unshift(newEntry);
      // Sort history by date descending
      history.sort((a: any, b: any) => b.date.localeCompare(a.date));
    }

    localStorage.setItem('musk-settings-v2', JSON.stringify({
      callSign,
      theme,
      history
    }));
  }, [callSign, timeQuantum, theme, dayStart, dayEnd, isLoaded]);


  // --- Handlers ---

  const handleCallSignSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingCallSign(false);
  };

  const handleExport = () => {
    const element = document.createElement("a");
    const today = new Date().toISOString().split('T')[0];
    const file = new Blob([`Date,Task,Duration,Status\n${today},Deploy 2026 Strategy,2h,Completed`], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = "mission_log.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDeleteAll = () => {
    if (deleteInput === '삭제') {
      // Clear localStorage 관련 키 소거
      Object.keys(localStorage).forEach(key => {
        if (key.includes('musk') || key.includes('guest_planner') || key.includes('monthly_plans')) {
          localStorage.removeItem(key);
        }
      });
      alert("모든 데이터가 소거되었습니다. 시스템을 재시작합니다.");
      window.location.reload();
    }
  };

  // Reusable Toggle Component
  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-12 h-6 border-2 border-black relative transition-colors ${
        active ? 'bg-black' : 'bg-white'
      }`}
    >
      <div
        className={`absolute top-0.5 bottom-0.5 w-4 h-4 bg-white border-2 border-black transition-all ${
          active ? 'right-0.5 bg-black' : 'left-0.5'
        }`}
      />
    </button>
  );

  const { user, signOut } = useAuth();

  return (
    <div className={`min-h-screen w-full p-4 md:p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-[#f8f8f8] text-black'}`}>
      <div className="mx-auto max-w-7xl">
        
        {/* Responsive Header */}
        <div className="mb-8 flex items-end justify-between border-b-4 border-black pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-black p-3 text-white">
                <Settings className="size-8" />
             </div>
             <div>
                <h1 className="text-[32px] font-black italic tracking-tighter uppercase leading-none">SETTINGS</h1>
                <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-widest">System Preferences & Identity</p>
             </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] font-black uppercase italic tracking-widest">
            VERSION 1.0.5
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Identity & Systems (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Commander Identity */}
            <div className={`border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
               <div className="flex items-center gap-8">
                  <div className="relative size-24 border-4 border-black bg-gray-100 flex items-center justify-center overflow-hidden">
                     {user?.user_metadata?.avatar_url ? (
                        <Image src={user.user_metadata.avatar_url} alt="Profile" fill className="object-cover" />
                     ) : (
                        <span className="text-4xl font-black italic">{callSign[0]}</span>
                     )}
                  </div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">COMMANDER</p>
                     {isEditingCallSign ? (
                       <form onSubmit={handleCallSignSave} className="flex items-center gap-2">
                          <input 
                            autoFocus
                            className="text-[32px] font-black italic tracking-tighter uppercase bg-transparent outline-none border-b-4 border-black w-full"
                            value={callSign}
                            onChange={(e) => setCallSign(e.target.value)}
                            onBlur={() => setIsEditingCallSign(false)}
                          />
                          <button type="submit" className="bg-black text-white p-2">
                             <Check className="size-4" />
                          </button>
                       </form>
                     ) : (
                       <h2 
                         onClick={() => setIsEditingCallSign(true)}
                         className="text-[32px] font-black italic tracking-tighter uppercase leading-none cursor-pointer hover:bg-black/5"
                       >
                         {user?.user_metadata?.full_name || user?.email || callSign}
                       </h2>
                     )}
                     <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                           <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
                           <span className="text-[10px] font-black text-green-600 uppercase">ACTIVE SESSION</span>
                        </div>
                        {user && (
                          <button onClick={signOut} className="text-[10px] font-black text-red-600 uppercase hover:underline">ABORT SESSION (SIGN OUT)</button>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* System Preferences */}
            <div className={`border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
               <h3 className="text-sm font-black uppercase italic tracking-tighter mb-8 border-b-2 border-black pb-4">SYSTEM PREFERENCES</h3>
               <div className="space-y-6">
                  {[
                    { label: 'PUSH NOTIFICATIONS', icon: Bell, active: morningBriefing, toggle: () => setMorningBriefing(!morningBriefing) },
                    { label: 'HAPTIC FEEDBACK', icon: Vibrate, active: endOfDayReview, toggle: () => setEndOfDayReview(!endOfDayReview) },
                    { label: 'INTEGRITY MODE', icon: Zap, active: blockOverrun, toggle: () => setBlockOverrun(!blockOverrun) }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <item.icon className="size-5 text-gray-400 group-hover:text-black transition-colors" />
                          <span className="text-sm font-black uppercase">{item.label}</span>
                       </div>
                       <Toggle active={item.active} onClick={item.toggle} />
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => setActiveModal('dayCycle')}
                    className="flex items-center justify-between group cursor-pointer border-t-2 border-black/5 pt-6 transition-all hover:bg-black/5"
                   >
                     <div className="flex items-center gap-4">
                        <Clock className="size-5 text-gray-400 group-hover:text-black transition-colors" />
                        <span className="text-sm font-black uppercase">DAY CYCLE CONFIG</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-black italic">{dayStart} - {dayEnd}</span>
                        <ChevronRight className="size-4" />
                     </div>
                  </div>

                  <div 
                    onClick={() => setActiveModal('timeQuantum')}
                    className="flex items-center justify-between group cursor-pointer border-t-2 border-black/5 pt-6 transition-all hover:bg-black/5"
                   >
                     <div className="flex items-center gap-4">
                        <Timer className="size-5 text-gray-400 group-hover:text-black transition-colors" />
                        <span className="text-sm font-black uppercase">TIME-BOX INTERVAL</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-black italic">{timeQuantum}</span>
                        <ChevronRight className="size-4" />
                     </div>
                  </div>

                  <div 
                    onClick={() => setActiveModal('colorProtocol')}
                    className="flex items-center justify-between group cursor-pointer border-t-2 border-black/5 pt-6 transition-all hover:bg-black/5"
                   >
                     <div className="flex items-center gap-4">
                        <Palette className="size-5 text-gray-400 group-hover:text-black transition-colors" />
                        <span className="text-sm font-black uppercase">COLOR PROTOCOL</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                           {colors.map(c => (
                             <div key={c.id} className="size-3 border border-black" style={{ backgroundColor: c.color }} />
                           ))}
                        </div>
                        <ChevronRight className="size-4 ml-2" />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Side Panels (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Visuals */}
            <div className={`border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">VISUAL PROTOCOL</h3>
               <div className="flex border-4 border-black overflow-hidden">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-3 text-xs font-black uppercase italic transition-all ${theme === 'light' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                  >
                    MUSK
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-3 text-xs font-black uppercase italic transition-all ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    DARK
                  </button>
               </div>
            </div>

            {/* Danger Zone */}
            <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-6 underline decoration-double">DANGER ZONE</h3>
               <div className="space-y-4">
                  <button 
                    onClick={handleExport}
                    className="w-full flex items-center justify-between border-2 border-black p-4 text-[11px] font-black uppercase hover:bg-black hover:text-white transition-all group"
                  >
                    <span>EXPORT MISSION DATA</span>
                    <Download className="size-4" />
                  </button>
                  <button 
                    onClick={() => setActiveModal('deleteData')}
                    className="w-full flex items-center justify-between border-2 border-red-600 p-4 text-[11px] font-black text-red-600 uppercase hover:bg-red-600 hover:text-white transition-all"
                  >
                    <span>PURGE ALL RECORDS</span>
                    <Trash2 className="size-4" />
                  </button>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MODALS --- */}
      {/* (Keep existing modals unchanged but styled slightly better if needed) */}
      <Modal isOpen={activeModal === 'dayCycle'} onClose={() => setActiveModal(null)} title="하루 주기 설정">
          <div className="space-y-6 flex flex-col items-center py-4 text-black text-center">
              <div className="flex gap-8">
                  <TimePicker label="기상 (시작)" value={dayStart} onChange={setDayStart} />
                  <TimePicker label="취침 (종료)" value={dayEnd} onChange={setDayEnd} />
              </div>
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 text-left">
                  <p className="text-[10px] font-bold text-yellow-800 uppercase tracking-widest mb-1">WARNING: GRID SHIFT</p>
                  <p className="text-[10px] font-medium leading-relaxed text-yellow-700">하루 주기를 변경하면 타임라인 그리드가 재구성됩니다.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="h-14 w-full bg-black text-white py-3 font-black text-sm uppercase italic tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-[-4px] translate-y-[-4px] active:translate-x-0 active:translate-y-0">
                  CONFIRM CYCLE
              </button>
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'timeQuantum'} onClose={() => setActiveModal(null)} title="시간 단위 선택">
          <div className="grid grid-cols-1 gap-4 text-black">
              {[
                { label: '5 MIN (HARDCORE)', val: '5 분' },
                { label: '10 MIN (STANDARD)', val: '10 분' },
                { label: '15 MIN (LIGHT)', val: '15 분' },
                { label: '30 MIN (VACATION)', val: '30 분' }
              ].map((opt) => (
                  <button 
                    key={opt.val}
                    onClick={() => { setTimeQuantum(opt.val); setActiveModal(null); }}
                    className={`w-full h-16 px-6 text-left font-black italic border-4 transition-all uppercase flex items-center justify-between ${timeQuantum === opt.val ? 'bg-black text-white border-black' : 'bg-white border-slate-100 hover:border-black'}`}
                  >
                      <span>{opt.label}</span>
                      {timeQuantum === opt.val && <Check className="w-5 h-5 stroke-[4px]" />}
                  </button>
              ))}
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'colorProtocol'} onClose={() => setActiveModal(null)} title="카테고리 프로토콜">
          <div className="space-y-4 text-black">
              {colors.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-4 border-2 border-black p-3">
                      <div className="size-8 shrink-0 border-2 border-black" style={{ backgroundColor: c.color }}></div>
                      <input 
                        value={c.label}
                        onChange={(e) => {
                            const newColors = [...colors];
                            newColors[idx].label = e.target.value.toUpperCase();
                            setColors(newColors);
                        }}
                        className="flex-1 bg-transparent font-black italic outline-none text-sm"
                      />
                  </div>
              ))}
          </div>
      </Modal>

      <Modal isOpen={activeModal === 'deleteData'} onClose={() => setActiveModal(null)} title="위험: 데이터 완전 소거">
          <div className="space-y-6 text-black text-center">
              <p className="text-sm font-bold text-red-600 uppercase">
                  이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 소거됩니다.
              </p>
              <div className="space-y-2">
                  <label className="text-[10px] font-black block uppercase tracking-widest text-gray-400">Type &quot;삭제&quot; to Confirm</label>
                  <input 
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="삭제"
                    className="w-full h-16 border-4 border-red-100 focus:border-red-600 outline-none p-3 font-black text-center uppercase text-xl"
                  />
              </div>
              <button 
                disabled={deleteInput !== '삭제'}
                onClick={handleDeleteAll}
                className="h-16 w-full bg-red-600 disabled:bg-gray-100 text-white py-4 font-black tracking-widest hover:bg-red-700 transition-all uppercase italic shadow-[4px_4px_0px_0px_rgba(185,28,28,1)] active:shadow-none disabled:shadow-none translate-x-[-4px] translate-y-[-4px] active:translate-x-0 active:translate-y-0 disabled:translate-x-0 disabled:translate-y-0"
              >
                  NUKE ALL RECORDS
              </button>
          </div>
      </Modal>
    </div>
  );
}
