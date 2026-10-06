import re

with open("components/auction-room/TenderRoomClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

match = re.search(r'const handle.*?=.*?\{.*?supabase\.from\(.*?\}', content, re.DOTALL)
if match:
    print(match.group(0)[:1000])
else:
    print("Not found")
