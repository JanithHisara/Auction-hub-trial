import os
import shutil
import re

source = "components/auction-room/AuctionRoomClient.tsx"
progressive = "components/auction-room/ProgressiveRoomClient.tsx"
tender = "components/auction-room/TenderRoomClient.tsx"
incremental = "components/auction-room/IncrementalRoomClient.tsx"

shutil.copy2(source, progressive)
shutil.copy2(source, tender)
shutil.copy2(source, incremental)

def replace_name(file_path, old_name, new_name):
    with open(file_path, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace(old_name, new_name)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(c)

replace_name(progressive, "AuctionRoomClient", "ProgressiveRoomClient")
replace_name(tender, "AuctionRoomClient", "TenderRoomClient")
replace_name(incremental, "AuctionRoomClient", "IncrementalRoomClient")

# Update page.tsx to route to the new clients
page_path = "app/auction-room/[token]/page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    page = f.read()

page = page.replace(
    "import AuctionRoomClient from '@/components/auction-room/AuctionRoomClient'",
    "import ProgressiveRoomClient from '@/components/auction-room/ProgressiveRoomClient'\nimport TenderRoomClient from '@/components/auction-room/TenderRoomClient'\nimport IncrementalRoomClient from '@/components/auction-room/IncrementalRoomClient'"
)

old_usage = r"<AuctionRoomClient\s*initialAuction=\{access\.auction\}\s*initialItems=\{access\.items\}\s*currentUser=\{access\.user\}\s*registration=\{access\.registration\}\s*rewards=\{access\.rewards\}\s*isHeld=\{access\.isHeld\}\s*adminPhone=\{access\.adminPhone\}\s*eliminations=\{access\.eliminations\}\s*totalRegisteredBidders=\{access\.totalRegisteredBidders\}\s*eliminationCounts=\{access\.eliminationCounts\}\s*/>"
new_usage = """
      {access.auction.auction_type === 'progressive_elimination_auction' && (
        <ProgressiveRoomClient 
          initialAuction={access.auction}
          initialItems={access.items}
          currentUser={access.user}
          registration={access.registration}
          rewards={access.rewards}
          isHeld={access.isHeld}
          adminPhone={access.adminPhone}
          eliminations={access.eliminations}
          totalRegisteredBidders={access.totalRegisteredBidders}
          eliminationCounts={access.eliminationCounts}
        />
      )}
      {access.auction.auction_type === 'tender_base_fixed_bid' && (
        <TenderRoomClient 
          initialAuction={access.auction}
          initialItems={access.items}
          currentUser={access.user}
          registration={access.registration}
          rewards={access.rewards}
          isHeld={access.isHeld}
          adminPhone={access.adminPhone}
          eliminations={access.eliminations}
          totalRegisteredBidders={access.totalRegisteredBidders}
          eliminationCounts={access.eliminationCounts}
        />
      )}
      {access.auction.auction_type === 'incremental_approval_auction' && (
        <IncrementalRoomClient 
          initialAuction={access.auction}
          initialItems={access.items}
          currentUser={access.user}
          registration={access.registration}
          rewards={access.rewards}
          isHeld={access.isHeld}
          adminPhone={access.adminPhone}
          eliminations={access.eliminations}
          totalRegisteredBidders={access.totalRegisteredBidders}
          eliminationCounts={access.eliminationCounts}
        />
      )}
"""

page = re.sub(old_usage, new_usage, page, flags=re.DOTALL)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page)

