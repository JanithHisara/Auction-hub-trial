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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

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
  const selectedYear = isValidDate ? parsedDate!.getFullYear() : new Date().getFullYear()
  const selectedMonth = isValidDate ? parsedDate!.getMonth() : new Date().getMonth()
  const selectedDay = isValidDate ? parsedDate!.getDate() : new Date().getDate()

  // Selected time components (12-hour format)
  const getInitialTime = (): { hour: number; minute: number; ampm: 'AM' | 'PM' } => {
    if (!isValidDate) return { hour: 9, minute: 0, ampm: 'AM' }
    let hr = parsedDate!.getHours()
    const ampm = hr >= 12 ? 'PM' : 'AM'
    hr = hr % 12
    hr = hr ? hr : 12 // the hour '0' should be '12'
    return { hour: hr, minute: parsedDate!.getMinutes(), ampm: ampm as 'AM' | 'PM' }
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
    // Switch to time picker tab after a brief delay
    setTimeout(() => {
      setActiveTab('time')
    }, 250)
  }

  // Handle time spinner change
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
      // If no day is selected yet, default to today
      const today = new Date()
      updateValue(today.getDate(), updatedTime.hour, updatedTime.minute, updatedTime.ampm)
    }
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Hours options (1-12)
  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1)
  // Minutes options (00-59)
  const minutesList = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      
      {/* Display trigger button */}
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

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-[999] bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 p-4 bg-white border border-zinc-200 rounded-2xl shadow-xl w-72 flex flex-col gap-4 animate-fade-in">
          
          {/* Caret pointing down to trigger */}
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-r border-b border-zinc-200 z-10" />

          {/* iOS Style Tab Switcher */}
          <div className="bg-zinc-100 p-1 rounded-xl flex gap-1 z-20">
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

          {/* Tab Content */}
          <div className="z-20 min-h-[220px] flex flex-col justify-center">
            {activeTab === 'date' ? (
              /* Calendar View */
              <div className="w-full">
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
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-400 mb-1">
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
            ) : (
              /* Smooth Time Spinner View */
              <div className="w-full flex flex-col items-center">
                
                {/* Spinner Columns Wrapper */}
                <div className="relative w-full max-w-[220px] flex items-center justify-center bg-zinc-50 border border-zinc-100 rounded-2xl py-2 px-1 overflow-hidden h-[120px]">
                  
                  {/* Highlight selector bar overlay */}
                  <div className="absolute inset-x-2 top-[calc(50%-16px)] h-8 bg-zinc-200/60 rounded-md pointer-events-none" />

                  {/* Hour Column */}
                  <TimeSpinnerColumn
                    options={hoursList}
                    selected={time.hour}
                    onChange={(val) => handleTimeChange('hour', val)}
                  />

                  {/* Separator */}
                  <span className="text-zinc-400 font-bold px-1 select-none">:</span>

                  {/* Minute Column */}
                  <TimeSpinnerColumn
                    options={minutesList}
                    selected={time.minute}
                    onChange={(val) => handleTimeChange('minute', val)}
                    formatLabel={(val) => String(val).padStart(2, '0')}
                  />

                  {/* Space */}
                  <div className="w-2" />

                  {/* AM/PM Column */}
                  <TimeSpinnerColumn
                    options={['AM', 'PM']}
                    selected={time.ampm}
                    onChange={(val) => handleTimeChange('ampm', val)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Done Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-2 bg-zinc-900 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all uppercase tracking-wider"
          >
            Done
          </button>
          
        </div>
      )}
    </div>
  )
}

/* Custom time spinner column using CSS Snap with debounced committing */
interface SpinnerColumnProps<T> {
  options: T[]
  selected: T
  onChange: (val: T) => void
  formatLabel?: (val: T) => string
}

function TimeSpinnerColumn({
  options,
  selected,
  onChange,
  formatLabel = (val) => String(val)
}: SpinnerColumnProps<any>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const [localSelected, setLocalSelected] = useState(selected)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Keep local state in sync with external prop changes when not scrolling
  useEffect(() => {
    if (!isScrollingRef.current) {
      setLocalSelected(selected)
    }
  }, [selected])

  // Scroll to selected item
  const scrollToSelected = (smooth = true) => {
    if (!containerRef.current) return
    const index = options.indexOf(selected)
    if (index === -1) return
    const container = containerRef.current
    const itemHeight = 32 // Each item is 32px high
    const targetScroll = index * itemHeight

    if (Math.abs(container.scrollTop - targetScroll) > 1) {
      container.scrollTo({
        top: targetScroll,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  }

  useEffect(() => {
    // Delay scroll slightly to ensure ref is mounted and layout is ready
    const timer = setTimeout(() => scrollToSelected(false), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isScrollingRef.current) {
      scrollToSelected(true)
    }
  }, [selected])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Handle manual scroll snaps
  const handleScroll = () => {
    if (!containerRef.current) return
    isScrollingRef.current = true
    
    const container = containerRef.current
    const itemHeight = 32
    const index = Math.round(container.scrollTop / itemHeight)
    
    if (index >= 0 && index < options.length) {
      const val = options[index]
      if (val !== localSelected) {
        setLocalSelected(val)
      }
      
      // Debounce parent onChange to eliminate main thread lag while scrolling
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false
        onChange(val)
      }, 150)
    }
  }

  return (
    <div className="relative w-12 h-[96px] overflow-hidden select-none">
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
      
      {/* Scrollable list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[32px] scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {options.map((opt, i) => {
          const isSelected = opt === localSelected
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setLocalSelected(opt)
                onChange(opt)
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    top: i * 32,
                    behavior: 'smooth'
                  })
                }
              }}
              className={`w-full h-8 flex items-center justify-center snap-center text-sm font-semibold transition-all ${
                isSelected 
                  ? 'text-black font-extrabold text-base scale-110' 
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {formatLabel(opt)}
            </button>
          )
        })}
      </div>

      {/* Fade overlays for 3D wheel styling (light themed) */}
      <div className="absolute inset-x-0 top-0 h-[32px] bg-gradient-to-b from-zinc-50 to-transparent pointer-events-none opacity-90 animate-fade-in" />
      <div className="absolute inset-x-0 bottom-0 h-[32px] bg-gradient-to-t from-zinc-50 to-transparent pointer-events-none opacity-90 animate-fade-in" />
    </div>
  )
}
