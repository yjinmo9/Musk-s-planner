'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Vibrate, Zap, Timer, Download, Trash2, User, ChevronRight, Home, ClipboardList, LayoutGrid, BarChart3, Settings } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(false);
  const [intensityMode, setIntensityMode] = useState(false);
  const [timeBoxInterval, setTimeBoxInterval] = useState('10 MIN');

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-[#f5f5f5] pb-24">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black italic tracking-tight">SETTINGS</h1>
          <div className="mt-2 inline-block bg-black text-white px-3 py-1 text-xs font-bold">
            v1.0.4
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          
          {/* Commander Section */}
          <div className="p-6 border-b-4 border-black">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">COMMANDER</h2>
                <p className="text-sm text-gray-500 font-medium">ACTIVE MISSION: MARS ALPHA</p>
              </div>
            </div>
          </div>

          {/* System Preferences */}
          <div className="p-6 border-b-4 border-black">
            <h3 className="text-sm font-black tracking-wider mb-4">SYSTEM PREFERENCES</h3>
          </div>

          {/* Push Notifications */}
          <div className="p-6 border-b-4 border-black flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span className="font-black tracking-tight">PUSH NOTIFICATIONS</span>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`w-16 h-8 border-4 border-black relative transition-colors ${
                pushNotifications ? 'bg-black' : 'bg-white'
              }`}
            >
              <div
                className={`absolute top-0 w-6 h-6 bg-white border-2 border-black transition-all ${
                  pushNotifications ? 'right-0 bg-black' : 'left-0'
                }`}
              />
            </button>
          </div>

          {/* Haptic Feedback */}
          <div className="p-6 border-b-4 border-black flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5" />
              <span className="font-black tracking-tight">HAPTIC FEEDBACK</span>
            </div>
            <button
              onClick={() => setHapticFeedback(!hapticFeedback)}
              className={`w-16 h-8 border-4 border-black relative transition-colors ${
                hapticFeedback ? 'bg-black' : 'bg-white'
              }`}
            >
              <div
                className={`absolute top-0 w-6 h-6 bg-white border-2 border-black transition-all ${
                  hapticFeedback ? 'right-0 bg-black' : 'left-0'
                }`}
              />
            </button>
          </div>

          {/* Intensity Mode */}
          <div className="p-6 border-b-4 border-black flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5" />
              <span className="font-black tracking-tight">INTENSITY MODE</span>
            </div>
            <button
              onClick={() => setIntensityMode(!intensityMode)}
              className={`w-16 h-8 border-4 border-black relative transition-colors ${
                intensityMode ? 'bg-black' : 'bg-white'
              }`}
            >
              <div
                className={`absolute top-0 w-6 h-6 bg-white border-2 border-black transition-all ${
                  intensityMode ? 'right-0 bg-black' : 'left-0'
                }`}
              />
            </button>
          </div>

          {/* Time-Box Interval */}
          <div className="p-6 border-b-4 border-black flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5" />
              <span className="font-black tracking-tight">TIME-BOX INTERVAL</span>
            </div>
            <button className="flex items-center gap-2 font-black">
              {timeBoxInterval}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Danger Zone */}
          <div className="p-6 border-b-4 border-black">
            <h3 className="text-sm font-black tracking-wider text-red-600">DANGER ZONE</h3>
          </div>

          {/* Export Mission Data */}
          <div className="p-6 border-b-4 border-black">
            <button className="w-full border-4 border-black p-4 font-black tracking-tight flex items-center justify-between hover:bg-black hover:text-white transition-colors">
              <span>EXPORT MISSION DATA</span>
              <Download className="w-5 h-5" />
            </button>
          </div>

          {/* Delete All Data */}
          <div className="p-6">
            <button className="w-full border-4 border-red-600 bg-red-600 text-white p-4 font-black tracking-tight flex items-center justify-between hover:bg-red-700 hover:border-red-700 transition-colors">
              <span>DELETE ALL DATA</span>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t-4 border-black px-8 py-4 flex justify-between items-center z-50">
        <button 
          onClick={() => router.push('/')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button 
          onClick={() => router.push('/daily')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <ClipboardList className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Daily</span>
        </button>
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Board</span>
        </button>
        <button 
          onClick={() => router.push('/stats')}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-black">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Settings</span>
        </button>
      </div>
    </div>
  );
}
