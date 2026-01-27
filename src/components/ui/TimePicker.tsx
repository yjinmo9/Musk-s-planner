import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

interface TimePickerProps {
  label?: string
  value: string // Format "HH:mm"
  onChange: (value: string) => void
}

export function TimePicker({ label, value, onChange }: TimePickerProps) {
  // Parse initial value or default to 00:00
  const [hours, minutes] = value.split(':').map(Number)
  
  const handleIncrement = (type: 'hours' | 'minutes') => {
    if (type === 'hours') {
      const nextHour = (hours + 1) % 24
      onChange(`${nextHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    } else {
      const nextMinute = (minutes + 10) % 60 // 10 minute steps for planner
      onChange(`${hours.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`)
    }
  }

  const handleDecrement = (type: 'hours' | 'minutes') => {
    if (type === 'hours') {
      const prevHour = (hours - 1 + 24) % 24
      onChange(`${prevHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    } else {
      const prevMinute = (minutes - 10 + 60) % 60
      onChange(`${hours.toString().padStart(2, '0')}:${prevMinute.toString().padStart(2, '0')}`)
    }
  }

  return (
    <div className="flex flex-col items-center">
      {label && <span className="mb-2 text-xs font-bold tracking-widest">{label}</span>}
      <div className="flex items-center gap-2">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <button 
            onClick={() => handleIncrement('hours')}
            className="p-1 hover:bg-gray-100 border border-transparent hover:border-black active:bg-black active:text-white transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 flex items-center justify-center border-4 border-black text-xl font-black bg-white">
            {hours.toString().padStart(2, '0')}
          </div>
          <button 
            onClick={() => handleDecrement('hours')}
            className="p-1 hover:bg-gray-100 border border-transparent hover:border-black active:bg-black active:text-white transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        
        <span className="text-xl font-black">:</span>
        
        {/* Minutes */}
        <div className="flex flex-col items-center">
          <button 
            onClick={() => handleIncrement('minutes')}
            className="p-1 hover:bg-gray-100 border border-transparent hover:border-black active:bg-black active:text-white transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 flex items-center justify-center border-4 border-black text-xl font-black bg-white">
            {minutes.toString().padStart(2, '0')}
          </div>
          <button 
            onClick={() => handleDecrement('minutes')}
            className="p-1 hover:bg-gray-100 border border-transparent hover:border-black active:bg-black active:text-white transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
