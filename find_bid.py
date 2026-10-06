import re

with open("components/auction-room/TenderRoomClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find any function that submits a bid (looks for fetch('/api/bids'...)
match = re.search(r'(const \w+\s*=\s*async[^{]*\{.*?fetch\(\'/api/bids\'.*?\})', content, re.DOTALL)
if match:
    print(match.group(1)[:500])
else:
    print("No fetch to /api/bids found")
