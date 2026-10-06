import re

with open("components/admin/AdminControls.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find the button for Announce Winner
matches = re.findall(r'<button[^>]*>.*?Announce.*?Winner.*?</button>', content, re.DOTALL | re.IGNORECASE)
if matches:
    print(matches[0][:500])
else:
    print("No Announce Winner button found")
