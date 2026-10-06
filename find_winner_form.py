import re

with open("app/admin/gems/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find any form or action related to winners
matches = re.findall(r'<form.*?action.*?select-winner.*?</form>', content, re.DOTALL)
if matches:
    print("Found winner form!")
    print(matches[0][:500])
else:
    print("No select winner form found in page.tsx")
