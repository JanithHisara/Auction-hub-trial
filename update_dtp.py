import re

with open('components/ui/DateTimePicker.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'",
    "import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'"
)

old_time_inputs = '''              <div className="text-center">
                <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-wider block mb-3">Enter Time</span>
                <div className="flex items-center justify-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={time.hour === 0 ? '0' : (time.hour || '')}
                      onChange={(e) => {
                        let val = parseInt(e.target.value.replace(/\D/g, ''))
                        if (isNaN(val) || val === 0) {
                          setTime({ ...time, hour: 0 })
                          return
                        }
                        if (val > 12) val = 12
                        handleTimeChange('hour', val)
                      }}
                      onBlur={(e) => {
                        let val = parseInt(e.target.value)
                        if (isNaN(val) || val < 1) handleTimeChange('hour', 12)
                      }}
                      className="w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-xl font-extrabold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all"
                      placeholder="12"
                    />
                    <span className="absolute -bottom-5 left-0 right-0 text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Hr</span>
                  </div>
                  
                  <span className="text-zinc-300 font-black text-2xl mb-4">:</span>
                  
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={String(time.minute).padStart(2, '0')}
                      onChange={(e) => {
                        let val = parseInt(e.target.value.replace(/\D/g, ''))
                        if (isNaN(val)) {
                          handleTimeChange('minute', 0)
                          return
                        }
                        if (val > 59) val = 59
                        handleTimeChange('minute', val)
                      }}
                      className="w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-xl font-extrabold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all"
                      placeholder="00"
                    />
                    <span className="absolute -bottom-5 left-0 right-0 text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Min</span>
                  </div>
                </div>
              </div>'''

new_time_inputs = '''              <div className="text-center">
                <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-wider block mb-1">Select Time</span>
                <div className="flex items-center justify-center gap-4">
                  
                  {/* Hour Roller */}
                  <div 
                    className="relative flex flex-col items-center"
                    onWheel={(e) => {
                      if (e.deltaY > 0) {
                        handleTimeChange('hour', time.hour === 1 ? 12 : time.hour - 1);
                      } else {
                        handleTimeChange('hour', time.hour === 12 ? 1 : time.hour + 1);
                      }
                    }}
                  >
                    <button 
                      type="button" 
                      onClick={() => handleTimeChange('hour', time.hour === 12 ? 1 : time.hour + 1)} 
                      className="p-1 text-zinc-400 hover:text-[var(--gold)] hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    
                    <div className="w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-xl font-extrabold text-zinc-900 select-none shadow-inner my-1">
                      {time.hour === 0 ? '12' : time.hour}
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => handleTimeChange('hour', time.hour === 1 ? 12 : time.hour - 1)} 
                      className="p-1 text-zinc-400 hover:text-[var(--gold)] hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    
                    <span className="absolute -bottom-4 left-0 right-0 text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Hr</span>
                  </div>
                  
                  <span className="text-zinc-300 font-black text-2xl mb-4">:</span>
                  
                  {/* Minute Roller */}
                  <div 
                    className="relative flex flex-col items-center"
                    onWheel={(e) => {
                      if (e.deltaY > 0) {
                        handleTimeChange('minute', time.minute === 0 ? 59 : time.minute - 1);
                      } else {
                        handleTimeChange('minute', time.minute === 59 ? 0 : time.minute + 1);
                      }
                    }}
                  >
                    <button 
                      type="button" 
                      onClick={() => handleTimeChange('minute', time.minute === 59 ? 0 : time.minute + 1)} 
                      className="p-1 text-zinc-400 hover:text-[var(--gold)] hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    
                    <div className="w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-xl font-extrabold text-zinc-900 select-none shadow-inner my-1">
                      {String(time.minute).padStart(2, '0')}
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => handleTimeChange('minute', time.minute === 0 ? 59 : time.minute - 1)} 
                      className="p-1 text-zinc-400 hover:text-[var(--gold)] hover:bg-zinc-50 rounded-lg transition-colors"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    
                    <span className="absolute -bottom-4 left-0 right-0 text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Min</span>
                  </div>
                  
                </div>
              </div>'''

content = content.replace(old_time_inputs, new_time_inputs)

with open('components/ui/DateTimePicker.tsx', 'w') as f:
    f.write(content)
print("Updated DateTimePicker.tsx")
