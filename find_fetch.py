import re

with open("components/auction-room/TenderRoomClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find all fetch calls
matches = re.findall(r'fetch\((.*?)\)', content)
for match in set(matches):
    print(match)
