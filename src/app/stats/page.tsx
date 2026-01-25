'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, Share2, TrendingUp, Home, ClipboardList, LayoutGrid, Settings } from 'lucide-react';

export default function StatsPage() {
  const router = useRouter();
  // Sample data - replace with real data from your backend
  const efficiency = 75;
  const timeBoxed = 14.2;
  const deepWork = 8.5;
  const weeklyData = [45, 62, 38, 95, 52, 78, 58]; // Sample weekly momentum data

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-[#f5f5f5] pb-24">
      <div className="p-6">
        
        {/* Header */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black italic tracking-tight">MISSION STATS</h1>
            </div>
            <button className="w-12 h-12 border-4 border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Stats Card */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          
          {/* Efficiency Circle */}
          <div className="p-8 border-b-4 border-black flex flex-col items-center">
            <div className="relative w-48 h-48 mb-4">
              {/* Background circle */}
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#e5e5e5"
                  strokeWidth="16"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#000000"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - efficiency / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-black tracking-tight">{efficiency}%</div>
                <div className="text-xs font-bold tracking-wider text-gray-500">EFFICIENCY</div>
              </div>
            </div>

            <h2 className="text-2xl font-black italic tracking-tight mb-1">PEAK PERFORMANCE</h2>
            <p className="text-sm text-gray-500 font-medium tracking-wide">CYCLE: 24H DURATION</p>
          </div>

          {/* Time Stats */}
          <div className="p-6 border-b-4 border-black grid grid-cols-2 gap-4">
            {/* Time Boxed */}
            <div className="border-4 border-black p-6">
              <div className="text-xs font-bold tracking-wider text-gray-500 mb-2">TIME BOXED</div>
              <div className="text-4xl font-black italic tracking-tight">{timeBoxed}H</div>
            </div>

            {/* Deep Work */}
            <div className="border-4 border-black p-6">
              <div className="text-xs font-bold tracking-wider text-gray-500 mb-2">DEEP WORK</div>
              <div className="text-4xl font-black italic tracking-tight">{deepWork}H</div>
            </div>
          </div>

          {/* Weekly Momentum */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black tracking-tight">WEEKLY MOMENTUM</h3>
              <TrendingUp className="w-6 h-6" />
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-40">
              {weeklyData.map((value, index) => {
                const height = (value / 100) * 100; // Convert to percentage
                const isHighest = value === Math.max(...weeklyData);
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
                      <div
                        className={`w-full border-4 border-black transition-all ${
                          isHighest ? 'bg-black' : 'bg-white'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day labels */}
            <div className="flex justify-between mt-4">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <div key={index} className="flex-1 text-center text-xs font-bold text-gray-500">
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* Tasks Completed */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="text-xs font-bold tracking-wider text-gray-500 mb-2">TASKS COMPLETED</div>
            <div className="text-4xl font-black italic tracking-tight">127</div>
            <div className="text-xs text-gray-500 font-medium mt-1">THIS WEEK</div>
          </div>

          {/* Streak */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="text-xs font-bold tracking-wider text-gray-500 mb-2">CURRENT STREAK</div>
            <div className="text-4xl font-black italic tracking-tight">12</div>
            <div className="text-xs text-gray-500 font-medium mt-1">DAYS</div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-black px-8 py-4 flex justify-between items-center z-50">
        <button 
          onClick={() => router.push('/')}
          className="flex flex-col items-center gap-1 text-black/30"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button 
          onClick={() => router.push('/daily')}
          className="flex flex-col items-center gap-1 text-black/30"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase">Daily</span>
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
        <button className="flex flex-col items-center gap-1 text-black">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          <span className="text-[10px] font-black uppercase">Stats</span>
        </button>
        <button 
          onClick={() => router.push('/settings')}
          className="flex flex-col items-center gap-1 text-black/30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase">Settings</span>
        </button>
      </div>
    </div>
  );
}
