import re

with open("app/admin/auctions/new/tender/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Look for the time fields in the form
matches = re.findall(r'<input[^>]*type="datetime-local"[^>]*>', c)
for m in matches:
    print(m)
