'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  format as formatDate, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  isValid
} from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'

interface DateTimePickerProps {
  value: string // Format: YYYY-MM-DDTHH:mm
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  name?: string
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date & time',
  required = false,
  className = '',
  name
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Parse current value
  const parsedDate = value ? new Date(value) : null
  const isValidDate = parsedDate && isValid(parsedDate)

  // Calendar state (viewing month)
  const [currentMonth, setCurrentMonth] = useState(isValidDate ? parsedDate! : new Date())

  // Selected date components
  const selectedDay = isValidDate ? parsedDate!.getDate() : new Date().getDate()

  // Selected time components (12-hour format)
  const getInitialTime = (): { hour: number; minute: number; ampm: 'AM' | 'PM' } => {
    if (!isValidDate) return { hour: 9, minute: 0, ampm: 'AM' }
    let hr = parsedDate!.getHours()
    const ampm = hr >= 12 ? 'PM' : 'AM'
    hr = hr % 12
    hr = hr ? hr : 12 // the hour '0' should be '12'
    return { hour: hr, minute: parsedDate!.getMinutes(), ampm }
  }

  const [time, setTime] = useState<{ hour: number; minute: number; ampm: 'AM' | 'PM' }>(getInitialTime())

  useEffect(() => {
    if (isValidDate) {
      setTime(getInitialTime())
      setCurrentMonth(parsedDate!)
    }
  }, [value])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper to format output
  const updateValue = (newDay: number, newHour: number, newMin: number, newAmpm: 'AM' | 'PM') => {
    let finalHour = newHour
    if (newAmpm === 'PM' && newHour < 12) finalHour += 12
    if (newAmpm === 'AM' && newHour === 12) finalHour = 0

    const pad = (num: number) => String(num).padStart(2, '0')
    
    // Construct local ISO string (YYYY-MM-DDTHH:mm)
    const monthStr = pad(currentMonth.getMonth() + 1)
    const dayStr = pad(newDay)
    const hrStr = pad(finalHour)
    const minStr = pad(newMin)
    const yearStr = currentMonth.getFullYear()

    onChange(`${yearStr}-${monthStr}-${dayStr}T${hrStr}:${minStr}`)
  }

  // Handle day click
  const handleDaySelect = (day: Date) => {
    setCurrentMonth(day)
    updateValue(day.getDate(), time.hour, time.minute, time.ampm)
    // On mobile, switch to time tab automatically after a small delay
    setTimeout(() => {
      setActiveTab('time')
    }, 250)
  }

  // Handle time grid change
  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', newVal: any) => {
    const updatedTime = {
      hour: type === 'hour' ? (newVal as number) : time.hour,
      minute: type === 'minute' ? (newVal as number) : time.minute,
      ampm: type === 'ampm' ? (newVal as 'AM' | 'PM') : time.ampm
    }
    setTime(updatedTime)
    if (isValidDate) {
      updateValue(selectedDay, updatedTime.hour, updatedTime.minute, updatedTime.ampm)
    } else {
      const today = new Date()
      updateValue(today.getDate(), updatedTime.hour, updatedTime.minute, updatedTime.ampm)
    }
  }

  const incrementMinute = () => {
    let nextMin = time.minute + 1
    if (nextMin >= 60) nextMin = 0
    handleTimeChange('minute', nextMin)
  }

  const decrementMinute = () => {
    let prevMin = time.minute - 1
    if (prevMin < 0) prevMin = 59
    handleTimeChange('minute', prevMin)
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Button option lists
  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-left text-white hover:border-[var(--gold)]/50 focus:border-[var(--gold)] focus:outline-none transition-all group"
      >
        <span className={mounted && isValidDate ? 'text-white font-medium' : 'text-[var(--text-muted)]'}>
          {mounted && isValidDate 
            ? formatDate(parsedDate!, 'MMM d, yyyy, hh:mm a') 
            : placeholder}
        </span>
        <CalendarIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute z-[999] bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 p-4 bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col gap-4 animate-fade-in w-72 md:w-[480px]">
          
          {/* Caret pointing down to trigger */}
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0 w-3 h-3 rotate-45 bg-white border-r border-b border-zinc-200 z-10" />

          {/* iOS Style Tab Switcher (Mobile Only) */}
          <div className="bg-zinc-100 p-1 rounded-xl flex gap-1 z-20 md:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('date')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'date'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Date
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('time')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'time'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Time
            </button>
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch z-20">
            
            {/* Left Panel: Calendar Grid */}
            <div className={`w-full md:w-52 flex flex-col ${activeTab === 'date' ? 'block' : 'hidden md:block'}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-zinc-900 font-bold text-sm">
                  {formatDate(currentMonth, 'MMMM yyyy')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                  const isSelected = isValidDate && isSameDay(day, parsedDate!)
                  const isCurrentToday = isToday(day)

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDaySelect(day)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-[var(--gold)] text-black font-bold shadow-md shadow-[var(--gold)]/20' 
                          : isCurrentToday
                            ? 'border border-[var(--gold)] text-[var(--gold)]'
                            : isCurrentMonth
                              ? 'text-zinc-800 hover:bg-zinc-100'
                              : 'text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Vertical Divider (Desktop Only) */}
            <div className="hidden md:block w-[1px] bg-zinc-200 self-stretch" />

            {/* Right Panel: Clickable Time Selector Grids */}
            <div className={`w-full md:w-52 flex flex-col gap-3 ${activeTab === 'time' ? 'block' : 'hidden md:block'}`}>
              
              {/* Active display */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-2 flex items-center justify-between">
                <span className="text-zinc-950 font-bold text-xs uppercase tracking-wide">Selected Time</span>
                <span className="text-zinc-900 font-extrabold text-sm bg-white px-2 py-0.5 border border-zinc-200 rounded-md">
                  {time.hour}:{String(time.minute).padStart(2, '0')} {time.ampm}
                </span>
              </div>

              {/* Hour Grid */}
              <div>
                <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider block mb-1">Hour</span>
                <div className="grid grid-cols-4 gap-1">
                  {hoursList.map(hr => (
                    <button
                      key={hr}
                      type="button"
                      onClick={() => handleTimeChange('hour', hr)}
                      className={`py-1 text-xs font-bold rounded-lg transition-all ${
                        time.hour === hr
                          ? 'bg-[var(--gold)] text-black font-extrabold shadow-sm'
                          : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                      }`}
                    >
                      {hr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minute Grid */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider">Minute</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={decrementMinute}
                      className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 active:scale-90 transition-all"
                      title="Subtract 1 minute"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={incrementMinute}
                      className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 active:scale-90 transition-all"
                      title="Add 1 minute"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {minutesList.map(min => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => handleTimeChange('minute', min)}
                      className={`py-1 text-xs font-bold rounded-lg transition-all ${
                        time.minute === min
                          ? 'bg-[var(--gold)] text-black font-extrabold shadow-sm'
                          : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                      }`}
                    >
                      {String(min).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period Switcher (AM/PM) */}
              <div className="flex gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => handleTimeChange('ampm', 'AM')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    time.ampm === 'AM'
                      ? 'bg-[var(--gold)] text-black shadow-sm font-extrabold'
                      : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange('ampm', 'PM')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    time.ampm === 'PM'
                      ? 'bg-[var(--gold)] text-black shadow-sm font-extrabold'
                      : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                  }`}
                >
                  PM
                </button>
              </div>

            </div>
          </div>

          {/* Close / Confirm Done Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-2 bg-zinc-950 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all uppercase tracking-wider z-20 mt-1"
          >
            Done
          </button>
          
        </div>
      )}
    </div>
  )
}
