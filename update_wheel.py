import re

with open('components/ui/DateTimePicker.tsx', 'r') as f:
    content = f.read()

# 1. Add Refs
refs_insert = '''  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date')
  const containerRef = useRef<HTMLDivElement>(null)
  const hourRef = useRef<HTMLDivElement>(null)
  const minRef = useRef<HTMLDivElement>(null)'''

content = content.replace(
    "  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date')\n  const containerRef = useRef<HTMLDivElement>(null)",
    refs_insert
)

# 2. Add useEffect for passive: false wheel blocking
effect_insert = '''  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Prevent page scroll when using mouse wheel on time pickers
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault()
    }
    
    const hrEl = hourRef.current
    const minEl = minRef.current
    
    if (hrEl) hrEl.addEventListener('wheel', preventScroll, { passive: false })
    if (minEl) minEl.addEventListener('wheel', preventScroll, { passive: false })
    
    return () => {
      if (hrEl) hrEl.removeEventListener('wheel', preventScroll)
      if (minEl) minEl.removeEventListener('wheel', preventScroll)
    }
  }, [isOpen, activeTab])'''

content = content.replace(
    '''  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])''',
    effect_insert
)

# 3. Add ref props to the hour and minute div rollers
hour_div_old = '''                    <div 
                      className="relative flex flex-col items-center"
                      onWheel={(e) => { e.preventDefault(); e.stopPropagation();'''

hour_div_new = '''                    <div 
                      ref={hourRef}
                      className="relative flex flex-col items-center"
                      onWheel={(e) => {'''

min_div_old = '''                    <div 
                      className="relative flex flex-col items-center"
                      onWheel={(e) => { e.preventDefault(); e.stopPropagation();'''
min_div_new = '''                    <div 
                      ref={minRef}
                      className="relative flex flex-col items-center"
                      onWheel={(e) => {'''

content = content.replace(hour_div_old, hour_div_new)
content = content.replace(min_div_old, min_div_new)

with open('components/ui/DateTimePicker.tsx', 'w') as f:
    f.write(content)
print("Updated DateTimePicker.tsx with native wheel event blockers")
