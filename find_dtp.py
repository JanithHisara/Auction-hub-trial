import re

with open("components/gems/GemForm.tsx", "r", encoding="utf-8") as f:
    c = f.read()

matches = re.findall(r'<DateTimePicker[^>]*>', c)
for m in matches:
    print(m)
