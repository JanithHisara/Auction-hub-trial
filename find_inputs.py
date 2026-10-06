import re

with open("app/admin/auctions/new/tender/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

matches = re.findall(r'<input[^>]*name="([^"]*start|[^"]*end)"[^>]*>', c)
for m in matches:
    print(m)
