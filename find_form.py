import re

with open("app/admin/auctions/new/tender/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

matches = re.search(r'(<form.*?</form>)', c, re.DOTALL)
if matches:
    print(matches.group(1)[:1500])
