import os
import re

files = [
    "app/admin/auctions/new/incremental/page.tsx",
    "app/admin/auctions/new/progressive/page.tsx",
    "app/admin/auctions/new/tender/page.tsx"
]

for filename in files:
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            c = f.read()
        
        # We want to remove from {/* Auction Type */} to the next {/*
        pattern = r"\{/\* Auction Type \*/\}.*?(?=\{/\*)"
        c = re.sub(pattern, "", c, flags=re.DOTALL)
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(c)

