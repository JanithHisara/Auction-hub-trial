import re

with open("app/api/admin/auctions/[id]/registrations/[registrationId]/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Add description to select
c = c.replace(
    "auction:auctions(name, auction_start)",
    "auction:auctions(name, description, auction_start)"
)

# Add description to sendAuctionAccessEmail
c = c.replace(
    "auctionDate,",
    "auctionDate,\n          auctionDescription: registration.auction.description,"
)

with open("app/api/admin/auctions/[id]/registrations/[registrationId]/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
