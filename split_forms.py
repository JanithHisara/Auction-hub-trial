import os

source_file = "app/admin/auctions/new/page.tsx"
with open(source_file, "r", encoding="utf-8") as f:
    source_content = f.read()

# Make the directories
os.makedirs("app/admin/auctions/new/progressive", exist_ok=True)
os.makedirs("app/admin/auctions/new/tender", exist_ok=True)
os.makedirs("app/admin/auctions/new/incremental", exist_ok=True)

# 1. Progressive Auction Form
progressive_content = source_content.replace("export default function NewAuction() {", "export default function NewProgressiveAuction() {")
progressive_content = progressive_content.replace(
    "auction_type: 'progressive_elimination_auction' as const,",
    "auction_type: 'progressive_elimination_auction' as const,"
)
# We can just leave the other options in for now but force it or just remove the selection section.
# Actually, the user wants separate files. So let's write the whole file content over, then we can modify them later.

with open("app/admin/auctions/new/progressive/page.tsx", "w", encoding="utf-8") as f:
    f.write(progressive_content.replace("Create Auction", "Create English Auction").replace("auction_type: 'progressive_elimination_auction'", "auction_type: 'progressive_elimination_auction'").replace("auction_type: 'tender_base_fixed_bid'", "auction_type: 'progressive_elimination_auction'").replace("auction_type: 'incremental_approval_auction'", "auction_type: 'progressive_elimination_auction'"))

# 2. Tender (Sealed Bid) Auction Form
tender_content = source_content.replace("export default function NewAuction() {", "export default function NewTenderAuction() {")
with open("app/admin/auctions/new/tender/page.tsx", "w", encoding="utf-8") as f:
    f.write(tender_content.replace("Create Auction", "Create Sealed Bid Auction").replace("auction_type: 'progressive_elimination_auction'", "auction_type: 'tender_base_fixed_bid'").replace("auction_type: 'tender_base_fixed_bid'", "auction_type: 'tender_base_fixed_bid'").replace("auction_type: 'incremental_approval_auction'", "auction_type: 'tender_base_fixed_bid'"))

# 3. Incremental Auction Form
incremental_content = source_content.replace("export default function NewAuction() {", "export default function NewIncrementalAuction() {")
with open("app/admin/auctions/new/incremental/page.tsx", "w", encoding="utf-8") as f:
    f.write(incremental_content.replace("Create Auction", "Create Progressive Elimination Auction").replace("auction_type: 'progressive_elimination_auction'", "auction_type: 'incremental_approval_auction'").replace("auction_type: 'tender_base_fixed_bid'", "auction_type: 'incremental_approval_auction'").replace("auction_type: 'incremental_approval_auction'", "auction_type: 'incremental_approval_auction'"))

