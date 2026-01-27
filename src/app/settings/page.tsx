'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Check,
  Plus,
  X
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TimePicker } from '@/components/ui/TimePicker';
import { createClient } from '@/lib/supabase/client';

type Color = { id: string; color: string; label: string };

type UserSettings = {
  day_start: string;
  day_end: string;
  time_box_interval: number;
  color_protocol: Color[];
  theme: 'light' | 'dark';
  push_notifications: boolean;
  haptic_feedback: boolean;
  intensity_mode: boolean;
};

const DEFAULTS: UserSettings = {
  day_start: '04:00',
  day_end: '22:00',
  time_box_interval: 10,
  color_protocol: [
    { id: 'blue', color: '#3b82f6', label: 'DEEP WORK' },
    { id: 'green', color: '#22c55e', label: 'LEARNING' },
    { id: 'yellow', color: '#eab308', label: 'CHORES' },
    { id: 'purple', color: '#a855f7', label: 'MEETING' },
    { id: 'pink', color: '#ec4899', label: 'PERSONAL' },
  ],
  theme: 'light',
  push_notifications: true,
  haptic_feedback: false,
  intensity_mode: true,
};

// For adding new colors
const AVAILABLE_COLORS = [
  { id: 'red', color: '#ef4444' },
  { id: 'orange', color: '#f97316' },
  { id: 'teal', color: '#14b8a6' },
  { id: 'indigo', color: '#6366f1' },
  { id: 'gray', color: '#6b7280' },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // --- State ---
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditingCallSign, setIsEditingCallSign] = useState(false);
  const [callSign, setCallSign] = useState(user?.user_metadata?.full_name || user?.email || 'GUEST');
  const [deleteInput, setDeleteInput] = useState('');
  
  // For color protocol modal
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [newColor, setNewColor] = useState(AVAILABLE_COLORS[0]);
  const [newColorLabel, setNewColorLabel] = useState('');


  const fetchSettings = useCallback(async () => {
    if (!user) {
      const saved = localStorage.getItem('musk-settings-guest');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULTS, ...parsed });
        } catch (e) { console.error("Failed to load guest settings.", e); }
      }
      setIsLoaded(true);
      return;
    }

    const { data, error } = await supabase.from('user_settings').select('*').single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
    } else if (data) {
      setSettings({ ...DEFAULTS, ...data, color_protocol: data.color_protocol || DEFAULTS.color_protocol });
    } else {
      const { error: insertError } = await supabase.from('user_settings').insert({ user_id: user.id, ...DEFAULTS });
      if (insertError) console.error('Error creating initial settings:', insertError);
      else setSettings(DEFAULTS);
    }
    setIsLoaded(true);
  }, [user, supabase]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { if(user) setCallSign(user?.user_metadata?.full_name || user?.email || 'USER'); }, [user]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (!user) {
       localStorage.setItem('musk-settings-guest', JSON.stringify(updated));
       return;
    }

    const { error } = await supabase.from('user_settings').update(newSettings).eq('user_id', user.id);
    if (error) console.error('Error updating settings:', error);
  }, [user, supabase, settings]);

  const handleCallSignSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingCallSign(false);
    if (!user || callSign === (user.user_metadata.full_name || user.email)) return;

    const { error } = await supabase.auth.updateUser({ data: { full_name: callSign } });
    if (error) console.error("Error updating call sign:", error);
  };
  
  // --- Color Protocol Handlers ---
  const handleColorLabelChange = (id: string, label: string) => {
    const newColors = settings.color_protocol.map(c => c.id === id ? { ...c, label: label.toUpperCase() } : c);
    updateSettings({ color_protocol: newColors });
  };

  const handleColorDelete = (id: string) => {
    const newColors = settings.color_protocol.filter(c => c.id !== id);
    updateSettings({ color_protocol: newColors });
  };

  const handleColorAdd = () => {
    if (!newColorLabel.trim()) return;
    const newColorToAdd: Color = { ...newColor, label: newColorLabel.trim().toUpperCase() };
    const newColors = [...settings.color_protocol, newColorToAdd];
    updateSettings({ color_protocol: newColors });
    setNewColorLabel('');
    setIsAddingColor(false);
  };

  // --- Other Handlers ---
  const handleExport = () => { /* ... */ };
  const handleDeleteAll = () => { /* ... */ };
  
  const intervalToLabel = (interval: number) => `${interval} 분`;

  // --- Components ---
  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`w-12 h-6 border-2 border-black relative transition-colors ${active ? 'bg-black' : 'bg-white'}`}>
      <div className={`absolute top-0.5 bottom-0.5 w-4 h-4 bg-white border-2 border-black transition-all ${active ? 'right-0.5 bg-black' : 'left-0.5'}`} />
    </button>
  );

  if (!isLoaded) return <div className={`min-h-screen w-full p-4 md:p-8 transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-zinc-950' : 'bg-[#f8f8f8]'}`}></div>;

  return (
    <div className={`min-h-screen w-full p-4 md:p-8 transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-[#f8f8f8] text-black'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between border-b-4 border-black pb-6">
          {/* Header */}
          <div className="flex items-center gap-4">
             <div className="bg-black p-3 text-white"><Settings className="size-8" /></div>
             <div>
                <h1 className="text-[32px] font-black italic tracking-tighter uppercase leading-none">SETTINGS</h1>
                <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-widest">System Preferences & Identity</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-8">
            {/* Commander Identity */}
            <div className={`border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${settings.theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
               <div className="flex items-center gap-8">
                  <div className="relative size-24 border-4 border-black bg-gray-100 flex items-center justify-center overflow-hidden">
                     {user?.user_metadata?.avatar_url ? (<Image src={user.user_metadata.avatar_url} alt="Profile" fill className="object-cover" />) : (<span className="text-4xl font-black italic">{callSign[0]}</span>)}
                  </div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">COMMANDER</p>
                     {isEditingCallSign ? (
                       <form onSubmit={handleCallSignSave} className="flex items-center gap-2">
                          <input autoFocus className="text-[32px] font-black italic tracking-tighter uppercase bg-transparent outline-none border-b-4 border-black w-full" value={callSign} onChange={(e) => setCallSign(e.target.value)} onBlur={() => setIsEditingCallSign(false)} />
                          <button type="submit" className="bg-black text-white p-2"><Check className="size-4" /></button>
                       </form>
                     ) : (
                       <h2 onClick={() => user && setIsEditingCallSign(true)} className={`text-[32px] font-black italic tracking-tighter uppercase leading-none ${user ? 'cursor-pointer hover:bg-black/5' : ''}`}>{callSign}</h2>
                     )}
                     <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center gap-2"><div className={`size-2 rounded-full animate-pulse ${user ? 'bg-green-500' : 'bg-gray-400'}`}></div><span className={`text-[10px] font-black uppercase ${user ? 'text-green-600' : 'text-gray-500'}`}>{user ? 'ACTIVE SESSION' : 'GUEST MODE'}</span></div>
                        {user && (<button onClick={signOut} className="text-[10px] font-black text-red-600 uppercase hover:underline">ABORT SESSION (SIGN OUT)</button>)}
                     </div>
                  </div>
               </div>
            </div>

            {/* System Preferences */}
            <div className={`border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${settings.theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
               <h3 className="text-sm font-black uppercase italic tracking-tighter mb-8 border-b-2 border-black pb-4">SYSTEM PREFERENCES</h3>
               <div className="space-y-6">
                  {[{ label: 'PUSH NOTIFICATIONS', icon: Bell, key: 'push_notifications' }, { label: 'HAPTIC FEEDBACK', icon: Vibrate, key: 'haptic_feedback' }, { label: 'INTEGRITY MODE', icon: Zap, key: 'intensity_mode' }].map((item) => (
                    <div key={item.key} className="flex items-center justify-between group">
                       <div className="flex items-center gap-4"><item.icon className="size-5 text-gray-400 group-hover:text-black transition-colors" /><span className="text-sm font-black uppercase">{item.label}</span></div>
                       <Toggle active={settings[item.key as keyof UserSettings] as boolean} onClick={() => updateSettings({ [item.key]: !settings[item.key as keyof UserSettings] })} />
                    </div>
                  ))}
                  <div onClick={() => setActiveModal('dayCycle')} className="flex items-center justify-between group cursor-pointer border-t-2 border-black/5 pt-6 transition-all hover:bg-black/5">
                     <div className="flex items-center gap-4"><Clock className="size-5 text-gray-400 group-hover:text-black transition-colors" /><span className="text-sm font-black uppercase">DAY CYCLE CONFIG</span></div>
                     <div className="flex items-center gap-2"><span className="text-sm font-black italic">{settings.day_start} - {settings.day_end}</span><ChevronRight className="size-4" /></div>
                  </div>
                  <div onClick={() => setActiveModal('timeQuantum')} className="flex items-center justify-between group cursor-pointer border-t-2 border-black/5 pt-6 transition-all hover:bg-black/5">
                     <div className="flex items-center gap-4"><Timer className="size-5 text-gray-400 group-hover:text-black transition-colors" /><span className="text-sm font-black uppercase">TIME-BOX INTERVAL</span></div>
                     <div className="flex items-center gap-2"><span className="text-sm font-black italic">{intervalToLabel(settings.time_box_interval)}</span><ChevronRight className="size-4" /></div>
                  </div>
                  <div onClick={() => setActiveModal('colorProtocol')} className="flex items-center justify-between group cursor-pointer border-t-2 border-black/5 pt-6 transition-all hover:bg-black/5">
                     <div className="flex items-center gap-4"><Palette className="size-5 text-gray-400 group-hover:text-black transition-colors" /><span className="text-sm font-black uppercase">COLOR PROTOCOL</span></div>
                     <div className="flex items-center gap-2"><div className="flex -space-x-1">{settings.color_protocol.map(c => (<div key={c.id} className="size-3 border border-black" style={{ backgroundColor: c.color }} />))}</div><ChevronRight className="size-4 ml-2" /></div>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Side Panel */}
          <div className="lg:col-span-4 space-y-8">
            <div className={`border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${settings.theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">VISUAL PROTOCOL</h3>
               <div className="flex border-4 border-black overflow-hidden">
                  <button onClick={() => updateSettings({ theme: 'light' })} className={`flex-1 py-3 text-xs font-black uppercase italic transition-all ${settings.theme === 'light' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}>MUSK</button>
                  <button onClick={() => updateSettings({ theme: 'dark' })} className={`flex-1 py-3 text-xs font-black uppercase italic transition-all ${settings.theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-800'}`}>DARK</button>
               </div>
            </div>
            {/* Danger Zone might go here */}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <Modal isOpen={activeModal === 'dayCycle'} onClose={() => setActiveModal(null)} title="하루 주기 설정">{/* ... */}</Modal>
      <Modal isOpen={activeModal === 'timeQuantum'} onClose={() => setActiveModal(null)} title="시간 단위 선택">{/* ... */}</Modal>
      
      <Modal isOpen={activeModal === 'colorProtocol'} onClose={() => setActiveModal(null)} title="카테고리 프로토콜">
          <div className="space-y-4 text-black">
              {settings.color_protocol.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 group">
                      <div className="size-8 shrink-0 border-2 border-black" style={{ backgroundColor: c.color }}></div>
                      <input 
                        value={c.label}
                        onBlur={() => updateSettings({ color_protocol: settings.color_protocol })}
                        onChange={(e) => {
                            const newColors = settings.color_protocol.map(color => color.id === c.id ? {...color, label: e.target.value.toUpperCase()} : color)
                            setSettings(s => ({...s, color_protocol: newColors}));
                        }}
                        className="flex-1 bg-transparent font-black italic outline-none text-sm"
                      />
                      <button onClick={() => handleColorDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                        <X className="size-4" />
                      </button>
                  </div>
              ))}
              
              <div className="pt-4 border-t-2 border-gray-100">
                {isAddingColor ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        {AVAILABLE_COLORS.filter(ac => !settings.color_protocol.some(c => c.id === ac.id)).map(color => (
                            <button key={color.id} onClick={() => setNewColor(color)} className={`size-6 border-2 transition-all ${newColor.id === color.id ? 'border-black scale-110' : 'border-gray-200'}`} style={{backgroundColor: color.color}}></button>
                        ))}
                    </div>
                    <input 
                        placeholder="새 카테고리 이름"
                        value={newColorLabel}
                        onChange={(e) => setNewColorLabel(e.target.value)}
                        className="w-full bg-gray-100 p-2 font-bold uppercase text-sm outline-none border-2 border-transparent focus:border-black"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setIsAddingColor(false)} className="py-2 text-xs font-bold border-2 border-gray-200">취소</button>
                        <button onClick={handleColorAdd} className="py-2 text-xs font-bold bg-black text-white border-2 border-black">추가</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setIsAddingColor(true)} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 text-xs font-bold text-gray-400 hover:border-black hover:text-black transition-all">
                    <Plus className="size-4"/>
                    <span>새 카테고리 추가</span>
                  </button>
                )}
              </div>
          </div>
      </Modal>

      {/* Other modals ... */}
    </div>
  );
}