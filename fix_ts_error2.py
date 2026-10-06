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
        
        # We want to replace the bad cast with just a simple string literal if possible,
        # or the proper Type cast. 
        # The form data interface expects a specific AuctionType.
        # Let's just remove the `as const` and any multiple casts.
        bad_cast = r"auction_type: '(.*?)' as 'progressive_elimination_auction' \| 'tender_base_fixed_bid' \| 'incremental_approval_auction' as const"
        
        if re.search(bad_cast, c):
            c = re.sub(bad_cast, r"auction_type: '\1'", c)
        
        # Just in case there are other weird casts
        bad_cast2 = r"auction_type: '(.*?)' as const as const"
        if re.search(bad_cast2, c):
            c = re.sub(bad_cast2, r"auction_type: '\1' as const", c)
            
        with open(filename, "w", encoding="utf-8") as f:
            f.write(c)

