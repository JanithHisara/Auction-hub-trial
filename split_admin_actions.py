import os
import shutil

source = "components/admin/AuctionStatusActions.tsx"
progressive = "components/admin/ProgressiveStatusActions.tsx"
tender = "components/admin/TenderStatusActions.tsx"
incremental = "components/admin/IncrementalStatusActions.tsx"

shutil.copy2(source, progressive)
shutil.copy2(source, tender)
shutil.copy2(source, incremental)

# Replace the component names
def replace_name(file_path, old_name, new_name):
    with open(file_path, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace(old_name, new_name)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(c)

replace_name(progressive, "AuctionStatusActions", "ProgressiveStatusActions")
replace_name(tender, "AuctionStatusActions", "TenderStatusActions")
replace_name(incremental, "AuctionStatusActions", "IncrementalStatusActions")

# Now update the main page to use them
page_path = "app/admin/auctions/[id]/page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page = f.read()

page = page.replace(
    "import AuctionStatusActions from '@/components/admin/AuctionStatusActions'",
    "import ProgressiveStatusActions from '@/components/admin/ProgressiveStatusActions'\nimport TenderStatusActions from '@/components/admin/TenderStatusActions'\nimport IncrementalStatusActions from '@/components/admin/IncrementalStatusActions'"
)

# We need to replace the <AuctionStatusActions /> usage with the dynamic ones
old_usage = r"<AuctionStatusActions\s*auctionId=\{id\}\s*currentStatus=\{auction\.status as [^}]+\}\s*itemCount=\{items\.length\}\s*approvedCount=\{approvedCount\}\s*/>"
new_usage = """{auction.auction_type === 'progressive_elimination_auction' && (
            <ProgressiveStatusActions 
              auctionId={id} 
              currentStatus={auction.status as any} 
              itemCount={items.length}
              approvedCount={approvedCount}
            />
          )}
          {auction.auction_type === 'tender_base_fixed_bid' && (
            <TenderStatusActions 
              auctionId={id} 
              currentStatus={auction.status as any} 
              itemCount={items.length}
              approvedCount={approvedCount}
            />
          )}
          {auction.auction_type === 'incremental_approval_auction' && (
            <IncrementalStatusActions 
              auctionId={id} 
              currentStatus={auction.status as any} 
              itemCount={items.length}
              approvedCount={approvedCount}
            />
          )}"""

import re
page = re.sub(old_usage, new_usage, page, flags=re.DOTALL)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page)

