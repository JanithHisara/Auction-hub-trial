import re

with open("app/admin/auctions/new/progressive/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

matches = re.search(r'(<div[^>]*>\s*<label[^>]*>Auction Type.*?</select>\s*</div>)', c, re.DOTALL)
if matches:
    print(matches.group(1))
else:
    print("Could not find Auction Type block exactly")
