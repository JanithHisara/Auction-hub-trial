import re

with open('components/ui/DateTimePicker.tsx', 'r') as f:
    content = f.read()

# Replace the first instance (Hour)
content = re.sub(
    r'(<!-- Hour Roller -->|{\/\* Hour Roller \*\/})\s*<div\s*className="relative flex flex-col items-center"\s*onWheel={\(e\) => { e\.preventDefault\(\); e\.stopPropagation\(\);',
    r'\1\n                    <div \n                      ref={hourRef}\n                      className="relative flex flex-col items-center"\n                      onWheel={(e) => { ',
    content,
    count=1
)

# Replace the second instance (Minute)
content = re.sub(
    r'(<!-- Minute Roller -->|{\/\* Minute Roller \*\/})\s*<div\s*className="relative flex flex-col items-center"\s*onWheel={\(e\) => { e\.preventDefault\(\); e\.stopPropagation\(\);',
    r'\1\n                    <div \n                      ref={minRef}\n                      className="relative flex flex-col items-center"\n                      onWheel={(e) => { ',
    content,
    count=1
)

with open('components/ui/DateTimePicker.tsx', 'w') as f:
    f.write(content)
print("Regex replacement executed.")
