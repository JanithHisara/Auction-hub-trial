import os

files = [
    "app/admin/auctions/new/incremental/page.tsx",
    "app/admin/auctions/new/progressive/page.tsx",
    "app/admin/auctions/new/tender/page.tsx"
]

for filename in files:
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            c = f.read()
        
        if "Auction Type" in c:
            print(f"Found 'Auction Type' in {filename}")
